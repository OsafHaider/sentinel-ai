import { Queue } from "bullmq";

export const chatQueue = new Queue('chat-tasks', {
  connection: {
    host: '127.0.0.1',
    port: 6379
  }
});

export const addChatTask = async (data: { query: string; userId: string; embedding: number[] }) => {
  try {
    // 🛡️ Pro-Level Configuration
    const job = await chatQueue.add('process-query', data, {
      attempts: 2, 
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: false, 
      removeOnFail: { age: 24 * 3600 },
      
    });

    console.log(`[Queue] Job added: ${job.id}`);
    return job;
  } catch (error) {
    console.error('[Queue] Error adding job:', error);
    throw error;
  }
};
