import { FastifyRequest, FastifyReply } from 'fastify';
import { performance } from 'perf_hooks';
import { addChatTask, chatQueue } from '../../queue/task-queue.js';
import { embeddingService } from '../../services/embeddingService.js';
import { checkCache, initRedis, isRateLimited, setCache } from '../../lib/redis.js';

export const chatController = {
  // POST /v1/chat
  handleChat: async (request: FastifyRequest, reply: FastifyReply) => {
    const start = performance.now();

    try {
      const { query, userId, bypassCache } = request.body as { 
        query: string; 
        userId: string; 
        bypassCache?: boolean
      };

      if (!query || !userId) {
        return reply.status(400).send({ error: 'Missing query or userId' });
      }
const limited = await isRateLimited(userId, 10, 60);
  
  if (limited) {
    console.warn(`🛑 Rate limit hit for user: ${userId}`);
    return reply.status(429).send({ 
      error: "Too many requests!", 
      message: "Bhai, Sentinel-AI ko thora saans lene do. Try again in a minute." 
    });
  }
      // 1. Generate Embedding
      const vector = await embeddingService.generate(query);

      // 2. Sentinel Semantic Cache Check
      if (!bypassCache) {
        const cachedResponse = await checkCache(vector);
        
        if (cachedResponse) {
          const end = performance.now();
          const latency = (end - start).toFixed(2);
          
          console.log(`🚀 SENTINEL CACHE HIT! Latency: ${latency}ms`);
          
          return reply.send({ 
              status: 'completed', 
              response: cachedResponse, 
              source: 'Sentinel-Cache',
              metrics: { latency: `${latency}ms`, cost_saved: "100%" }
          });
        }
      } else {
        console.log("🛠️  BYPASS_CACHE: Forcing full pipeline execution.");
      }

      // 3. Cache Miss (ya Bypass) -> Offload to BullMQ
      const job = await addChatTask({ query, userId, embedding: vector });
      
      const end = performance.now();
      console.log(`📡 Sending to Worker. Gateway Time: ${(end - start).toFixed(2)}ms`);

      return reply.status(202).send({ 
        status: 'queued', 
        jobId: job.id,
        metrics: { queue_time: `${(end - start).toFixed(2)}ms` }
      });

    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }}
,
  // GET /v1/status/:jobId
  getJobStatus: async (request: FastifyRequest, reply: FastifyReply) => {
    const { jobId } = request.params as { jobId: string };
    const job = await chatQueue.getJob(jobId);

    if (!job) return reply.status(404).send({ error: 'Job not found' });

    const state = await job.getState();
    
    if (state === 'failed') {
        return {
            jobId,
            state,
            error: job.failedReason || "Worker Error"
        };
    }

    return { 
        jobId, 
        state, 
        result: job.returnvalue || null 
    };
  },

  // POST /v1/webhook/result (Worker calls this)
  handleWebhook: async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { jobId, response, query, embedding, status, should_cache } = request.body as any;

    // 1. Basic Status Check
    if (status === 'completed' && embedding) {
      console.log(`\n🔥 BOOM! Webhook received for Job: ${jobId}`);

      if (should_cache === true) {
        try {
          await setCache(query, response, embedding);
          console.log(`💾 Sentinel memory updated for: "${query.substring(0, 20)}..."`);
        } catch (cacheError) {
          console.error(`❌ Cache Update Failed for Job ${jobId}:`, cacheError);
        }
      } else {
        console.log(`⚠️ Sentinel: Skipping cache (Negative response or Guardrail hit).`);
      }
      
      return reply.status(200).send({ 
        status: 'success', 
        message: 'Result processed' 
      });
    }

    // 3. Handle Failed Status from Worker
    if (status === 'failed') {
      console.error(`🛑 Worker reported failure for Job ${jobId}`);
      return reply.status(200).send({ status: 'acknowledged', error: 'Worker failed' });
    }

    return reply.status(400).send({ error: 'Invalid webhook payload' });

  } catch (error) {
    // 4. Global Catch: Gateway ko crash hone se bachaye ga
    console.error(`🔥 Critical Webhook Error:`, error);
    return reply.status(500).send({ error: 'Internal Webhook Handler Error' });
  }
}
,
// chat-controller.ts mein naya function
getStats: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const client = await initRedis(); // Redis client lein
        
        const hits = await client.get("stats:total_hits") || "0";
        const saved = await client.get("stats:dollars_saved") || "0";
        
        const totalTimeSavedMinutes = (parseInt(hits) * 2.5 / 60).toFixed(2);
const rateLimitErrors = await client.get("stats:llm_rate_limit_errors") || "0";
       return reply.send({
    project: "Sentinel-AI",
    metrics: {
        total_cache_hits: parseInt(hits),
        llm_throttled_count: parseInt(rateLimitErrors), // 👈 Yeh track karega Groq ki thakaawat
        estimated_cost_saved: `$${parseFloat(saved).toFixed(4)}`,
        efficiency_status: parseInt(rateLimitErrors) > 10 ? "Under Heavy Load" : "Healthy"
    }
});
    } catch (error) {
        return reply.status(500).send({ error: "Could not fetch stats" });
    }
}

};
