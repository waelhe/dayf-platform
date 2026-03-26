// Auth Service - خدمة المصادقة الرئيسية
// تم تحديثها لاستخدام Repository Pattern بدلاً من Prisma مباشرة

import type { User } from '../domain/interfaces/user.repository.interface';
import type { OTPType } from '../domain/interfaces/otp.repository.interface';
import { getUserRepository } from './repositories/user.repository';
import { getSessionRepository } from './repositories/session.repository';
import { getOTPRepository } from './repositories/otp.repository';
import { Role, UserStatus, MembershipLevel } from '@/core/types/enums';
import bcrypt from 'bcryptjs';
import {
  UserResponse,
  AuthResponse,
  RegisterWithEmailInput,
  LoginWithEmailInput,
  LoginWithPhoneInput,
  AuthError,
  AuthErrorType,
  OAuthUserInfo,
} from '../types';
import { otpService } from './otp-service';
import { sessionService } from './session-service';

// إعدادات كلمة المرور
const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  SALT_ROUNDS: 10,
} as const;

export class AuthService {
  // ============================================
  // التسجيل
  // ============================================

  /**
   * تسجيل بالبريد الإلكتروني
   */
  static async registerWithEmail(input: RegisterWithEmailInput): Promise<AuthResponse> {
    const userRepo = getUserRepository();
    
    // التحقق من وجود المستخدم
    const existingUser = await userRepo.findByEmail(input.email);

    if (existingUser) {
      throw new AuthError(
        AuthErrorType.USER_ALREADY_EXISTS,
        'البريد الإلكتروني مستخدم بالفعل.',
        409
      );
    }

    // التحقق من قوة كلمة المرور
    this.validatePassword(input.password);

    // تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(input.password, PASSWORD_CONFIG.SALT_ROUNDS);

    // إنشاء المستخدم
    const user = await userRepo.create({
      email: input.email,
      passwordHash,
      phone: input.phone || null,
      firstName: input.firstName || null,
      lastName: input.lastName || null,
      displayName: `${input.firstName || ''} ${input.lastName || ''}`.trim() || 'مستخدم جديد',
      avatar: null,
      bio: null,
      status: UserStatus.PENDING,
      role: Role.USER,
      membershipLevel: MembershipLevel.BRONZE,
      loyaltyPoints: 0,
      language: 'ar',
      emailVerified: null,
      phoneVerified: null,
      lastLogin: null,
    });

    // إنشاء جلسة
    const { token } = await sessionService.createSession(user.id);

    return {
      user: this.toUserResponse(user),
      token,
      isNewUser: true,
    };
  }

  /**
   * تسجيل برقم الهاتف (بعد التحقق من OTP)
   */
  static async registerWithPhone(
    phone: string,
    firstName: string,
    lastName: string,
    email?: string
  ): Promise<AuthResponse> {
    const userRepo = getUserRepository();
    
    // التحقق من صحة OTP
    const hasValidOTP = await otpService.hasValidOTP(phone, 'REGISTER' as OTPType);
    if (!hasValidOTP) {
      throw new AuthError(
        AuthErrorType.INVALID_OTP,
        'يجب التحقق من رقم الهاتف أولاً.',
        400
      );
    }

    // التحقق من وجود المستخدم
    const existingUser = await userRepo.findByPhone(phone);

    if (existingUser) {
      throw new AuthError(
        AuthErrorType.USER_ALREADY_EXISTS,
        'رقم الهاتف مستخدم بالفعل.',
        409
      );
    }

    // إنشاء المستخدم
    const user = await userRepo.create({
      phone,
      email: email || null,
      passwordHash: null,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      avatar: null,
      bio: null,
      status: UserStatus.ACTIVE,
      role: Role.USER,
      membershipLevel: MembershipLevel.BRONZE,
      loyaltyPoints: 0,
      language: 'ar',
      emailVerified: null,
      phoneVerified: new Date().toISOString(),
      lastLogin: null,
    });

    // إنشاء جلسة
    const { token } = await sessionService.createSession(user.id);

    return {
      user: this.toUserResponse(user),
      token,
      isNewUser: true,
    };
  }

  // ============================================
  // تسجيل الدخول
  // ============================================

