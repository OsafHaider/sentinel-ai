import { Queue } from "bullmq";
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const ingestionQueue = new Queue('ingestion-tasks', { connection });

export const addIngestTask = async (data: { filePath: string; fileName: string }) => {
    return await ingestionQueue.add('process-file', data, {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true
    });
};
