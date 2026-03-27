// OTP Service - خدمة رموز التحقق
// تم تحديثها لاستخدام Repository Pattern بدلاً من Prisma مباشرة

import type { OTPType, OTPCode } from '../domain/interfaces';
import { getOTPRepository } from './repositories/otp.repository';
import { OTPResponse, AuthError, AuthErrorType } from '../types';

// إعدادات OTP
const OTP_CONFIG = {
  CODE_LENGTH: 6,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS_PER_HOUR: 3,
} as const;

export class OTPService {
  /**
   * توليد رمز OTP عشوائي
   */
  private static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * إرسال رمز OTP
   */
  static async sendOTP(phone: string, type: OTPType): Promise<OTPResponse> {
    const otpRepo = getOTPRepository();
    
    // التحقق من عدد المحاولات
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCodes = await otpRepo.countRecentCodes(phone, type, oneHourAgo);

    if (recentCodes >= OTP_CONFIG.MAX_ATTEMPTS_PER_HOUR) {
      throw new AuthError(
        AuthErrorType.OTP_TOO_MANY_ATTEMPTS,
        'تم تجاوز الحد الأقصى من المحاولات. حاول مرة أخرى بعد ساعة.',
        429
      );
    }

    // حذف الرموز القديمة غير المستخدمة (تنظيف)
    await otpRepo.deleteExpiredCodes();

    // توليد رمز جديد
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

    // حفظ الرمز في قاعدة البيانات
    await otpRepo.create({
      phone,
      code,
      type,
      verified: false,
      expiresAt: expiresAt.toISOString(),
    });

    // TODO: إرسال الرمز عبر SMS
    // في بيئة التطوير، نطبع الرمز في الـ console
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OTP] ${type} code for ${phone}: ${code}`);
    }

    return {
      success: true,
      expiresIn: OTP_CONFIG.EXPIRY_MINUTES * 60,
      message: `تم إرسال رمز التحقق إلى ${phone}`
    };
  }

  /**
   * التحقق من صحة رمز OTP
   */
  static async verifyOTP(phone: string, code: string, type: OTPType): Promise<boolean> {
    const otpRepo = getOTPRepository();
    
    const otpRecord = await otpRepo.findValidCode(phone, code, type);

    if (!otpRecord) {
      // التحقق إذا كان الرمز منتهي الصلاحية
      const expiredOtp = await otpRepo.findExpiredCode(phone, code, type);

      if (expiredOtp) {
        throw new AuthError(
          AuthErrorType.OTP_EXPIRED,
          'انتهت صلاحية رمز التحقق. اطلب رمزاً جديداً.',
          400
        );
      }

      throw new AuthError(
        AuthErrorType.INVALID_OTP,
        'رمز التحقق غير صحيح.',
        400
      );
    }

    // تحديث حالة الرمز
    await otpRepo.markAsVerified(otpRecord.id);

    return true;
  }

  /**
   * التحقق من وجود رمز OTP صالح (للتسجيل)
   */
  static async hasValidOTP(phone: string, type: OTPType): Promise<boolean> {
    const otpRepo = getOTPRepository();
    // التحقق من وجود رمز تم تأكيده خلال آخر 30 دقيقة
    return otpRepo.hasVerifiedCode(phone, type, 30);
  }

  /**
   * حذف رموز OTP المستخدمة أو المنتهية
   */
  static async cleanupExpiredCodes(): Promise<number> {
    const otpRepo = getOTPRepository();
    return otpRepo.deleteExpiredCodes();
  }
}

export const otpService = OTPService;
