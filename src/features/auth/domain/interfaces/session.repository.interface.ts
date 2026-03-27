/**
 * Session Repository Interface
 * واجهة مستودع الجلسات
 * 
 * Defines the contract for session data access operations following Clean Architecture principles.
 * Handles user session management for authentication.
 */

import type { IRepository, BaseEntity } from '@/core/database';

// ============================================
// Session Entity Interface
// ============================================

/**
 * Session entity interface
 * واجهة كيان الجلسة
 * 
 * Represents an active user session in the system.
 * Sessions are used to maintain user authentication state.
 */
export interface Session extends BaseEntity {
  /** The user who owns this session */
  userId: string;
  
  /** Unique session token for authentication */
  token: string;
  
  /** User agent string from the client */
  userAgent: string | null;
  
  /** IP address of the client */
  ipAddress: string | null;
  
  /** When this session expires */
  expiresAt: Date | string;
}

// ============================================
// Session Repository Interface
// ============================================

/**
 * Session Repository Interface
 * واجهة مستودع الجلسات
 * 
 * Extends the base IRepository with session-specific operations.
 * Manages user sessions for authentication and security.
 */
export interface ISessionRepository extends IRepository<Session> {
  /**
   * Find a session by token
   * البحث عن جلسة بالرمز
   * 
   * @param token - The session token to search for
   * @returns The session if found, null otherwise
   */
  findByToken(token: string): Promise<Session | null>;

  /**
   * Find a valid (non-expired) session by token
   * البحث عن جلسة صالحة بالرمز
   * 
   * @param token - The session token to search for
   * @returns The session if found and valid, null otherwise
   */
  findValidByToken(token: string): Promise<Session | null>;

  /**
   * Find all active sessions for a user
   * البحث عن جميع الجلسات النشطة للمستخدم
   * 
   * @param userId - The user's ID
   * @returns Array of active sessions
   */
  findActiveByUserId(userId: string): Promise<Session[]>;

  /**
   * Invalidate (delete) a session by token
   * إلغاء جلسة بالرمز
   * 
   * @param token - The session token to invalidate
   * @returns true if session was found and deleted, false otherwise
   */
  invalidateByToken(token: string): Promise<boolean>;

  /**
   * Invalidate all sessions for a user
   * إلغاء جميع جلسات المستخدم
   * 
   * Used when user logs out from all devices or changes password.
   * 
   * @param userId - The user's ID
   * @returns Number of sessions invalidated
   */
  invalidateAllByUserId(userId: string): Promise<number>;

  /**
   * Clean up expired sessions
   * تنظيف الجلسات المنتهية
   * 
   * Should be called periodically to remove expired sessions.
   * 
   * @returns Number of sessions cleaned up
   */
  cleanupExpired(): Promise<number>;
}
