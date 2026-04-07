import { emailQueue } from '../queues/emailQueue.js';
import { registerEmailQueued } from './emailDeliveryService.js';

export async function enqueueInstitutionalEmail({ occurrenceId, to, subject, text, html }) {
  await registerEmailQueued(occurrenceId);

  await emailQueue.add(
    'send-occurrence-email',
    { occurrenceId, to, subject, text, html },
    {
      jobId: `occurrence-email-${occurrenceId}-${Date.now()}`
    }
  );
}
