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
  // Chunk 1: Main Query Processing Interface
  handleChat: async (request: FastifyRequest, reply: FastifyReply) => {
    const start = performance.now();
    const { query, bypassCache } = request.body as any;
    const userId = request.ip || "unknown-ip";
    const client = getClient();

    if (!query) throw new ApiError(400, "Missing query parameter");

    const queryHash = generateQueryHash(query);
    const jobId = `query-${queryHash}`;

    request.log.info({ userId, jobId, bypassCache }, "Incoming chat request initialized");

    if (!bypassCache) {
      const exactMatch = await getExactCache(queryHash);
      if (exactMatch) {
        const latency = (performance.now() - start).toFixed(2);
        
        await Promise.all([
          client.incr("stats:t1_hits"),
          client.incrByFloat("stats:dollars_saved", 0.025),
          client.set("stats:last_latency", latency),
        ]);

        sentinelEmitter.emit("stats-update");
        
        request.log.info({ jobId, latency, hitType: "T1_EXACT" }, "Cache hit served successfully");
        
        return reply.send({
          status: "completed",
          response: exactMatch,
          source: "Sentinel-Exact-Cache",
        });
      }
    }

    await client.set(`start_time:${jobId}`, start.toString(), { EX: 3600 });

    const job = await addChatTask({ query, userId, jobId }, bypassCache);

    request.log.info({ jobId, jobIdWorker: job.id }, "Cache miss: Request queued to Python worker");

    return reply.status(202).send({
      status: "queued",
      jobId: job.id,
      info: bypassCache ? "Cache bypassed" : "Cache miss, offloaded to worker.",
    });
  },

  // Chunk 2: Document Knowledge Base Ingestion Pipeline
  handleIngest: async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();
    if (!data) throw new ApiError(400, "No file uploaded");

    const uploadDir = path.join(process.cwd(), "uploads");
    
    // Non-blocking asynchronous folder structure checks
    try {
      await fs.promises.access(uploadDir);
    } catch {
      await fs.promises.mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, `${Date.now()}-${data.filename}`);

    request.log.info({ fileName: data.filename }, "Knowledge base file uploading started");

    await pipeline(data.file, fs.createWriteStream(filePath));

    const job = await addIngestTask({
      filePath,
      fileName: data.filename,
    });

    request.log.info({ jobId: job.id, fileName: data.filename }, "Ingestion upload completed and task emitted to scheduler");

    return reply.send({
      status: "processing",
      message: "File uploaded, Sentinel is learning...",
      jobId: job.id,
    });
  },

   // Chunk 3: Real-time Live Dashboard Analytics Engine (SSE)
  statsStream: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.hijack();
      const rawRes = reply.raw;
      const client = getClient();

      rawRes.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Credentials": "true",
      });

      const sendStats = async (): Promise<void> => {
        try {
          const [t1, t2, misses, saved, blocks, files, latency, tokens, spend, source] = await Promise.all([
    client.get("stats:t1_hits"),
    client.get("stats:t2_hits"),
    client.get("stats:llm_calls"),
    client.get("stats:dollars_saved"),
    client.get("stats:guardrail_blocks"),
    client.get("stats:ingested_files"),
    client.get("stats:last_latency"),
    client.get("stats:total_tokens"),
    client.get("stats:actual_spend"),
    client.get("stats:last_source"),
  ]);

         rawRes.write(
    `data: ${JSON.stringify({
      t1: parseInt(t1 || "0"),
      t2: parseInt(t2 || "0"),
      misses: parseInt(misses || "0"),
      savings: parseFloat(saved || "0").toFixed(4), // Dashboard precision match
      blocks: parseInt(blocks || "0"),
      files: parseInt(files || "0"),
      latency: latency || "0.00",
      tokens: parseInt(tokens || "0"), // Ensure tokens are sent as numbers
      spend: parseFloat(spend || "0").toFixed(6), // Actual billing data
      source: source || "cloud",
      timestamp: new Date().toLocaleTimeString(),
    })}\n\n`,
  );
        } catch (streamWriteError) {
          request.log.error({ err: streamWriteError }, "Analytics stream calculation data layer fetching dropped");
        }
      };

      const onIngestFinished = (data: any): void => {
        rawRes.write(`event: notification\n`);
        rawRes.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      await sendStats();

      const onUpdate = (): void => { void sendStats(); };
      sentinelEmitter.on("stats-update", onUpdate);
      sentinelEmitter.on("ingest-finished", onIngestFinished);

      request.raw.on("close", () => {
        sentinelEmitter.off("stats-update", onUpdate);
        sentinelEmitter.off("ingest-finished", onIngestFinished);
        rawRes.end();
      });
    } catch (error) {
      request.log.error({ err: error }, "Dashboard SSE connection interface failure");
      throw error;
    }
  },

  // Chunk 4: Asynchronous Client Long-poll Listener Interface (SSE Response Mapping)
  streamChat: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { jobId } = request.params as { jobId: string };
      if (!jobId) throw new ApiError(400, "jobId parameter is required");

      reply.hijack();
      const rawRes = reply.raw;

      rawRes.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Credentials": "true",
      });

      rawRes.write(": ok\n\n");

      const eventName = `job-done:${jobId}`;

      const onMessage = (data: any): void => {
        rawRes.write(`data: ${JSON.stringify(data)}\n\n`);
        sentinelEmitter.off(eventName, onMessage);
        rawRes.end();
      };

      sentinelEmitter.once(eventName, onMessage);

      request.raw.on("close", () => {
        sentinelEmitter.off(eventName, onMessage);
      });
    } catch (error) {
      request.log.error({ err: error, jobId: (request.params as any)?.jobId }, "Job stream listener pipeline crashed");
      throw error;
    }
  },

  // Chunk 5: Python Engine Processing Event Sync Webhook
  handleWebhook: async (request: FastifyRequest, reply: FastifyReply) => {
    const {
      jobId,
      response,
      query,
      status,
      should_cache,
      is_semantic,
      is_knowledge_miss,
      usage,
    } = request.body as any;

    const client = getClient();
    if (status !== "completed") throw new ApiError(400, "Invalid webhook status");

    // 🛡️ IDEMPOTENCY LOCK
    const lockKey = `processed:${jobId}`;
    const alreadyProcessed = await client.get(lockKey);
    if (alreadyProcessed) {
      request.log.warn({ jobId }, "Duplicate webhook dropped");
      return reply.status(200).send({ status: "already_processed" });
    }

    await client.set(lockKey, "true", { EX: 3600, NX: true });

    const queryHash = generateQueryHash(query);

    // 🕒 LATENCY CALCULATION
    let totalLatency: string | null = null;
    const startTimeStr = await client.get(`start_time:${jobId}`);
    if (startTimeStr) {
      totalLatency = (performance.now() - parseFloat(startTimeStr)).toFixed(2);
      await client.set("stats:last_latency", totalLatency);
      await client.del(`start_time:${jobId}`);
    }

    // 📍 SOURCE DETERMINATION (Cloud / Cache / Blocked)
    let finalSource = "cloud";
    if (is_knowledge_miss) finalSource = "blocked";
    if (is_semantic) finalSource = "cache";

    await client.set("stats:last_source", finalSource);

    const evaluationMetrics: Record<string, any> = { jobId, finalSource, totalLatency };

    // --- 📊 STATS & COST LOGIC (Cloud Optimized) ---
    if (is_knowledge_miss === true) {
      await client.incr("stats:guardrail_blocks");
      evaluationMetrics.outcome = "GUARDRAIL_BLOCKED";
    } else if (is_semantic === true) {
      await Promise.all([
        client.incr("stats:t2_hits"),
        client.incrByFloat("stats:dollars_saved", 0.015),
        saveExactCache(queryHash, response),
      ]);
      evaluationMetrics.outcome = "T2_SEMANTIC_HIT";
    } else {
      await client.incr("stats:llm_calls");
      evaluationMetrics.outcome = "LLM_CLOUD_EXECUTION";

      // Billing tracking for Cloud Tokens
      if (usage && usage.total_tokens) {
        const totalTokens = parseInt(usage.total_tokens);
        const actualCost = (totalTokens / 1000000) * 0.05;

        await Promise.all([
          client.incrBy("stats:total_tokens", totalTokens),
          client.incrByFloat("stats:actual_spend", actualCost),
        ]);
        evaluationMetrics.cloudBilling = { totalTokens, costUSD: actualCost };
      }

      if (should_cache === true) {
        await saveExactCache(queryHash, response);
        evaluationMetrics.cachePromoted = true;
      }
    }

    request.log.info(evaluationMetrics, "Sentinel execution lifecycle completed");

    sentinelEmitter.emit("stats-update");
    sentinelEmitter.emit(`job-done:${jobId}`, { jobId, response, status: "completed" });

    return reply.status(200).send({ status: "success" });
  },


  // Chunk 6: Knowledge Base Synchronization Callback Pipeline
  handleIngestWebhook: async (request: FastifyRequest, reply: FastifyReply) => {
    const { fileName, status, message } = request.body as any;
    const client = getClient();

    if (status !== "completed") throw new ApiError(400, "Invalid ingest webhook status");

    await client.incr("stats:ingested_files");

    request.log.info({ fileName }, "Vector state transformation synced to gateway database store");

    sentinelEmitter.emit("stats-update");
    sentinelEmitter.emit("ingest-finished", {
      fileName,
      message: message || `Sentinel has learned from ${fileName}`,
    });

    return reply.status(200).send({ status: "received" });
  },

};
