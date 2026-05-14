import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { initRedis } from './lib/redis.js';
import { chatRoutes } from './module/chat/chat.routes.js';
import { initMongo } from './config/mongo.js';
import { globalErrorHandler } from './middleware/error-handler.js';
import { logger } from './config/logger.js';

/**
 * SERVICE: Sentinel-AI Node.js Gateway Bootstrap Engine
 * DESCRIPTION: Configures global HTTP middlewares, instantiates upstream cluster hooks, routes chat flows.
 * STANDARDS: Unified server process logging engine injection, sequential infrastructure pooling, structural error isolation.
 */

const fastify = Fastify({ 
  loggerInstance: logger  
});

fastify.register(cors, {
  origin: [env.CLIENT_URL]
});

await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
});

const start = async (): Promise<void> => {
  try {
    await initRedis();
    await initMongo();
    
    await fastify.register(chatRoutes, { prefix: '/api/v1/chat' });

    fastify.setErrorHandler(globalErrorHandler);

    fastify.get('/health', (_, reply) => {
      reply.send({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // 🛡️ THE ARCHITECT CLEANUP: Heavy background cron jobs and startup database scans removed completely.
    // Real-time cache promotion loop has been offloaded entirely to the automated python background services.
    
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
  
  } catch (err) {
    logger.fatal({ err }, "Critical system component layout bootup collapsed");
    process.exit(1);
  }
};

start();
