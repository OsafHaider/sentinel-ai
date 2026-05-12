import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { initRedis } from './lib/redis.js';
import { chatRoutes } from './module/chat/chat.routes.js';
import { initMongo } from './config/mongo.js';
import { runHydration } from './lib/hydrator.js';
import { globalErrorHandler } from './middleware/error-handler.js';
import { logger } from './config/logger.js';

/**
 * SERVICE: Sentinel-AI Node.js Gateway Bootstrap Engine
 * DESCRIPTION: Configures global HTTP middlewares, instantiates upstream cluster hooks, handles system hydration states.
 * STANDARDS: Unified server process logging engine injection, sequential infrastructure pooling, structural error isolation.
 */

const fastify = Fastify({ 
  loggerInstance: logger  // Fastify ka built-in framework pipeline ab humare root pino logger se bind ho chuka hai
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

    // Background asynchronous worker execution
    await runHydration();

    setInterval(async () => {
      try {
        await runHydration();
      } catch (hydrationError) {
        logger.error({ err: hydrationError }, "Periodic cache hydration cron interval task aborted");
      }
    }, 6 * 60 * 60 * 1000);

    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
  
  } catch (err) {
    logger.fatal({ err }, "Critical system component layout bootup collapsed");
    process.exit(1);
  }
};

start();
