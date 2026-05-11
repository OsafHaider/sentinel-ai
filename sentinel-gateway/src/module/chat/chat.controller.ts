import { FastifyRequest, FastifyReply } from "fastify";
import { getClient, getExactCache, saveExactCache } from "../../lib/redis.js";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { addChatTask } from "../../queue/task-queue.js";
import { sentinelEmitter } from "../../lib/event.js";
import { addIngestTask } from "../../queue/add-ingest-task.js";
import { ApiError } from "../../utils/api-error.js";
import { generateQueryHash } from "../../utils/hash.js";
import { performance } from "perf_hooks";
export const chatController = {
  handleChat: async (request: FastifyRequest, reply: FastifyReply) => {
    const start = performance.now(); // 🕒 Timer start for all paths
    const { query, bypassCache } = request.body as any;
    const userId = request.ip || "unknown-ip";
    const client = getClient(); // Singleton client call

    if (!query) throw new ApiError(400, "Missing query parameter");

    const queryHash = generateQueryHash(query);
    const jobId = `query-${queryHash}`;

    // --- TIER-1: LOOKUP ---
    if (!bypassCache) {
        const exactMatch = await getExactCache(queryHash);
        if (exactMatch) {
            const latency = (performance.now() - start).toFixed(2); // Tier-1 speed
            await Promise.all([
                client.incr("stats:t1_hits"),
                client.incrByFloat("stats:dollars_saved", 0.025),
                client.set("stats:last_latency", latency) // Save Gateway Latency
            ]);

            sentinelEmitter.emit("stats-update");
            return reply.send({
                status: "completed",
                response: exactMatch,
                source: "Sentinel-Exact-Cache",
            });
        }
    }

    // --- TIER-2/3: OFFLOAD ---
    // Save start time to Redis so Webhook can calculate Total Round-trip Latency
    await client.set(`start_time:${jobId}`, start.toString(), {
        EX: 3600, // 1 hour expiry
    });

    const job = await addChatTask({ query, userId, jobId }, bypassCache);

    return reply.status(202).send({
        status: "queued",
        jobId: job.id,
        info: bypassCache ? "Cache bypassed" : "Cache miss, offloaded to worker.",
    });
},


  // 📡 WEBHOOK: Worker results handle karein
 handleWebhook: async (request: FastifyRequest, reply: FastifyReply) => {
    const { jobId, response, query, status, should_cache, is_semantic, is_knowledge_miss } = request.body as any;
    const client = getClient();

    if (status !== "completed") throw new ApiError(400, "Invalid webhook status");

    // 🛡️ IDEMPOTENCY LOCK: Prevent double counting
    const lockKey = `processed:${jobId}`;
    const alreadyProcessed = await client.get(lockKey);
    if (alreadyProcessed) return reply.status(200).send({ status: "already_processed" });
    
   await client.set(lockKey, "true", {
    EX: 3600,
    NX: true
});


    const queryHash = generateQueryHash(query);

    // 🕒 LATENCY CALCULATION: Gateway Start to Webhook Finish
    const startTimeStr = await client.get(`start_time:${jobId}`);
    if (startTimeStr) {
        const totalLatency = (performance.now() - parseFloat(startTimeStr)).toFixed(2);
        await client.set("stats:last_latency", totalLatency);
        await client.del(`start_time:${jobId}`); // Clean up
    }

    // --- 📊 STATS LOGIC ---
    if (is_knowledge_miss === true) {
        await client.incr("stats:guardrail_blocks");
    } else if (is_semantic === true) {
        await Promise.all([
            client.incr("stats:t2_hits"),
            client.incrByFloat("stats:dollars_saved", 0.015),
            saveExactCache(queryHash, response),
        ]);
    } else {
        await client.incr("stats:llm_calls");
        if (should_cache === true) {
            await saveExactCache(queryHash, response);
        }
    }

    // --- FINAL SIGNALS ---
    sentinelEmitter.emit("stats-update");
    sentinelEmitter.emit(`job-done:${jobId}`, { jobId, response, status: "completed" });

    return reply.status(200).send({ status: "success" });
},


  // 📊 SSE: DASHBOARD STREAM
  statsStream: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.hijack();
      const rawRes = reply.raw;
      const client = getClient();

      rawRes.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Credentials': 'true'
      });

      const sendStats = async () => {
          const [t1, t2, misses, saved, blocks, files,latency] = await Promise.all([
              client.get("stats:t1_hits"),
              client.get("stats:t2_hits"),
              client.get("stats:llm_calls"),
              client.get("stats:dollars_saved"),
              client.get("stats:guardrail_blocks"),
              client.get("stats:ingested_files"),
              client.get("stats:last_latency")
          ]);
          
          rawRes.write(`data: ${JSON.stringify({
              t1: parseInt(t1 || "0"),
              t2: parseInt(t2 || "0"),
              misses: parseInt(misses || "0"),
              savings: parseFloat(saved || "0").toFixed(4),
              blocks: parseInt(blocks || "0"),
              files: parseInt(files || "0"),
              timestamp: new Date().toLocaleTimeString(),
              latency: latency || "0.00",
          })}\n\n`);
      };

      // 🔔 Naya Notification Event Listener
      const onIngestFinished = (data: any) => {
          rawRes.write(`event: notification\n`);
          rawRes.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      await sendStats();
      
      const onUpdate = () => sendStats();
      sentinelEmitter.on('stats-update', onUpdate);
      sentinelEmitter.on('ingest-finished', onIngestFinished);

      request.raw.on('close', () => {
          sentinelEmitter.off('stats-update', onUpdate);
          sentinelEmitter.off('ingest-finished', onIngestFinished);
          rawRes.end();
      });
    } catch (error) {
      console.error("[STATS-STREAM-ERROR]", error);
      throw error;
    }
  },

  // 📡 SSE: Individual Job Stream
  streamChat: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { jobId } = request.params as { jobId: string };

      if (!jobId) throw new ApiError(400, "jobId parameter is required");

      // 1. Fastify ko batayein ke hum raw response handle karenge
      reply.hijack();
      const rawRes = reply.raw;

      // 2. Sahi SSE Headers (CORS ke sath)
      rawRes.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Credentials": "true",
      });

      // Browser ko signal bhejen ke hum connect ho gaye hain
      rawRes.write(": ok\n\n");

      const eventName = `job-done:${jobId}`;
      console.log(`📡 [SSE-OPEN] Waiting for Job: ${jobId}`);

      // 3. Message Handler
      const onMessage = (data: any) => {
        console.log(`📤 [SSE-SEND] Delivering result for: ${jobId}`);
        rawRes.write(`data: ${JSON.stringify(data)}\n\n`);

        // Response milte hi connection khatam (Cleanup)
        sentinelEmitter.off(eventName, onMessage);
        rawRes.end();
      };

      // Listen once
      sentinelEmitter.once(eventName, onMessage);

      // 4. Cleanup agar user tab close karde
      request.raw.on("close", () => {
        sentinelEmitter.off(eventName, onMessage);
        console.log(`🔌 [SSE-CLOSE] Connection closed for: ${jobId}`);
      });
    } catch (error) {
      console.error("[STREAM-CHAT-ERROR]", error);
      throw error;
    }
  },

  handleIngest: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file(); // multipart/form-data handle karega
    if (!data) throw new ApiError(400, "No file uploaded");

    // 1. File Path set karein
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    const filePath = path.join(uploadDir, `${Date.now()}-${data.filename}`);

    // 2. File ko disk par save karein (Streaming way)
    await pipeline(data.file, fs.createWriteStream(filePath));

    // 3. Worker ko task bhejien
    const job = await addIngestTask({
      filePath,
      fileName: data.filename,
    });

    return reply.send({
      status: "processing",
      message: "File uploaded, Sentinel is learning...",
      jobId: job.id,
    });
  },

 handleIngestWebhook: async (request: FastifyRequest, reply: FastifyReply) => {
    const { fileName, status, message } = request.body as any;
    const client = getClient();

    if (status !== "completed") {
      throw new ApiError(400, "Invalid ingest webhook status");
    }

    console.log(`📚 [KNOWLEDGE-SYNC] Sentinel learned from: ${fileName}`);

    // 1. Stats increment
    await client.incr("stats:ingested_files");

    // 2. 🔥 DUAL SIGNAL: 
    // Pehla: Dashboard ke cards refresh karne ke liye
    sentinelEmitter.emit("stats-update");

    // Dusra: UI par notification popup dikhane ke liye
    sentinelEmitter.emit("ingest-finished", { 
      fileName, 
      message: message || `Sentinel has learned from ${fileName}` 
    });

    return reply.status(200).send({ status: "received" });
},


};
