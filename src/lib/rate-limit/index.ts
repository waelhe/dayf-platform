/**
 * Rate Limiter
 * محدد معدل الطلبات
 * 
 * Simple in-memory rate limiting for API endpoints.
 * For production, use Redis-based rate limiting.
 */

import { NextResponse } from 'next/server';

// ============================================
// Types
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

// ============================================
// In-Memory Store
// ============================================

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 60000);

// ============================================
// Rate Limiter Class
// ============================================

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   * التحقق مما إذا كان الطلب مسموحاً به
   */
  check(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const key = identifier;
    
    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      // New window
      store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    // Increment count
    entry.count++;
    store.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Create rate limit response
   * إنشاء استجابة تحديد المعدل
   */
  createLimitResponse(retryAfter: number): NextResponse {
    return NextResponse.json(
      {
        error: this.config.message || 'تم تجاوز الحد الأقصى من الطلبات. حاول مرة أخرى لاحقاً.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(this.config.maxRequests),
          'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + retryAfter),
        },
      }
    );
  }
}

// ============================================
// Pre-configured Rate Limiters
// ============================================

/**
 * Auth rate limiter - strict
 * محدد معدل المصادقة - صارم
 * 5 requests per minute
 */
export const authRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'تم تجاوز عدد محاولات تسجيل الدخول. حاول مرة أخرى بعد دقيقة.',
});

/**
 * OTP rate limiter - very strict
 * محدد معدل OTP - صارم جداً
 * 3 requests per hour
 */
export const otpRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: 'تم تجاوز عدد طلبات التحقق. حاول مرة أخرى بعد ساعة.',
});

/**
 * API rate limiter - moderate
 * محدد معدل API - متوسط
 * 100 requests per minute
 */
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'تم تجاوز الحد الأقصى من الطلبات.',
});

/**
 * Password reset rate limiter
 * محدد معدل إعادة تعيين كلمة المرور
 * 3 requests per hour
 */
export const passwordResetRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: 'تم تجاوز عدد طلبات إعادة التعيين. حاول مرة أخرى بعد ساعة.',
});

// ============================================
// Helper Functions
// ============================================

/**
 * Get client IP from request
 * الحصول على عنوان IP العميل من الطلب
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Get rate limit identifier (IP + optional user ID)
 * الحصول على معرف تحديد المعدل
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  const ip = getClientIP(request);
  return userId ? `${ip}:${userId}` : ip;
}

/**
 * Apply rate limiting to request
 * تطبيق تحديد المعدل على الطلب
 */
export function applyRateLimit(
  request: Request,
  limiter: RateLimiter,
  identifier?: string
): { allowed: boolean; response?: NextResponse } {
  const id = identifier || getRateLimitIdentifier(request);
  const result = limiter.check(id);

  if (!result.allowed) {
    return {
      allowed: false,
      response: limiter.createLimitResponse(result.retryAfter || 60),
    };
  }

  return { allowed: true };
}
