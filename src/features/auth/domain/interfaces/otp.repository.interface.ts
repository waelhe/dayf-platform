/**
 * OTP Repository Interface
 * واجهة مستودع رموز التحقق
 * 
 * Defines the contract for OTP (One-Time Password) data access operations
 * following Clean Architecture principles.
 * Handles verification codes for phone authentication.
 */

import type { IRepository, BaseEntity } from '@/core/database';

// ============================================
// OTP Types
// ============================================

/**
 * OTP type enumeration
 * أنواع رموز التحقق
 */
export type OTPType = 'LOGIN' | 'REGISTER' | 'VERIFY' | 'RESET_PASSWORD';

// ============================================
// OTP Code Entity Interface
// ============================================

/**
 * OTP Code entity interface
 * واجهة كيان رمز التحقق
 * 
 * Represents a one-time password code used for verification.
 * Used for phone-based authentication and verification.
 */
export interface OTPCode extends BaseEntity {
  /** Phone number the code was sent to */
  phone: string;
  
  /** The actual OTP code */
  code: string;
  
  /** Type of OTP operation */
  type: OTPType;
  
  /** Whether the code has been verified/used */
  verified: boolean;
  
  /** When this code expires */
  expiresAt: Date | string;
}

// ============================================
// OTP Repository Interface
// ============================================

/**
 * OTP Repository Interface
 * واجهة مستودع رموز التحقق
 * 
 * Extends the base IRepository with OTP-specific operations.
 * Manages one-time password codes for authentication.
 */
export interface IOTPRepository extends IRepository<OTPCode> {
  /**
   * Find a valid (non-expired, unverified) OTP code
   * البحث عن رمز تحقق صالح
   * 
   * @param phone - The phone number
   * @param code - The OTP code
   * @param type - The OTP type
   * @returns The OTP code if found and valid, null otherwise
   */
  findValidCode(phone: string, code: string, type: OTPType): Promise<OTPCode | null>;

  /**
   * Find an expired OTP code
   * البحث عن رمز تحقق منتهي
   * 
   * Used to check if a code was valid but expired.
   * 
   * @param phone - The phone number
   * @param code - The OTP code
   * @param type - The OTP type
   * @returns The OTP code if found but expired, null otherwise
   */
  findExpiredCode(phone: string, code: string, type: OTPType): Promise<OTPCode | null>;

  /**
   * Mark an OTP code as verified
   * تحديد رمز التحقق كمستخدم
   * 
   * @param id - The OTP code's ID
   */
  markAsVerified(id: string): Promise<void>;

  /**
   * Delete all expired OTP codes
   * حذف جميع رموز التحقق المنتهية
   * 
   * Should be called periodically for cleanup.
   * 
   * @returns Number of codes deleted
   */
  deleteExpiredCodes(): Promise<number>;

  /**
   * Count recent OTP codes sent to a phone
   * عدد رموز التحقق المرسلة مؤخراً
   * 
   * Used for rate limiting.
   * 
   * @param phone - The phone number
   * @param type - The OTP type
   * @param since - Date to count from
   * @returns Number of codes sent since the given date
   */
  countRecentCodes(phone: string, type: OTPType, since: Date): Promise<number>;

  /**
   * Check if a phone has a verified code recently
   * التحقق من وجود رمز مؤكد حديثاً
   * 
   * Used to prevent replay attacks and for step-up authentication.
   * 
   * @param phone - The phone number
   * @param type - The OTP type
   * @param withinMinutes - Time window in minutes
   * @returns true if a verified code exists within the time window
   */
  hasVerifiedCode(phone: string, type: OTPType, withinMinutes: number): Promise<boolean>;
}
