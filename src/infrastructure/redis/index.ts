/**
 * Redis Infrastructure
 * البنية التحتية لـ Redis
 *
 * Exports:
 * - Redis client (Upstash)
 * - Rate limiting (Distributed)
 * - Caching utilities
 */

// Client
export {
  getRedisClient,
  isRedisAvailable,
  checkRedisHealth,
  Redis,
} from './client';

// Rate Limiting
export {
  getAuthRateLimiter,
  getOTPRateLimiter,
  getAPIRateLimiter,
  getPasswordResetRateLimiter,
  getRateLimitKey,
  checkRateLimit,
  createRateLimitResponse,
  applyRateLimit,
  rateLimiters,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limiter';

// ============================================
// Caching Utilities
// ============================================

import { getRedisClient, isRedisAvailable } from './client';

/**
 * Cache options
 */
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

/**
 * Get cached value
 */
export async function getCache<T>(
  key: string,
  options?: CacheOptions
): Promise<T | null> {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const client = getRedisClient();
    const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
    const value = await client.get(fullKey);

    if (!value) {
      return null;
    }

    return JSON.parse(value as string) as T;
  } catch {
    return null;
  }
}

/**
 * Set cached value
 */
export async function setCache<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const client = getRedisClient();
    const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;
    const ttl = options?.ttl || 300; // Default 5 minutes

    await client.setex(fullKey, ttl, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete cached value
 */
export async function deleteCache(
  key: string,
  options?: CacheOptions
): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const client = getRedisClient();
    const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;

    await client.del(fullKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete cached values by pattern
 */
export async function deleteCachePattern(
  pattern: string,
  options?: CacheOptions
): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const client = getRedisClient();
    const fullPattern = options?.prefix ? `${options.prefix}:${pattern}` : pattern;

    // Scan and delete
    const keys = [];
    let cursor = '0';

    do {
      const result = await client.scan(cursor, { match: fullPattern, count: 100 });
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== '0');

    if (keys.length > 0) {
      await client.del(...keys);
    }

    return keys.length;
  } catch {
    return 0;
  }
}

// ============================================
// Cache Keys Constants
// ============================================

export const CACHE_KEYS = {
  // Services
  SERVICE_LIST: 'services:list',
  SERVICE_DETAIL: (id: string) => `services:detail:${id}`,

  // Destinations
  DESTINATION_LIST: 'destinations:list',
  DESTINATION_DETAIL: (id: string) => `destinations:detail:${id}`,

  // Reviews
  REVIEW_LIST: (refId: string) => `reviews:list:${refId}`,
  REVIEW_STATS: (refId: string) => `reviews:stats:${refId}`,

  // User
  USER_PROFILE: (id: string) => `user:profile:${id}`,
  USER_BOOKINGS: (id: string) => `user:bookings:${id}`,

  // Company
  COMPANY_DETAIL: (id: string) => `company:detail:${id}`,
} as const;

// Default TTLs
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 1 day
} as const;
