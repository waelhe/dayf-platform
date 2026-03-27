/**
 * Employee Repository Implementation
 * تنفيذ مستودع الموظفين
 * 
 * Implements IEmployeeRepository using Supabase as the data source.
 * Handles the conversion between domain entities (camelCase) and database rows (snake_case).
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES, type SupabaseCompanyEmployee, type SupabaseCompanyInvitation } from '@/lib/supabase';
import type { Employee, Invitation, IEmployeeRepository, IInvitationRepository } from '../../domain/interfaces';
import { EmployeeRole, InvitationStatus } from '../../domain/interfaces';
import { DatabaseError } from '@/core/database';

// ============================================
// Employee Repository Implementation
// ============================================

/**
 * Employee Repository
 * مستودع الموظفين
 * 
 * Provides data access operations for Employee entities.
 */
export class EmployeeRepository extends BaseRepository<Employee> implements IEmployeeRepository {
  constructor() {
    super(TABLES.COMPANY_EMPLOYEES, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): Employee {
    const dbRow = row as unknown as SupabaseCompanyEmployee;
    
    return {
      id: dbRow.id,
      companyId: dbRow.company_id,
      userId: dbRow.user_id,
      role: dbRow.role as EmployeeRole,
      permissions: dbRow.permissions,
      invitedBy: dbRow.invited_by,
      joinedAt: dbRow.joined_at,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<Employee>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.companyId !== undefined) row.company_id = entity.companyId;
    if (entity.userId !== undefined) row.user_id = entity.userId;
    if (entity.role !== undefined) row.role = entity.role;
    if (entity.permissions !== undefined) row.permissions = entity.permissions;
    if (entity.invitedBy !== undefined) row.invited_by = entity.invitedBy;
    if (entity.joinedAt !== undefined) row.joined_at = entity.joinedAt;

    return row;
  }

  // ============================================
  // Employee-Specific Repository Methods
  // ============================================

  /**
   * Find employee by company and user ID
   * البحث عن موظف بواسطة الشركة والمستخدم
   */
  async findByCompanyAndUser(companyId: string, userId: string): Promise<Employee | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, companyId, userId });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, companyId, userId });
    }
  }

  /**
   * List all employees for a company
   * قائمة جميع موظفي الشركة
   */
  async listByCompany(companyId: string): Promise<Employee[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, companyId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, companyId });
    }
  }

  /**
   * List all companies where user is an employee
   * قائمة جميع شركات الموظف
   */
  async listByUser(userId: string): Promise<Employee[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

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
   * Update employee role
   * تحديث دور الموظف
   */
  async updateRole(employeeId: string, role: EmployeeRole, permissions: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          role,
          permissions,
          updated_at: now,
        })
        .eq('id', employeeId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, employeeId, operation: 'updateRole' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, employeeId, operation: 'updateRole' });
    }
  }
}

// ============================================
// Invitation Repository Implementation
// ============================================

/**
 * Invitation Repository
 * مستودع الدعوات
 * 
 * Provides data access operations for Invitation entities.
 */
export class InvitationRepository extends BaseRepository<Invitation> implements IInvitationRepository {
  constructor() {
    super(TABLES.COMPANY_INVITATIONS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): Invitation {
    const dbRow = row as unknown as SupabaseCompanyInvitation;
    
    return {
      id: dbRow.id,
      companyId: dbRow.company_id,
      email: dbRow.email,
      role: dbRow.role as EmployeeRole,
      token: dbRow.token,
      invitedBy: dbRow.invited_by,
      status: dbRow.status as InvitationStatus,
      expiresAt: dbRow.expires_at,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<Invitation>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.companyId !== undefined) row.company_id = entity.companyId;
    if (entity.email !== undefined) row.email = entity.email;
    if (entity.role !== undefined) row.role = entity.role;
    if (entity.token !== undefined) row.token = entity.token;
    if (entity.invitedBy !== undefined) row.invited_by = entity.invitedBy;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.expiresAt !== undefined) row.expires_at = entity.expiresAt;

    return row;
  }

  // ============================================
  // Invitation-Specific Repository Methods
  // ============================================

  /**
   * Find invitation by token
   * البحث عن دعوة بالرمز
   */
  async findByToken(token: string): Promise<Invitation | null> {
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
   * Find pending invitation by company and email
   * البحث عن دعوة معلقة بواسطة الشركة والبريد
   */
  async findPendingByCompanyAndEmail(companyId: string, email: string): Promise<Invitation | null> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .eq('email', email.toLowerCase())
        .eq('status', InvitationStatus.PENDING)
        .gt('expires_at', now)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, companyId, email });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, companyId, email });
    }
  }

  /**
   * List pending invitations for a company
   * قائمة الدعوات المعلقة للشركة
   */
  async listPendingByCompany(companyId: string): Promise<Invitation[]> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .eq('status', InvitationStatus.PENDING)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, companyId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, companyId });
    }
  }

  /**
   * Mark invitation as accepted
   * تحديد الدعوة كمقبولة
   */
  async accept(invitationId: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          status: InvitationStatus.ACCEPTED,
          updated_at: now,
        })
        .eq('id', invitationId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, invitationId, operation: 'accept' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, invitationId, operation: 'accept' });
    }
  }

  /**
   * Mark invitation as declined
   * تحديد الدعوة كمرفوضة
   */
  async decline(invitationId: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          status: InvitationStatus.DECLINED,
          updated_at: now,
        })
        .eq('id', invitationId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, invitationId, operation: 'decline' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, invitationId, operation: 'decline' });
    }
  }

  /**
   * Mark invitation as expired
   * تحديد الدعوة كمنتهية
   */
  async expire(invitationId: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          status: InvitationStatus.EXPIRED,
          updated_at: now,
        })
        .eq('id', invitationId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, invitationId, operation: 'expire' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, invitationId, operation: 'expire' });
    }
  }
}

// ============================================
// Singleton Instances
// ============================================

let employeeRepositoryInstance: EmployeeRepository | null = null;
let invitationRepositoryInstance: InvitationRepository | null = null;

/**
 * Get the EmployeeRepository singleton instance
 * الحصول على مثيل مستودع الموظفين
 */
export function getEmployeeRepository(): EmployeeRepository {
  if (!employeeRepositoryInstance) {
    employeeRepositoryInstance = new EmployeeRepository();
  }
  return employeeRepositoryInstance;
}

/**
 * Get the InvitationRepository singleton instance
 * الحصول على مثيل مستودع الدعوات
 */
export function getInvitationRepository(): InvitationRepository {
  if (!invitationRepositoryInstance) {
    invitationRepositoryInstance = new InvitationRepository();
  }
  return invitationRepositoryInstance;
}
