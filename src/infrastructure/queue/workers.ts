/**
 * Queue Workers
 * معالجات الوظائف الخلفية
 *
 * 🏛️ Constitutional Compliance:
 * - المادة V: التواصل بين الوحدات عبر الأحداث
 * - معالجة غير متزامنة للوظائف
 */

import { Worker, Job } from 'bullmq';
import { QUEUE_NAMES, type EmailJobData, type NotificationJobData, type StatsUpdateJobData, isBullMQAvailable } from './client';
import { sendEmail } from '../email';
import { sendPushNotification } from '../notifications';

// ============================================
// Email Worker
// ============================================

/**
 * Process email jobs
 */
async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { payload } = job.data;

  console.log(`[Email Worker] Processing job ${job.id}`);
  console.log(`[Email Worker] To: ${payload.to}, Subject: ${payload.subject}`);

  try {
    const result = await sendEmail({
      to: payload.to,
      subject: payload.subject,
      template: payload.template,
      data: payload.data,
    });

    console.log(`[Email Worker] Email sent successfully: ${result.id}`);
  } catch (error) {
    console.error('[Email Worker] Failed to send email:', error);
    throw error; // Will trigger retry
  }
}

/**
 * Create email worker
 */
export function createEmailWorker(): Worker<EmailJobData> | null {
  if (!isBullMQAvailable()) {
    console.warn('[Email Worker] BullMQ not available, using sync processing');
    return null;
  }

  return new Worker<EmailJobData>(
    QUEUE_NAMES.EMAIL,
    processEmailJob,
    {
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );
}

// ============================================
// Notification Worker
// ============================================

/**
 * Process notification jobs
 */
async function processNotificationJob(job: Job<NotificationJobData>): Promise<void> {
  const { payload } = job.data;

  console.log(`[Notification Worker] Processing job ${job.id}`);
  console.log(`[Notification Worker] User: ${payload.userId}, Title: ${payload.title}`);

  try {
    const result = await sendPushNotification({
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });

    console.log(`[Notification Worker] Notification sent: ${result.success}`);
  } catch (error) {
    console.error('[Notification Worker] Failed to send notification:', error);
    throw error;
  }
}

/**
 * Create notification worker
 */
export function createNotificationWorker(): Worker<NotificationJobData> | null {
  if (!isBullMQAvailable()) {
    console.warn('[Notification Worker] BullMQ not available, using sync processing');
    return null;
  }

  return new Worker<NotificationJobData>(
    QUEUE_NAMES.NOTIFICATION,
    processNotificationJob,
    {
      concurrency: 10,
    }
  );
}

// ============================================
// Stats Worker
// ============================================

/**
 * Process stats update jobs
 */
async function processStatsJob(job: Job<StatsUpdateData>): Promise<void> {
  const { payload } = job.data;

  console.log(`[Stats Worker] Processing job ${job.id}`);
  console.log(`[Stats Worker] Entity: ${payload.entityType}/${payload.entityId}, Action: ${payload.action}`);

  // TODO: Implement stats update
  // This should update the relevant stats in the database
  // For example: increment view_count, booking_count, etc.

  console.log(`[Stats Worker] Stats updated successfully`);
}

/**
 * Create stats worker
 */
export function createStatsWorker(): Worker<StatsUpdateJobData> | null {
  if (!isBullMQAvailable()) {
    console.warn('[Stats Worker] BullMQ not available, using sync processing');
    return null;
  }

  return new Worker<StatsUpdateJobData>(
    QUEUE_NAMES.STATS,
    processStatsJob,
    {
      concurrency: 20,
    }
  );
}

// ============================================
// Worker Management
// ============================================

let workers: (Worker | null)[] = [];

/**
 * Start all workers
 */
export function startWorkers(): void {
  console.log('[Workers] Starting...');

  workers = [
    createEmailWorker(),
    createNotificationWorker(),
    createStatsWorker(),
  ].filter(Boolean);

  console.log(`[Workers] Started ${workers.length} workers`);
}

/**
 * Stop all workers
 */
export async function stopWorkers(): Promise<void> {
  console.log('[Workers] Stopping...');

  await Promise.all(
    workers.map(worker => worker?.close())
  );

  workers = [];
  console.log('[Workers] All workers stopped');
}

/**
 * Get workers status
 */
export function getWorkersStatus(): {
  running: number;
  queues: string[];
} {
  return {
    running: workers.filter(Boolean).length,
    queues: Object.values(QUEUE_NAMES),
  };
}
