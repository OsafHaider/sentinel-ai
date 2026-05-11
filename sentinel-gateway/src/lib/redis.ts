import { env } from "../config/env.js";
import { createClient } from "redis";
let redisClient: ReturnType<typeof createClient> | null = null;
export const initRedis = async (): Promise<ReturnType<typeof createClient>> => {
  try {
    redisClient = createClient({ url: env.REDIS_URL });

    redisClient
      .on("error", (err) => console.error("Gateway Redis Error:", err))
      .on("connect", () => console.log("Sentinel-Gateway: Redis Connected"));

    await redisClient.connect();
    redisClient.ping().then(() => console.log("✅ Redis Ping Successful - Connection Verified"));
    return redisClient;
  } catch (error) {
    console.error("Redis Connection Failed:", error);
    throw error;
  }
};

export const getClient = () => {
  if (!redisClient) throw new Error("Redis not initialized!");
  return redisClient;
};

export const getExactCache = async (queryHash: string): Promise<string | null> => {
    try {
        const client = getClient();
        const key = `exact:${queryHash}`;
        return await client.get(key);
    } catch (error) {
        console.error("⚠️ Tier-1 Lookup Error:", error);
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
    return false;
  }
};
export const saveExactCache = async (queryHash: string, response: string): Promise<void> => {
    try {
        const client = getClient();
        const key = `exact:${queryHash}`;

        await client.set(key, response, {
            EX: 86400 
        });

        console.log(`💾 [T1-SAVED] Hash: ${queryHash}`);
    } catch (error) {
        console.error("❌ [T1-SAVE-ERROR] Failed to save to Redis:", error);
        throw error;
    }
};
