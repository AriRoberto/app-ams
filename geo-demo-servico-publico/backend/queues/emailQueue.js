import { Queue, QueueEvents } from 'bullmq';
import { ENV } from '../config/env.js';

const connection = {
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  password: ENV.REDIS_PASSWORD
};

export const EMAIL_QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 200,
    removeOnFail: 500
  }
});

export const emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, { connection });

emailQueueEvents.on('completed', ({ jobId }) => {
  // eslint-disable-next-line no-console
  console.log(`[email-queue] job ${jobId} concluído com sucesso.`);
});

emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
  // eslint-disable-next-line no-console
  console.error(`[email-queue] job ${jobId} falhou: ${failedReason}`);
});
