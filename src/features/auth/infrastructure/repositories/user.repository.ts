/**
 * User Repository Implementation
 * تنفيذ مستودع المستخدمين
 * 
 * Implements IUserRepository using Supabase as the data source.
 * Handles the conversion between domain entities (camelCase) and database rows (snake_case).
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES, type SupabaseUser } from '@/lib/supabase';
import type { User, UserRole, UserStatus, MembershipLevel, IUserRepository } from '../../domain/interfaces';
import { DatabaseError, DatabaseErrorCode } from '@/core/database';

// ============================================
// User Repository Implementation
// ============================================

/**
 * User Repository
 * مستودع المستخدمين
 * 
 * Provides data access operations for User entities.
 * Inherits common CRUD operations from BaseRepository and adds user-specific methods.
 */
export class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor() {
    super(TABLES.USERS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  /**
   * Convert database row (snake_case) to domain entity (camelCase)
   * تحويل صف قاعدة البيانات إلى كيان النطاق
   */
  protected override toEntity(row: Record<string, unknown>): User {
    const dbRow = row as unknown as SupabaseUser;
    
    return {
      id: dbRow.id,
      email: dbRow.email,
      phone: dbRow.phone,
      passwordHash: dbRow.password_hash,
      firstName: dbRow.first_name,
      lastName: dbRow.last_name,
      displayName: dbRow.display_name,
      avatar: dbRow.avatar,
      bio: dbRow.bio,
      status: dbRow.status as UserStatus,
      role: dbRow.role as UserRole,
      emailVerified: dbRow.email_verified,
      phoneVerified: dbRow.phone_verified,
      membershipLevel: dbRow.membership_level as MembershipLevel,
      loyaltyPoints: dbRow.loyalty_points,
      language: dbRow.language,
      lastLogin: dbRow.last_login,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  /**
   * Convert domain entity (camelCase) to database row (snake_case)
   * تحويل كيان النطاق إلى صف قاعدة البيانات
   */
  protected override toRow(entity: Partial<User>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    // Map each field from camelCase to snake_case
    if (entity.email !== undefined) row.email = entity.email;
    if (entity.phone !== undefined) row.phone = entity.phone;
    if (entity.passwordHash !== undefined) row.password_hash = entity.passwordHash;
    if (entity.firstName !== undefined) row.first_name = entity.firstName;
    if (entity.lastName !== undefined) row.last_name = entity.lastName;
    if (entity.displayName !== undefined) row.display_name = entity.displayName;
    if (entity.avatar !== undefined) row.avatar = entity.avatar;
    if (entity.bio !== undefined) row.bio = entity.bio;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.role !== undefined) row.role = entity.role;
    if (entity.emailVerified !== undefined) row.email_verified = entity.emailVerified;
    if (entity.phoneVerified !== undefined) row.phone_verified = entity.phoneVerified;
    if (entity.membershipLevel !== undefined) row.membership_level = entity.membershipLevel;
    if (entity.loyaltyPoints !== undefined) row.loyalty_points = entity.loyaltyPoints;
    if (entity.language !== undefined) row.language = entity.language;
    if (entity.lastLogin !== undefined) row.last_login = entity.lastLogin;

    return row;
  }

  // ============================================
  // User-Specific Repository Methods
  // ============================================

  /**
   * Find a user by email address
   * البحث عن مستخدم بالبريد الإلكتروني
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, email });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, email });
    }
  }

  /**
   * Find a user by phone number
   * البحث عن مستخدم برقم الهاتف
   */
  async findByPhone(phone: string): Promise<User | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('phone', phone)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, phone });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, phone });
    }
  }

  /**
   * Find a user by email or phone
   * البحث عن مستخدم بالبريد أو الهاتف
   */
  async findByEmailOrPhone(identifier: string): Promise<User | null> {
    try {
      const client = this.getClient();
      
      // Determine if identifier is email or phone
      const isEmail = identifier.includes('@');
      const field = isEmail ? 'email' : 'phone';
      
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq(field, identifier)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, identifier });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, identifier });
    }
  }

  /**
   * Update the last login timestamp
   * تحديث وقت آخر تسجيل دخول
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({ 
          last_login: now,
          updated_at: now 
        })
        .eq('id', userId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'updateLastLogin' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'updateLastLogin' });
    }
  }

  /**
   * Update user's account status
   * تحديث حالة حساب المستخدم
   */
  async updateStatus(userId: string, status: UserStatus): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({ 
          status,
          updated_at: now 
        })
        .eq('id', userId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, userId, status, operation: 'updateStatus' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId, status, operation: 'updateStatus' });
    }
  }

  /**
   * Mark email as verified
   * تأكيد البريد الإلكتروني
   */
  async verifyEmail(userId: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({ 
          email_verified: now,
          status: 'ACTIVE', // Auto-activate when email is verified
          updated_at: now 
        })
        .eq('id', userId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'verifyEmail' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'verifyEmail' });
    }
  }

  /**
   * Mark phone as verified
   * تأكيد رقم الهاتف
   */
  async verifyPhone(userId: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({ 
          phone_verified: now,
          status: 'ACTIVE', // Auto-activate when phone is verified
          updated_at: now 
        })
        .eq('id', userId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'verifyPhone' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'verifyPhone' });
    }
  }

  /**
   * Update user's password
   * تحديث كلمة المرور
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({ 
          password_hash: passwordHash,
          updated_at: now 
        })
        .eq('id', userId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'updatePassword' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'updatePassword' });
    }
  }

  /**
   * Add loyalty points to user
   * إضافة نقاط الولاء للمستخدم
   */
  async incrementLoyaltyPoints(userId: string, points: number): Promise<void> {
    try {
      const client = this.getClient();

      // Use raw SQL or increment function
      const { error } = await client.rpc('increment_loyalty_points', {
        user_id: userId,
        points_to_add: points
      });

      // If the RPC doesn't exist, fall back to a direct update
      if (error && error.code === 'PGRST202') {
        // Get current points first
        const { data: user, error: fetchError } = await client
          .from(this.tableName)
          .select('loyalty_points')
          .eq('id', userId)
          .single();

        if (fetchError) {
          throw DatabaseError.fromError(fetchError, { table: this.tableName, userId, operation: 'incrementLoyaltyPoints' });
        }

        const currentPoints = user?.loyalty_points || 0;
        const newPoints = Math.max(0, currentPoints + points); // Ensure non-negative

        const { error: updateError } = await client
          .from(this.tableName)
          .update({ 
            loyalty_points: newPoints,
            updated_at: new Date().toISOString() 
          })
          .eq('id', userId);

        if (updateError) {
          throw DatabaseError.fromError(updateError, { table: this.tableName, userId, operation: 'incrementLoyaltyPoints' });
        }
      } else if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'incrementLoyaltyPoints' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'incrementLoyaltyPoints' });
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

/**
 * Singleton instance of UserRepository
 * مثيل وحيد من مستودع المستخدمين
 */
let userRepositoryInstance: UserRepository | null = null;

/**
 * Get the UserRepository singleton instance
 * الحصول على مثيل مستودع المستخدمين
 */
export function getUserRepository(): UserRepository {
  if (!userRepositoryInstance) {
    userRepositoryInstance = new UserRepository();
  }
  return userRepositoryInstance;
}
