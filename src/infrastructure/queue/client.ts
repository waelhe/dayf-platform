/**
 * BullMQ Queue Client
 * عميل قائمة الانتظار BullMQ
 *
 * 🏛️ Constitutional Compliance:
 * - المادة V: التواصل بين الوحدات عبر الأحداث
 * - يعمل مع Redis للـ Distributed processing
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { getRedisClient, isRedisAvailable } from '../redis';

// ============================================
// Types
// ============================================

export interface JobData {
  type: string;
  payload: unknown;
  timestamp: number;
}

export interface EmailJobData extends JobData {
  type: 'email';
  payload: {
    to: string;
    subject: string;
    template: string;
    data: Record<string, unknown>;
  };
}

export interface NotificationJobData extends JobData {
  type: 'notification';
  payload: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  };
}

export interface StatsUpdateJobData extends JobData {
  type: 'stats_update';
  payload: {
    entityType: 'service' | 'destination' | 'company' | 'user';
    entityId: string;
    action: 'view' | 'booking' | 'review' | 'rating';
  };
}

export type AnyJobData = EmailJobData | NotificationJobData | StatsUpdateJobData;

// ============================================
// Queue Names
// ============================================

export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  STATS: 'stats',
  CLEANUP: 'cleanup',
} as const;

// ============================================
// Queue Instances
// ============================================

let emailQueue: Queue | null = null;
let notificationQueue: Queue | null = null;
let statsQueue: Queue | null = null;

/**
 * Get Redis connection options for BullMQ
 */
function getConnectionOptions() {
  if (!isRedisAvailable()) {
    throw new Error('Redis required for BullMQ');
  }

  // Upstash Redis uses HTTP, but BullMQ needs TCP
  // We need to use Redis Cloud or self-hosted Redis for BullMQ
  // For now, we'll use the Redis URL directly
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

  return {
    connection: {
      host: redisUrl ? new URL(redisUrl).hostname : 'localhost',
      port: redisUrl ? parseInt(new URL(redisUrl).port) || 6379 : 6379,
      password: redisUrl ? new URL(redisUrl).password : undefined,
    },
  };
}

/**
 * Check if BullMQ is available
 */
export function isBullMQAvailable(): boolean {
  // BullMQ needs TCP Redis, not HTTP (Upstash REST)
  // For Upstash, we need to use their Redis Cloud or Upstash Redis with TCP
  return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
}

/**
 * Get Email Queue
 */
export function getEmailQueue(): Queue {
  if (!emailQueue) {
    if (!isBullMQAvailable()) {
      throw new Error('BullMQ requires TCP Redis connection');
    }

    const { connection } = getConnectionOptions();
    emailQueue = new Queue(QUEUE_NAMES.EMAIL, { connection });
  }
  return emailQueue;
}

/**
 * Get Notification Queue
 */
export function getNotificationQueue(): Queue {
  if (!notificationQueue) {
    if (!isBullMQAvailable()) {
      throw new Error('BullMQ requires TCP Redis connection');
    }

    const { connection } = getConnectionOptions();
    notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, { connection });
  }
  return notificationQueue;
}

/**
 * Get Stats Queue
 */
export function getStatsQueue(): Queue {
  if (!statsQueue) {
    if (!isBullMQAvailable()) {
      throw new Error('BullMQ requires TCP Redis connection');
    }

    const { connection } = getConnectionOptions();
    statsQueue = new Queue(QUEUE_NAMES.STATS, { connection });
  }
  return statsQueue;
}

// ============================================
// Job Helpers
// ============================================

/**
 * Add job to queue
 */
export async function addJob<T extends JobData>(
  queueName: string,
  data: T,
  options?: {
    priority?: number;
    delay?: number;
    attempts?: number;
  }
): Promise<Job<T>> {
  let queue: Queue;

  switch (queueName) {
    case QUEUE_NAMES.EMAIL:
      queue = getEmailQueue();
      break;
    case QUEUE_NAMES.NOTIFICATION:
      queue = getNotificationQueue();
      break;
    case QUEUE_NAMES.STATS:
      queue = getStatsQueue();
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  return queue.add(data.type, data, {
    priority: options?.priority,
    delay: options?.delay,
    attempts: options?.attempts || 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
}

/**
 * Add email job
 */
export async function addEmailJob(
  to: string,
  subject: string,
  template: string,
  data: Record<string, unknown>
): Promise<Job<EmailJobData>> {
  const jobData: EmailJobData = {
    type: 'email',
    payload: { to, subject, template, data },
    timestamp: Date.now(),
  };

  return addJob(QUEUE_NAMES.EMAIL, jobData);
}

/**
 * Add notification job
 */
export async function addNotificationJob(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<Job<NotificationJobData>> {
  const jobData: NotificationJobData = {
    type: 'notification',
    payload: { userId, title, body, data },
    timestamp: Date.now(),
  };

  return addJob(QUEUE_NAMES.NOTIFICATION, jobData);
}

/**
 * Add stats update job
 */
export async function addStatsJob(
  entityType: StatsUpdateJobData['payload']['entityType'],
  entityId: string,
  action: StatsUpdateJobData['payload']['action']
): Promise<Job<StatsUpdateJobData>> {
  const jobData: StatsUpdateJobData = {
    type: 'stats_update',
    payload: { entityType, entityId, action },
    timestamp: Date.now(),
  };

  return addJob(QUEUE_NAMES.STATS, jobData);
}

// ============================================
// Export
// ============================================

export {
  Queue,
  Worker,
  Job,
  QueueEvents,
};
