import { FastifyReply, FastifyRequest } from "fastify";
import { getClient } from "../lib/redis.js";


export const rateLimit = (limit: number, window: number) => {
  const redis = getClient(); 
  return async (request:FastifyRequest, reply:FastifyReply) => {
    const ip = request.ip;
    const key = `ratelimit:${ip}:${request.url}`;

    try {
      const current = await redis.incr(key);
      
      // Pehli request par expiry set karo
      if (current === 1) {
        await redis.expire(key, window);
      }

      if (current > limit) {
        const ttl = await redis.ttl(key);
        return reply.code(429).send({
          error: 'Rate Limit Exceeded',
          message: `Too many requests. Try again in ${ttl} seconds.`,
          context: "Sentinel-AI Guardrail"
        });
      }
    } catch (err) {
      request.log.error({ err }, "Redis Rate Limiter Error");
    }
  };
};
