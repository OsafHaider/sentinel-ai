import crypto from "crypto";
import { saveExactCache } from "./redis.js";
import { getKnowledgeCollection } from "../config/mongo.js";
import { logger } from "../config/logger.js";

/**
 * SERVICE: Sentinel-AI Cache Hydration Engine
 * DESCRIPTION: Warmup task that syncs the top 500 latest entries from MongoDB into Redis memory.
 * OPTIMIZATION: Implements batch aggregation and concurrent Promise pipeline to eliminate blocking I/O.
 * FAIL-SAFE: Structured exception catching to prevent gateway bootstrap crashes on infrastructure drops.
 */
export const runHydration = async (): Promise<void> => {
    try {
        const collection = getKnowledgeCollection();
        
        const records = await collection.find({
            $or: [
                { query: { $exists: true } },
                { content: { $exists: true } }
            ]
        })
        .sort({ _id: -1 }) 
        .limit(500)
        .toArray();

        if (records.length === 0) {
            logger.info({ phase: "SENTINEL_MEMORY_HYDRATION" }, "Hydration skipped: No records found in knowledge collection");
            return;
        }

        logger.info({ phase: "SENTINEL_MEMORY_HYDRATION", batchSize: records.length }, "Starting cache hydration batch operation");

        const cachePromises: Promise<void>[] = [];

        for (const doc of records) {
            const textToHash = doc.query || doc.content;
            const answer = doc.content;

            if (textToHash && answer) {
                const queryHash = crypto.createHash('md5')
                    .update(textToHash.toLowerCase().trim())
                    .digest('hex');

                cachePromises.push(saveExactCache(queryHash, answer));
            }
        }

        if (cachePromises.length > 0) {
            await Promise.all(cachePromises);
        }

        logger.info({ 
            phase: "SENTINEL_MEMORY_HYDRATION", 
            hydratedCount: cachePromises.length 
        }, "Sentinel cache warmup completed successfully");

    } catch (error) {
        const err = error as Error;
        
        logger.error({
            err: {
                message: err.message,
                stack: err.stack,
                name: err.name
            },
            phase: "SENTINEL_MEMORY_HYDRATION",
            recoveryAction: "Bypassing pre-warmup cache. Gateway will fallback to direct DB/LLM queries."
        }, "Critical error occurred during Redis memory hydration loop");
    }
};
