/**
 * Distributed Rate Limiter
 * محدد المعدل الموزع
 *
 * 🏛️ Constitutional Compliance:
 * - المادة VI: Rate limiting على كل endpoint عام
 * - Deny by Default
 *
 * Features:
 * - Distributed across all instances
 * - Multiple rate limit strategies
 * - Redis-backed (Upstash)
 */

import { Redis } from '@upstash/redis';
import { RateLimiterMemory, RateLimiterRedis, RateLimiterUnion } from 'rate-limiter-flexible';
import { getRedisClient, isRedisAvailable } from './client';
import { NextResponse } from 'next/server';

// ============================================
// Types
// ============================================

export interface RateLimitConfig {
  keyPrefix: string;
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  blockDuration?: number; // Block duration in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// ============================================
// Rate Limiter Instances
// ============================================

let authLimiter: RateLimiterRedis | RateLimiterMemory | null = null;
let otpLimiter: RateLimiterRedis | RateLimiterMemory | null = null;
let apiLimiter: RateLimiterRedis | RateLimiterMemory | null = null;
let passwordResetLimiter: RateLimiterRedis | RateLimiterMemory | null = null;

/**
 * Create rate limiter (Redis or fallback to Memory)
 */
function createRateLimiter(config: RateLimitConfig): RateLimiterRedis | RateLimiterMemory {
  if (isRedisAvailable()) {
    return new RateLimiterRedis({
      storeClient: getRedisClient() as unknown as Redis,
      keyPrefix: config.keyPrefix,
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration,
    });
  }

  // Fallback to in-memory (for development)
  return new RateLimiterMemory({
    keyPrefix: config.keyPrefix,
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration,
  });
}

/**
 * Initialize all rate limiters
 * تهيئة جميع محددات المعدل
 */
function initializeRateLimiters(): void {
  // Auth rate limiter: 5 requests per minute
  authLimiter = createRateLimiter({
    keyPrefix: 'auth',
    points: 5,
    duration: 60,
    blockDuration: 60,
  });

  // OTP rate limiter: 3 requests per hour
  otpLimiter = createRateLimiter({
    keyPrefix: 'otp',
    points: 3,
    duration: 3600,
    blockDuration: 3600,
  });

  // API rate limiter: 100 requests per minute
  apiLimiter = createRateLimiter({
    keyPrefix: 'api',
    points: 100,
    duration: 60,
  });

  // Password reset rate limiter: 3 requests per hour
  passwordResetLimiter = createRateLimiter({
    keyPrefix: 'pwd_reset',
    points: 3,
    duration: 3600,
    blockDuration: 3600,
  });
}

// ============================================
// Exported Rate Limiters
// ============================================

/**
 * Get Auth rate limiter
 * محدد معدل المصادقة
 */
export function getAuthRateLimiter(): RateLimiterRedis | RateLimiterMemory {
  if (!authLimiter) {
    initializeRateLimiters();
  }
  return authLimiter!;
}

/**
 * Get OTP rate limiter
 * محدد معدل OTP
 */
export function getOTPRateLimiter(): RateLimiterRedis | RateLimiterMemory {
  if (!otpLimiter) {
    initializeRateLimiters();
  }
  return otpLimiter!;
}

/**
 * Get API rate limiter
 * محدد معدل API العام
 */
export function getAPIRateLimiter(): RateLimiterRedis | RateLimiterMemory {
  if (!apiLimiter) {
    initializeRateLimiters();
  }
  return apiLimiter!;
}

/**
 * Get Password Reset rate limiter
 * محدد معدل إعادة تعيين كلمة المرور
 */
export function getPasswordResetRateLimiter(): RateLimiterRedis | RateLimiterMemory {
  if (!passwordResetLimiter) {
    initializeRateLimiters();
  }
  return passwordResetLimiter!;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get rate limit key from request
 * الحصول على مفتاح تحديد المعدل من الطلب
 */
export function getRateLimitKey(
  request: Request,
  userId?: string
): string {
  // Try to get IP from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip'); // Cloudflare

  let ip = 'unknown';

  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else if (cfIP) {
    ip = cfIP;
  } else if (realIP) {
    ip = realIP;
  }

  // Include userId if available for user-specific limiting
  return userId ? `${ip}:${userId}` : ip;
}

/**
 * Check rate limit
 * التحقق من تحديد المعدل
 */
export async function checkRateLimit(
  limiter: RateLimiterRedis | RateLimiterMemory,
  key: string
): Promise<RateLimitResult> {
  try {
    const result = await limiter.consume(key);

    return {
      allowed: true,
      remaining: result.remainingPoints,
      resetTime: new Date(Date.now() + result.msBeforeNext),
    };
  } catch (error) {
    if (error instanceof Error) {
      // Rate limit exceeded
      const msBeforeNext = (error as unknown as { msBeforeNext?: number }).msBeforeNext || 60000;

      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + msBeforeNext),
        retryAfter: Math.ceil(msBeforeNext / 1000),
      };
    }

    throw error;
  }
}

/**
 * Create rate limit response
 * إنشاء استجابة تحديد المعدل
 */
export function createRateLimitResponse(
  retryAfter: number,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      error: message || 'تم تجاوز الحد الأقصى من الطلبات. حاول مرة أخرى لاحقاً.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + retryAfter),
      },
    }
  );
}

/**
 * Apply rate limiting to request
 * تطبيق تحديد المعدل على الطلب
 */
export async function applyRateLimit(
  request: Request,
  limiter: RateLimiterRedis | RateLimiterMemory,
  key?: string
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const rateLimitKey = key || getRateLimitKey(request);
  const result = await checkRateLimit(limiter, rateLimitKey);

  if (!result.allowed) {
    return {
      allowed: false,
      response: createRateLimitResponse(result.retryAfter || 60),
    };
  }

  return { allowed: true };
}

// ============================================
// Pre-configured Limiters
// ============================================

export const rateLimiters = {
  auth: {
    points: 5,
    duration: 60,
    get limiter() {
      return getAuthRateLimiter();
    },
  },
  otp: {
    points: 3,
    duration: 3600,
    get limiter() {
      return getOTPRateLimiter();
    },
  },
  api: {
    points: 100,
    duration: 60,
    get limiter() {
      return getAPIRateLimiter();
    },
  },
  passwordReset: {
    points: 3,
    duration: 3600,
    get limiter() {
      return getPasswordResetRateLimiter();
    },
  },
};
