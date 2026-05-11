import { Queue } from "bullmq";

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
            await existingJob.remove()
            console.log(`🗑️ Removed stale job from queue to force refresh: ${data.jobId}`);
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

    console.log(`[Sentinel-Queue] Job Queued: ${job.id}`);
    return job;
  } catch (error: any) {
    if (error.message.includes('jobId')) {
      console.warn(`[Sentinel-Guard] Duplicate job detected: ${data.jobId}. Skipping...`);
      return { id: data.jobId, status: 'duplicate' };
    }
    console.error('[Sentinel-Queue] Critical Error:', error);
    throw error;
  }
};
