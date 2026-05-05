import { Queue } from 'bullmq';

const hydrationQueue = new Queue('hydration-tasks');

export const setupHydrationCron = async () => {
  try {
    const repeatableJobs = await hydrationQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await hydrationQueue.removeRepeatableByKey(job.key);
    }

    await hydrationQueue.add(
      'daily-hydration',
      { type: 'full_sync' },
      {
        repeat: {
          pattern: '0 2 * * *',
        },
      }
    );
    console.log('Sentinel-AI: Hydration Scheduler Initialized');
  } catch (error) {
    console.error('Failed to setup hydration cron:', error);
  }
};
