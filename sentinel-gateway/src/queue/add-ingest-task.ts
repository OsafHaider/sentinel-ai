import { Queue } from "bullmq";
import { logger } from "../config/logger.js";

/**
 * SERVICE: Sentinel-AI Bulk Ingestion Queue Engine (BullMQ)
 * DESCRIPTION: Asynchronously schedules file parsers and vector ingestion tasks for knowledge pre-warming.
 * STANDARDS: Low-latency execution pools, automated data cleanup, error telemetry isolation.
 */

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const ingestionQueue = new Queue('ingestion-tasks', { connection });

export const addIngestTask = async (data: { filePath: string; fileName: string }) => {
    try {
        const job = await ingestionQueue.add('process-file', data, {
            attempts: 2,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true
        });
        
        return job;
    } catch (error) {
        logger.error({ err: error, fileName: data.fileName }, "Data ingestion queue ingestion transaction failed");
        throw error;
    }
};
