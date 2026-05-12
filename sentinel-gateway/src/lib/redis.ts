import { env } from "../config/env.js";
import { createClient } from "redis";
import { logger } from "../config/logger.js";

/**
 * SERVICE: Sentinel-AI Redis Context Management Layer
 * DESCRIPTION: Handles connection lifecycles, health state checks, dynamic tiering configurations, and token buckets.
 * STANDARDS: Asynchronous unblocking operations, structural instrumentation logging, atomic script execution pools.
 */

let redisClient: ReturnType<typeof createClient> | null = null;

export const initRedis = async (): Promise<ReturnType<typeof createClient>> => {
  try {
    redisClient = createClient({ url: env.REDIS_URL });

    redisClient
      .on("error", (err) => logger.error({ err }, "Gateway Redis infrastructure communication link broken"))
      .on("connect", () => logger.info("Sentinel-Gateway: Redis instance verification initialized"));

    await redisClient.connect();
    await redisClient.ping();
    
    logger.info("Sentinel-Gateway: Redis active heartbeat verified successfully");
    return redisClient;
  } catch (error) {
    logger.fatal({ err: error }, "Redis critical lifecycle initialization failed");
    throw error;
  }
};

export const getClient = (): ReturnType<typeof createClient> => {
  if (!redisClient) {
    logger.fatal("State Access Violation: Request dispatched before Redis cluster synchronization completion");
    throw new Error("Redis not initialized!");
  }
  return redisClient;
};

export const getExactCache = async (queryHash: string): Promise<string | null> => {
    try {
        const client = getClient();
        return await client.get(`exact:${queryHash}`);
    } catch (error) {
        logger.error({ err: error, queryHash }, "Tier-1 storage lookups unhandled system drop");
        return null;
    }
};

export const isRateLimited = async (userId: string, limit: number, windowSeconds: number): Promise<boolean> => {
  try {
    const client = getClient();
    const key = `ratelimit:${userId}`;
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    const multi = client.multi();
    multi.zRemRangeByScore(key, 0, windowStart);
    multi.zAdd(key, { score: now, value: now.toString() });
    multi.zCard(key);
    multi.expire(key, windowSeconds);

    const results = await multi.exec();
    const requestCount = results[2] as unknown as number;

    return requestCount > limit;
  } catch (error) {
    logger.error({ err: error, userId }, "Rate limiter computation engine structural failure bypass triggered");
    return false;
  }
};

export const saveExactCache = async (queryHash: string, response: string): Promise<void> => {
    try {
        const client = getClient();
        await client.set(`exact:${queryHash}`, response, { EX: 86400 });
    } catch (error) {
        logger.error({ err: error, queryHash }, "Tier-1 write transactional operation aborted");
        throw error;
    }
};
