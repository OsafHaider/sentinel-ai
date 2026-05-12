import { FastifyInstance } from "fastify";
import { chatController } from "./chat.controller.js";
import { rateLimit } from "../../middleware/rate-limiter.js";

/**
 * SERVICE: Sentinel-AI Routing Architecture Registry
 * DESCRIPTION: Registers exposed API interfaces, hooks specific rate limit bounds, and establishes secure network endpoints.
 * STANDARDS: Declarative request lifecycle registration, declarative rate management hooks, clear transport decoupling.
 */
export async function chatRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    "/",
    { onRequest: rateLimit(15, 60) },
    chatController.handleChat
  );

  fastify.post(
    "/ingest",
    { onRequest: rateLimit(3, 60) },
    chatController.handleIngest
  );

  fastify.get(
    "/stats/stream",
    { onRequest: rateLimit(60, 60) },
    chatController.statsStream
  );

  fastify.get(
    "/stream/:jobId", 
    { onRequest: rateLimit(30, 60) }, 
    chatController.streamChat
  );

  fastify.post("/webhook/result", chatController.handleWebhook);
  
  fastify.post("/webhook/ingest-status", chatController.handleIngestWebhook);
}
