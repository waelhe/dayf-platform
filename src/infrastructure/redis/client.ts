/**
 * Upstash Redis Client
 * عميل Redis للـ Serverless
 *
 * 🏛️ Constitutional Compliance:
 * - المادة VI: Rate Limiting على كل endpoint
 * - يدعم Distributed Rate Limiting
 */

import { Redis } from '@upstash/redis';

// ============================================
// Environment Configuration
// ============================================

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// ============================================
// Redis Client Singleton
// ============================================

let redisClient: Redis | null = null;

/**
 * Get Upstash Redis client
 * الحصول على عميل Redis
 *
 * @throws Error if environment variables are not set
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      // Fallback to in-memory for development
      console.warn('[Redis] Upstash credentials not set, using in-memory fallback');
      throw new Error('Upstash Redis credentials required');
    }

    redisClient = new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redisClient;
}

/**
 * Check if Redis is available
 * التحقق من توفر Redis
 */
export function isRedisAvailable(): boolean {
  return !!(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Health check for Redis connection
 * فحص صحة اتصال Redis
 */
export async function checkRedisHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  try {
    const client = getRedisClient();
    const startTime = Date.now();

    await client.ping();

    return {
      healthy: true,
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export for convenience
export { Redis };
