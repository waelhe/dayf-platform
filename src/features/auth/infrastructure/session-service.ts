// Session Service - خدمة الجلسات
// تم تحديثها لاستخدام Repository Pattern بدلاً من Prisma مباشرة

import { randomBytes } from 'crypto';
import type { Session } from '../domain/interfaces/session.repository.interface';
import type { User } from '../domain/interfaces/user.repository.interface';
import { getSessionRepository } from './repositories/session.repository';
import { getUserRepository } from './repositories/user.repository';
import { AuthError, AuthErrorType } from '../types';

// إعدادات الجلسة
const SESSION_CONFIG = {
  TOKEN_LENGTH: 32,
  EXPIRY_DAYS: 30,
} as const;

export class SessionService {
  /**
   * توليد token عشوائي
   */
  private static generateToken(): string {
    return randomBytes(SESSION_CONFIG.TOKEN_LENGTH).toString('hex');
  }

  /**
   * إنشاء جلسة جديدة
   */
  static async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ token: string; expiresAt: Date }> {
    const sessionRepo = getSessionRepository();
    
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + SESSION_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await sessionRepo.create({
      userId,
      token,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt: expiresAt.toISOString(),
    });

    return { token, expiresAt };
  }

  /**
   * التحقق من صحة الجلسة
   */
  static async validateSession(token: string): Promise<{ userId: string; user: User } | null> {
    const sessionRepo = getSessionRepository();
    const userRepo = getUserRepository();
    
    const session = await sessionRepo.findValidByToken(token);

    if (!session) {
      return null;
    }

    const sessionExpiresAt = typeof session.expiresAt === 'string' 
      ? new Date(session.expiresAt) 
      : session.expiresAt;

    if (sessionExpiresAt < new Date()) {
      // حذف الجلسة المنتهية
      await sessionRepo.delete(session.id);
      throw new AuthError(
        AuthErrorType.SESSION_EXPIRED,
        'انتهت صلاحية الجلسة. سجل دخولك مرة أخرى.',
        401
      );
    }

    // الحصول على المستخدم
    const user = await userRepo.findById(session.userId);
    if (!user) {
      await sessionRepo.delete(session.id);
      return null;
    }

    // تحديث آخر تسجيل دخول
    await userRepo.updateLastLogin(user.id);

    return { userId: session.userId, user };
  }

  /**
   * إنهاء جلسة
   */
  static async terminateSession(token: string): Promise<void> {
    const sessionRepo = getSessionRepository();
    await sessionRepo.invalidateByToken(token).catch(() => {});
  }

  /**
   * إنهاء جميع جلسات المستخدم
   */
  static async terminateAllUserSessions(userId: string): Promise<void> {
    const sessionRepo = getSessionRepository();
    await sessionRepo.invalidateAllByUserId(userId);
  }

  /**
   * تجديد الجلسة
   */
  static async renewSession(token: string): Promise<{ token: string; expiresAt: Date }> {
    const sessionRepo = getSessionRepository();
    
    const session = await sessionRepo.findByToken(token);

    if (!session) {
      throw new AuthError(
        AuthErrorType.SESSION_EXPIRED,
        'الجلسة غير موجودة.',
        401
      );
    }

    const newToken = this.generateToken();
    const newExpiresAt = new Date(Date.now() + SESSION_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    // حذف الجلسة القديمة
    await sessionRepo.delete(session.id);
    
    // إنشاء جلسة جديدة
    await sessionRepo.create({
      userId: session.userId,
      token: newToken,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      expiresAt: newExpiresAt.toISOString(),
    });

    return { token: newToken, expiresAt: newExpiresAt };
  }

  /**
   * الحصول على جميع جلسات المستخدم
   */
  static async getUserSessions(userId: string): Promise<Session[]> {
    const sessionRepo = getSessionRepository();
    return sessionRepo.findActiveByUserId(userId);
  }

  /**
   * تنظيف الجلسات المنتهية
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const sessionRepo = getSessionRepository();
    return sessionRepo.cleanupExpired();
  }
}

export const sessionService = SessionService;