  /**
   * تسجيل دخول بالبريد الإلكتروني
   */
  static async loginWithEmail(input: LoginWithEmailInput): Promise<AuthResponse> {
    const userRepo = getUserRepository();
    
    // البحث عن المستخدم
    const user = await userRepo.findByEmail(input.email);

    if (!user || !user.passwordHash) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        401
      );
    }

    // التحقق من كلمة المرور
    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        401
      );
    }

    // التحقق من حالة المستخدم
    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'تم تعليق حسابك. تواصل مع الدعم.',
        403
      );
    }

    // إنشاء جلسة
    const { token } = await sessionService.createSession(user.id);

    // تحديث حالة المستخدم
    await userRepo.updateStatus(user.id, UserStatus.ACTIVE);
    await userRepo.updateLastLogin(user.id);

    return {
      user: this.toUserResponse(user),
      token,
    };
  }

  /**
   * تسجيل دخول برقم الهاتف و OTP
   */
  static async loginWithPhone(input: LoginWithPhoneInput): Promise<AuthResponse> {
    const userRepo = getUserRepository();
    
    // التحقق من OTP
    await otpService.verifyOTP(input.phone, input.otp, 'LOGIN' as OTPType);

    // البحث عن المستخدم
    const user = await userRepo.findByPhone(input.phone);

    if (!user) {
      throw new AuthError(
        AuthErrorType.USER_NOT_FOUND,
        'لم يتم العثور على حساب بهذا الرقم. سجل أولاً.',
        404
      );
    }

    // التحقق من حالة المستخدم
    if (user.status === UserStatus.SUSPENDED) {
      throw new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'تم تعليق حسابك. تواصل مع الدعم.',
        403
      );
    }

    // إنشاء جلسة
    const { token } = await sessionService.createSession(user.id);

    // تحديث حالة المستخدم
    await userRepo.updateStatus(user.id, UserStatus.ACTIVE);
    await userRepo.updateLastLogin(user.id);

    return {
      user: this.toUserResponse(user),
      token,
    };
  }

  /**
   * تسجيل دخول مع OAuth
   */
  static async loginWithOAuth(
    _provider: string,
    userInfo: OAuthUserInfo
  ): Promise<AuthResponse> {
    const userRepo = getUserRepository();
    
    // TODO: Implement OAuth account linking
    // For now, find or create user by email
    let user: User | null = null;
    let isNewUser = false;

    if (userInfo.email) {
      user = await userRepo.findByEmail(userInfo.email);
    }

    if (!user) {
      isNewUser = true;
      user = await userRepo.create({
        email: userInfo.email || null,
        passwordHash: null,
        firstName: userInfo.firstName || null,
        lastName: userInfo.lastName || null,
        displayName: userInfo.displayName || `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'مستخدم',
        avatar: userInfo.avatar || null,
        bio: null,
        status: UserStatus.ACTIVE,
        role: Role.USER,
        membershipLevel: MembershipLevel.BRONZE,
        loyaltyPoints: 0,
        language: 'ar',
        emailVerified: userInfo.email ? new Date().toISOString() : null,
        phoneVerified: null,
        lastLogin: null,
        phone: null,
      });
    }

    // إنشاء جلسة
    const { token } = await sessionService.createSession(user.id);

    // تحديث آخر تسجيل دخول
    await userRepo.updateLastLogin(user.id);

    return {
      user: this.toUserResponse(user),
      token,
      isNewUser,
    };
  }

  // ============================================
  // تسجيل الخروج
  // ============================================

  /**
   * تسجيل الخروج
   */
  static async logout(token: string): Promise<void> {
    await sessionService.terminateSession(token);
  }

  /**
   * تسجيل الخروج من جميع الأجهزة
   */
  static async logoutAll(userId: string): Promise<void> {
    await sessionService.terminateAllUserSessions(userId);
  }

  // ============================================
  // استعادة كلمة المرور
  // ============================================

  /**
   * طلب إعادة تعيين كلمة المرور
   */
  static async requestPasswordReset(email: string): Promise<void> {
    const userRepo = getUserRepository();
    const user = await userRepo.findByEmail(email);

    if (!user) {
      // لا نكشف عن عدم وجود المستخدم
      return;
    }

    // TODO: إرسال بريد مع رابط إعادة التعيين
    // في بيئة التطوير، نطبع في الـ console
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Password Reset] Token for ${email}: reset-token-${Date.now()}`);
    }
  }

  /**
   * إعادة تعيين كلمة المرور
   */
  static async resetPassword(_token: string, newPassword: string): Promise<void> {
    // TODO: التحقق من الـ token وإيجاد المستخدم
    // هذا يتطلب جدول password_reset_tokens

    this.validatePassword(newPassword);
  }

  // ============================================
  // التحقق من الجلسة
  // ============================================

  /**
   * التحقق من صحة التوكن
   */
  static async validateToken(token: string): Promise<UserResponse | null> {
    const result = await sessionService.validateSession(token);
    if (!result) return null;
    return this.toUserResponse(result.user);
  }

  /**
   * الحصول على المستخدم الحالي
   */
  static async getCurrentUser(token: string): Promise<UserResponse | null> {
    return this.validateToken(token);
  }

  // ============================================
  // دوال مساعدة
  // ============================================

  /**
   * التحقق من قوة كلمة المرور
   */
  private static validatePassword(password: string): void {
    if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
      throw new AuthError(
        AuthErrorType.WEAK_PASSWORD,
        `كلمة المرور يجب أن تكون ${PASSWORD_CONFIG.MIN_LENGTH} أحرف على الأقل.`,
        400
      );
    }

    // التحقق من وجود حرف كبير ورقم
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasNumber) {
      throw new AuthError(
        AuthErrorType.WEAK_PASSWORD,
        'كلمة المرور يجب أن تحتوي على حرف كبير ورقم على الأقل.',
        400
      );
    }
  }

  /**
   * تحويل المستخدم إلى استجابة
   */
  private static toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role as Role,
      status: user.status as UserStatus,
      membershipLevel: user.membershipLevel as MembershipLevel,
      loyaltyPoints: user.loyaltyPoints,
      language: user.language,
      emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
      phoneVerified: user.phoneVerified ? new Date(user.phoneVerified) : null,
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    };
  }
}

export const authService = AuthService;
