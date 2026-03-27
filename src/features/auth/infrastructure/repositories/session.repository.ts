/**
 * Session Repository Implementation
 * تنفيذ مستودع الجلسات
 * 
 * Implements ISessionRepository using Supabase as the data source.
 * Handles the conversion between domain entities (camelCase) and database rows (snake_case).
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES, type SupabaseSession } from '@/lib/supabase';
import type { Session, ISessionRepository } from '../../domain/interfaces';
import { DatabaseError, DatabaseErrorCode } from '@/core/database';

// ============================================
// Session Repository Implementation
// ============================================

/**
 * Session Repository
 * مستودع الجلسات
 * 
 * Provides data access operations for Session entities.
 * Inherits common CRUD operations from BaseRepository and adds session-specific methods.
 */
export class SessionRepository extends BaseRepository<Session> implements ISessionRepository {
  constructor() {
    super(TABLES.SESSIONS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  /**
   * Convert database row (snake_case) to domain entity (camelCase)
   * تحويل صف قاعدة البيانات إلى كيان النطاق
   */
  protected override toEntity(row: Record<string, unknown>): Session {
    const dbRow = row as unknown as SupabaseSession;
    
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      token: dbRow.token,
      userAgent: dbRow.user_agent,
      ipAddress: dbRow.ip_address,
      expiresAt: dbRow.expires_at,
      createdAt: dbRow.created_at,
    };
  }

  /**
   * Convert domain entity (camelCase) to database row (snake_case)
   * تحويل كيان النطاق إلى صف قاعدة البيانات
   */
  protected override toRow(entity: Partial<Session>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    // Map each field from camelCase to snake_case
    if (entity.userId !== undefined) row.user_id = entity.userId;
    if (entity.token !== undefined) row.token = entity.token;
    if (entity.userAgent !== undefined) row.user_agent = entity.userAgent;
    if (entity.ipAddress !== undefined) row.ip_address = entity.ipAddress;
    if (entity.expiresAt !== undefined) row.expires_at = entity.expiresAt;

    return row;
  }

  // ============================================
  // Session-Specific Repository Methods
  // ============================================

  /**
   * Find a session by token
   * البحث عن جلسة بالرمز
   */
  async findByToken(token: string): Promise<Session | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('token', token)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, token });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, token });
    }
  }

  /**
   * Find a valid (non-expired) session by token
   * البحث عن جلسة صالحة بالرمز
   */
  async findValidByToken(token: string): Promise<Session | null> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('token', token)
        .gt('expires_at', now) // Session must not be expired
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found or expired
        throw DatabaseError.fromError(error, { table: this.tableName, token });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, token });
    }
  }

  /**
   * Find all active sessions for a user
   * البحث عن جميع الجلسات النشطة للمستخدم
   */
  async findActiveByUserId(userId: string): Promise<Session[]> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', now) // Only non-expired sessions
        .order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, userId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId });
    }
  }

  /**
   * Invalidate (delete) a session by token
   * إلغاء جلسة بالرمز
   */
  async invalidateByToken(token: string): Promise<boolean> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from(this.tableName)
        .delete()
        .eq('token', token)
        .select('id');

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, token, operation: 'invalidateByToken' });
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, token, operation: 'invalidateByToken' });
    }
  }

  /**
   * Invalidate all sessions for a user
   * إلغاء جميع جلسات المستخدم
   */
  async invalidateAllByUserId(userId: string): Promise<number> {
    try {
      const client = this.getClient();

      const { data, error } = await client
        .from(this.tableName)
        .delete()
        .eq('user_id', userId)
        .select('id');

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'invalidateAllByUserId' });
      }

      return data?.length || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'invalidateAllByUserId' });
    }
  }

  /**
   * Clean up expired sessions
   * تنظيف الجلسات المنتهية
   */
  async cleanupExpired(): Promise<number> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(this.tableName)
        .delete()
        .lt('expires_at', now) // Delete all expired sessions
        .select('id');

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, operation: 'cleanupExpired' });
      }

      return data?.length || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, operation: 'cleanupExpired' });
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

/**
 * Singleton instance of SessionRepository
 * مثيل وحيد من مستودع الجلسات
 */
let sessionRepositoryInstance: SessionRepository | null = null;

/**
 * Get the SessionRepository singleton instance
 * الحصول على مثيل مستودع الجلسات
 */
export function getSessionRepository(): SessionRepository {
  if (!sessionRepositoryInstance) {
    sessionRepositoryInstance = new SessionRepository();
  }
  return sessionRepositoryInstance;
}
