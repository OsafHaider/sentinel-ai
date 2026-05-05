
import Fastify from 'fastify'
import { env } from './config/env.js'
import { initRedis } from './lib/redis.js'
import { chatRoutes } from './module/chat/chat.routes.js';
import { setupHydrationCron } from './cron/hydaration.js';

const fastify = Fastify()
fastify.register(chatRoutes, { prefix: '/api/v1/chat' });
fastify.get('/health', function (request, reply) {
  reply.send({ status: 'ok',
    timestamp: new Date().toISOString() })
})
const start = async () => {
  try {
    await initRedis()
     await setupHydrationCron();
    await fastify.listen({ port: env.PORT })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
