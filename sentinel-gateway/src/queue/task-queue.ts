import { Queue } from "bullmq";
import { logger } from "../config/logger.js";

/**
 * SERVICE: Sentinel-AI Distributed Task Queuing Engine (BullMQ)
 * DESCRIPTION: Manages offloading cache misses and bypass requests asynchronously to Python workers.
 * STANDARDS: Idempotency enforcement, exponential backoff failure handling, transient record trimming policies.
 */

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const chatQueue = new Queue('chat-tasks', { connection });

export const addChatTask = async (data: { query: string; userId: string, jobId: string }, bypass?: boolean) => {
  try {
    if (bypass) {
        const existingJob = await chatQueue.getJob(data.jobId);
        if (existingJob) {
            await existingJob.remove();
            logger.info({ jobId: data.jobId }, "Bypass triggered: Evicted existing stale job from distributed queue state");
        }
    }
    const job = await chatQueue.add('process-query', data, {
      jobId: data.jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600,
      },
    });

    return job;
  } catch (error: any) {
    if (error.message.includes('jobId')) {
      logger.warn({ jobId: data.jobId }, "Distributed deduplication engine dropped duplicate job request payload");
      return { id: data.jobId, status: 'duplicate' };
    }
    logger.error({ err: error, jobId: data.jobId }, "Queue broker failed to ingest job submission contract");
    throw error;
  }
};
