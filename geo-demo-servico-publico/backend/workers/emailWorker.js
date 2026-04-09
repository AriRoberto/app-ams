import { Worker } from 'bullmq';
import { ENV } from '../config/env.js';
import { sendInstitutionalEmail } from '../services/emailTransport.js';
import { markEmailFailure, markEmailSuccess } from '../services/emailDeliveryService.js';
import { initDatabase, closeDatabase } from '../services/db.js';
import { EMAIL_QUEUE_NAME } from '../queues/emailQueue.js';

const connection = {
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  password: ENV.REDIS_PASSWORD
};

await initDatabase();

const worker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job) => {
    const { occurrenceId, to, subject, text, html } = job.data;

    try {
      const info = await sendInstitutionalEmail({ to, subject, text, html });
      await markEmailSuccess({ occurrenceId, providerMessageId: info.messageId });
      return { messageId: info.messageId };
    } catch (error) {
      await markEmailFailure({ occurrenceId, errorMessage: error.message });
      throw error;
    }
  },
  {
    connection,
    concurrency: ENV.EMAIL_QUEUE_CONCURRENCY
  }
);

worker.on('completed', (job) => {
  // eslint-disable-next-line no-console
  console.log(`[email-worker] Job ${job.id} finalizado.`);
});

worker.on('failed', (job, err) => {
  // eslint-disable-next-line no-console
  console.error(`[email-worker] Job ${job?.id} falhou definitivamente: ${err.message}`);
});

process.on('SIGINT', async () => {
  await worker.close();
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await worker.close();
  await closeDatabase();
  process.exit(0);
});
