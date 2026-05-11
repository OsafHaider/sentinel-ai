import { FastifyInstance } from "fastify";
import { chatController } from "./chat.controller.js";
import { rateLimit } from "../../middleware/rate-limiter.js";

export async function chatRoutes(fastify: FastifyInstance) {
  // Main Chat: 15 req/min
  fastify.post(
    "/",
    { onRequest: rateLimit(15, 60) },
    chatController.handleChat,
  );

  // Ingestion: Strict 3 req/min (Heavy resource usage)
  fastify.post(
    "/ingest",
    { onRequest: rateLimit(3, 60) },
    chatController.handleIngest
  );

  // Dashboard Stats: 60 req/min (1 per second for live feel)
  fastify.get(
    "/stats/stream",
    { onRequest: rateLimit(60, 60) },
    chatController.statsStream
  );

  // Streaming: Moderate 30 req/min
  fastify.get("/stream/:jobId", { onRequest: rateLimit(30, 60) }, chatController.streamChat);

  // Webhooks: No Rate Limit (Secure them via Secret Keys instead)
  fastify.post("/webhook/result", chatController.handleWebhook);
  fastify.post("/webhook/ingest-status", chatController.handleIngestWebhook);
}
