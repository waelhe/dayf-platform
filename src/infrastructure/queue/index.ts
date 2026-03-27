/**
 * Queue Infrastructure
 * البنية التحتية لقوائم الانتظار
 *
 * 🏛️ Constitutional Compliance:
 * - المادة V: التواصل بين الوحدات عبر الأحداث
 * - معالجة غير متزامنة وموزعة
 *
 * Features:
 * - Distributed job processing
 * - Retry logic
 * - Rate limiting
 * - Priority queues
 */

// Client
export {
  getEmailQueue,
  getNotificationQueue,
  getStatsQueue,
  isBullMQAvailable,
  addJob,
  addEmailJob,
  addNotificationJob,
  addStatsJob,
  QUEUE_NAMES,
  Queue,
  Worker,
  Job,
  QueueEvents,
  type JobData,
  type EmailJobData,
  type NotificationJobData,
  type StatsUpdateJobData,
  type AnyJobData,
} from './client';

// Workers
export {
  createEmailWorker,
  createNotificationWorker,
  createStatsWorker,
  startWorkers,
  stopWorkers,
  getWorkersStatus,
} from './workers';

// ============================================
// In-Memory Fallback (when BullMQ not available)
// ============================================

import { type EmailJobData, type NotificationJobData, type StatsUpdateJobData } from './client';
import { sendEmail } from '../email';
import { sendPushNotification } from '../notifications';

/**
 * Process job immediately (fallback when BullMQ not available)
 */
async function processJobImmediately<T extends { type: string; payload: unknown }>(
  job: T
): Promise<void> {
  switch (job.type) {
    case 'email':
      await sendEmail(job.payload as EmailJobData['payload']);
      break;
    case 'notification':
      await sendPushNotification(job.payload as NotificationJobData['payload']);
      break;
    case 'stats_update':
      // TODO: Implement stats update
      console.log('[Fallback] Stats update:', job.payload);
      break;
    default:
      console.warn('[Fallback] Unknown job type:', job.type);
  }
}

/**
 * Queue job with fallback
 */
export async function queueJobWithFallback<T extends { type: string; payload: unknown }>(
  job: T
): Promise<void> {
  const { isBullMQAvailable, addJob } = await import('./client');

  if (isBullMQAvailable()) {
    // Use BullMQ
    const queueName = job.type === 'email' ? 'email' :
                      job.type === 'notification' ? 'notification' : 'stats';
    await addJob(queueName, job);
  } else {
    // Fallback to immediate processing
    console.log('[Queue] BullMQ not available, processing immediately');
    await processJobImmediately(job);
  }
}

// ============================================
// Job Helpers (Convenience)
// ============================================

/**
 * Queue email with fallback
 */
export async function queueEmail(
  to: string,
  subject: string,
  template: string,
  data: Record<string, unknown>
): Promise<void> {
  await queueJobWithFallback({
    type: 'email',
    payload: { to, subject, template, data },
    timestamp: Date.now(),
  });
}

/**
 * Queue notification with fallback
 */
export async function queueNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await queueJobWithFallback({
    type: 'notification',
    payload: { userId, title, body, data },
    timestamp: Date.now(),
  });
}
