import Fastify from 'fastify'
import { env } from './config/env.js'
import { initRedis } from './lib/redis.js'
import { chatRoutes } from './module/chat/chat.routes.js';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { initMongo } from './config/mongo.js';
import { runHydration } from './lib/hydrator.js';
import { globalErrorHandler } from './middleware/error-handler.js';

const fastify = Fastify({ logger: false });
fastify.register(cors, {
  origin: [env.CLIENT_URL]
})
await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
});
const start = async () => {
  try {
    await initRedis();
    await initMongo();
    // 1. Initialize Essential Services
    console.log("redis & Sentinel-AI Initialized");

    await fastify.register(chatRoutes, { prefix: '/api/v1/chat' });

    // 🔥 Register Global Error Handler
    fastify.setErrorHandler(globalErrorHandler);

    // 3. Health Check
    fastify.get('/health', (_, reply) => {
      reply.send({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Start Hydration immediately on boot
    // runHydration();

    // Schedule Hydration (Every 6 hours)
    setInterval(runHydration, 6 * 60 * 60 * 1000);

    // 5. Start Server
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
  
  } catch (err) {
    console.error("Gateway Startup Failed:", err);
    process.exit(1);
  }
}

start();
