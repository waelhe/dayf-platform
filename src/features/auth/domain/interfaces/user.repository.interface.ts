/**
 * User Repository Interface
 * واجهة مستودع المستخدمين
 * 
 * Defines the contract for user data access operations following Clean Architecture principles.
 * This interface belongs to the domain layer and should not depend on infrastructure.
 */

import type { IRepository, BaseEntity } from '@/core/database';
import { Role, UserStatus, MembershipLevel } from '@/core/types/enums';

// Re-export for convenience
export { Role, UserStatus, MembershipLevel };

// Type aliases for backward compatibility
export type UserRole = Role;
export type UserMembershipLevel = MembershipLevel;

// ============================================
// User Entity Interface
// ============================================

/**
 * User entity interface
 * واجهة كيان المستخدم
 * 
 * Represents a user in the system with all their attributes.
 * Uses camelCase for property names (domain layer convention).
 */
export interface User extends BaseEntity {
  /** User's email address (unique, nullable) */
  email: string | null;
  
  /** User's phone number (unique, nullable) */
  phone: string | null;
  
  /** Hashed password (nullable for OAuth users) */
  passwordHash: string | null;
  
  /** User's first name */
  firstName: string | null;
  
  /** User's last name */
  lastName: string | null;
  
  /** User's display name (required, shown publicly) */
  displayName: string;
  
  /** User's avatar URL */
  avatar: string | null;
  
  /** User's biography */
  bio: string | null;
  
  /** Current status of the user account */
  status: UserStatus;
  
  /** User's role in the system */
  role: UserRole;
  
  /** Date when email was verified */
  emailVerified: Date | string | null;
  
  /** Date when phone was verified */
  phoneVerified: Date | string | null;
  
  /** User's membership level */
  membershipLevel: MembershipLevel;
  
  /** Accumulated loyalty points */
  loyaltyPoints: number;
  
  /** User's preferred language */
  language: string;
  
  /** Last login timestamp */
  lastLogin: Date | string | null;
}

// ============================================
// User Repository Interface
// ============================================

/**
 * User Repository Interface
 * واجهة مستودع المستخدمين
 * 
 * Extends the base IRepository with user-specific operations.
 * All methods work with the User entity type from the domain layer.
 */
export interface IUserRepository extends IRepository<User> {
  /**
   * Find a user by email address
   * البحث عن مستخدم بالبريد الإلكتروني
   * 
   * @param email - The email address to search for
   * @returns The user if found, null otherwise
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find a user by phone number
   * البحث عن مستخدم برقم الهاتف
   * 
   * @param phone - The phone number to search for
   * @returns The user if found, null otherwise
   */
  findByPhone(phone: string): Promise<User | null>;

  /**
   * Find a user by email or phone (for unified login)
   * البحث عن مستخدم بالبريد أو الهاتف
   * 
   * @param identifier - Email or phone number
   * @returns The user if found, null otherwise
   */
  findByEmailOrPhone(identifier: string): Promise<User | null>;

  /**
   * Update the last login timestamp
   * تحديث وقت آخر تسجيل دخول
   * 
   * @param userId - The user's ID
   */
  updateLastLogin(userId: string): Promise<void>;

  /**
   * Update user's account status
   * تحديث حالة حساب المستخدم
   * 
   * @param userId - The user's ID
   * @param status - The new status
   */
  updateStatus(userId: string, status: UserStatus): Promise<void>;

  /**
   * Mark email as verified
   * تأكيد البريد الإلكتروني
   * 
   * @param userId - The user's ID
   */
  verifyEmail(userId: string): Promise<void>;

  /**
   * Mark phone as verified
   * تأكيد رقم الهاتف
   * 
   * @param userId - The user's ID
   */
  verifyPhone(userId: string): Promise<void>;

  /**
   * Update user's password
   * تحديث كلمة المرور
   * 
   * @param userId - The user's ID
   * @param passwordHash - The new hashed password
   */
  updatePassword(userId: string, passwordHash: string): Promise<void>;

  /**
   * Add loyalty points to user
   * إضافة نقاط الولاء للمستخدم
   * 
   * @param userId - The user's ID
   * @param points - Points to add (can be negative for deductions)
   */
  incrementLoyaltyPoints(userId: string, points: number): Promise<void>;
}
