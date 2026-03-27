/**
 * OTP Repository Implementation
 * تنفيذ مستودع رموز التحقق
 * 
 * Implements IOTPRepository using Supabase as the data source.
 * Handles the conversion between domain entities (camelCase) and database rows (snake_case).
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES, type SupabaseOTPCode } from '@/lib/supabase';
import type { OTPCode, OTPType, IOTPRepository } from '../../domain/interfaces';
import { DatabaseError, DatabaseErrorCode } from '@/core/database';

// ============================================
// OTP Repository Implementation
// ============================================

/**
 * OTP Repository
 * مستودع رموز التحقق
 * 
 * Provides data access operations for OTPCode entities.
 * Inherits common CRUD operations from BaseRepository and adds OTP-specific methods.
 */
export class OTPRepository extends BaseRepository<OTPCode> implements IOTPRepository {
  constructor() {
    super(TABLES.OTP_CODES, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  /**
   * Convert database row (snake_case) to domain entity (camelCase)
   * تحويل صف قاعدة البيانات إلى كيان النطاق
   */
  protected override toEntity(row: Record<string, unknown>): OTPCode {
    const dbRow = row as unknown as SupabaseOTPCode;
    
    return {
      id: dbRow.id,
      phone: dbRow.phone,
      code: dbRow.code,
      type: dbRow.type as OTPType,
      verified: dbRow.verified,
      expiresAt: dbRow.expires_at,
      createdAt: dbRow.created_at,
    };
  }

  /**
   * Convert domain entity (camelCase) to database row (snake_case)
   * تحويل كيان النطاق إلى صف قاعدة البيانات
   */
  protected override toRow(entity: Partial<OTPCode>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    // Map each field from camelCase to snake_case
    if (entity.phone !== undefined) row.phone = entity.phone;
    if (entity.code !== undefined) row.code = entity.code;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.verified !== undefined) row.verified = entity.verified;
    if (entity.expiresAt !== undefined) row.expires_at = entity.expiresAt;

    return row;
  }

  // ============================================
  // OTP-Specific Repository Methods
  // ============================================

  /**
   * Find a valid (non-expired, unverified) OTP code
   * البحث عن رمز تحقق صالح
   */
  async findValidCode(phone: string, code: string, type: OTPType): Promise<OTPCode | null> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .eq('type', type)
        .eq('verified', false) // Not yet used
        .gt('expires_at', now) // Not expired
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, phone, type });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, phone, type });
    }
  }

  /**
   * Find an expired OTP code
   * البحث عن رمز تحقق منتهي
   */
  async findExpiredCode(phone: string, code: string, type: OTPType): Promise<OTPCode | null> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .eq('type', type)
        .lt('expires_at', now) // Expired
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, phone, type });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, phone, type });
    }
  }

  /**
   * Mark an OTP code as verified
   * تحديد رمز التحقق كمستخدم
   */
  async markAsVerified(id: string): Promise<void> {
    try {
      const client = this.getClient();

      const { error } = await client
        .from(this.tableName)
        .update({ 
          verified: true,
        })
        .eq('id', id);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'markAsVerified' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id, operation: 'markAsVerified' });
    }
  }

  /**
   * Delete all expired OTP codes
   * حذف جميع رموز التحقق المنتهية
   */
  async deleteExpiredCodes(): Promise<number> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(this.tableName)
        .delete()
        .lt('expires_at', now) // Delete all expired codes
        .select('id');

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, operation: 'deleteExpiredCodes' });
      }

      return data?.length || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, operation: 'deleteExpiredCodes' });
    }
  }

  /**
   * Count recent OTP codes sent to a phone
   * عدد رموز التحقق المرسلة مؤخراً
   */
  async countRecentCodes(phone: string, type: OTPType, since: Date): Promise<number> {
    try {
      const client = this.getClient();
      const sinceISO = since.toISOString();

      const { count, error } = await client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('phone', phone)
        .eq('type', type)
        .gte('created_at', sinceISO);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, phone, type, since: sinceISO });
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, phone, type });
    }
  }

  /**
   * Check if a phone has a verified code recently
   * التحقق من وجود رمز مؤكد حديثاً
   */
  async hasVerifiedCode(phone: string, type: OTPType, withinMinutes: number): Promise<boolean> {
    try {
      const client = this.getClient();
      const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000);
      const cutoffISO = cutoffTime.toISOString();

      const { count, error } = await client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('phone', phone)
        .eq('type', type)
        .eq('verified', true)
        .gte('updated_at', cutoffISO);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, phone, type, withinMinutes });
      }

      return (count || 0) > 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, phone, type });
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

/**
 * Singleton instance of OTPRepository
 * مثيل وحيد من مستودع رموز التحقق
 */
let otpRepositoryInstance: OTPRepository | null = null;

/**
 * Get the OTPRepository singleton instance
 * الحصول على مثيل مستودع رموز التحقق
 */
export function getOTPRepository(): OTPRepository {
  if (!otpRepositoryInstance) {
    otpRepositoryInstance = new OTPRepository();
  }
  return otpRepositoryInstance;
}
