import { env } from "../config/env.js";
import { createClient, SCHEMA_FIELD_TYPE, SCHEMA_VECTOR_FIELD_ALGORITHM, SearchReply } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export const initRedis = async (): Promise<ReturnType<typeof createClient>> => {
  try {
    redisClient = createClient({ url: env.REDIS_URL });

    redisClient
      .on("error", (err) => console.error("❌ Redis Client Error:", err))
      .on("connect", () => console.log("✅ Redis Connected (Stack)"));

    await redisClient.connect();

    try {
      await redisClient.ft.create("idx:semantic_cache", {
        "$.embedding": {
          type: SCHEMA_FIELD_TYPE.VECTOR,
          AS: "embedding", 
          ALGORITHM: SCHEMA_VECTOR_FIELD_ALGORITHM.HNSW,
          TYPE: "FLOAT32",
          DIM: 384,
          DISTANCE_METRIC: "COSINE",
        },
        "$.response": { type: SCHEMA_FIELD_TYPE.TEXT, AS: "response" },
        "$.query": { type: SCHEMA_FIELD_TYPE.TEXT, AS: "query" },
      }, {
        ON: "JSON",
        PREFIX: "cache:",
      });
      console.log("✅ Semantic Index Created.");
    } catch (e: any) {
      if (e.message.includes("Index already exists")) {
        console.log("ℹ️ Redis Index ready.");
      } else {
        console.error("❌ Index Creation Failed:", e);
      }
    }
    return redisClient;
  } catch (error) {
    console.error("❌ Redis Connection Failed:", error);
    throw error;
  }
};

const getClient = () => {
  if (!redisClient) throw new Error("Redis not initialized!");
  return redisClient;
};

export const checkCache = async (vector: number[]) => {
  try {
    const client = getClient();
    const vectorBuffer = Buffer.from(new Float32Array(vector).buffer);

    // KNN search sabse best hai semantic cache ke liye
    const results = await client.ft.search('idx:semantic_cache', 
      `*=>[KNN 1 @embedding $vec AS score]`, { 
      PARAMS: { 
        vec: vectorBuffer 
      },
      RETURN: ["response", "score"], // Sirf kaam ki cheezein mangwao
      SORTBY: 'score',
      DIALECT: 2
    }) as SearchReply;

    if (results.total > 0) {
      const topDoc = results.documents[0];
      const score = parseFloat(topDoc.value.score as string);
      
      // 0.15 threshold ka matlab hai 85% similarity
      if (score < 0.15) {
    console.log(`🎯 Cache Hit! Similarity Score: ${score}`);
    
    const client = getClient();
    // Inhe await karein ya background mein fire karein
    await Promise.all([
        client.incr("stats:total_hits"),
        client.incrByFloat("stats:dollars_saved", 0.01) // $0.01 per call savings
    ]);

    return topDoc.value.response;
}

    }
    return null;

  } catch (error) {
    console.error("❌ Redis Search Error:", error);
    return null;
  }
};

export const setCache = async (query: string, response: string, vector: number[]) => {
  try {
    const client = getClient();
    // String safe ID generation
    const id = Buffer.from(query).toString("hex").substring(0, 16);
    
    await client.json.set(`cache:${id}`, "$", { 
      query, 
      response, 
      embedding: vector 
    });
    console.log("💾 Saved to Cache:", id);
  } catch (err) {
    console.error("❌ Cache Set Error:", err);
  }
};


export const isRateLimited = async (userId: string, limit: number, windowSeconds: number): Promise<boolean> => {
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
};
