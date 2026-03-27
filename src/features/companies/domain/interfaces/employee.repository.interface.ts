/**
 * Employee Repository Interface
 * واجهة مستودع الموظفين
 * 
 * Defines the contract for employee data access operations following Clean Architecture principles.
 * This interface belongs to the domain layer and should not depend on infrastructure.
 */

import type { IRepository, BaseEntity } from '@/core/database';
import { EmployeeRole } from '@/core/types/enums';

// Re-export for convenience
export { EmployeeRole };

// ============================================
// Employee Entity Interface
// ============================================

/**
 * Employee entity interface
 * واجهة كيان الموظف
 * 
 * Represents an employee in a company.
 * Uses camelCase for property names (domain layer convention).
 */
export interface Employee extends BaseEntity {
  /** Company ID */
  companyId: string;
  
  /** User ID */
  userId: string;
  
  /** Employee role */
  role: EmployeeRole;
  
  /** JSON string of permissions */
  permissions: string | null;
  
  /** User who invited this employee */
  invitedBy: string | null;
  
  /** When the employee joined */
  joinedAt: Date | string | null;
}

// ============================================
// Invitation Entity Interface
// ============================================

/**
 * Invitation entity interface
 * واجهة كيان الدعوة
 * 
 * Represents an invitation to join a company.
 */
export interface Invitation extends BaseEntity {
  /** Company ID */
  companyId: string;
  
  /** Invited user's email */
  email: string;
  
  /** Role to assign */
  role: EmployeeRole;
  
  /** Unique invitation token */
  token: string;
  
  /** User who sent the invitation */
  invitedBy: string;
  
  /** Invitation status */
  status: InvitationStatus;
  
  /** When the invitation expires */
  expiresAt: Date | string;
}

/**
 * Invitation status enum
 * حالة الدعوة
 */
export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

// ============================================
// Employee Repository Interface
// ============================================

/**
 * Employee Repository Interface
 * واجهة مستودع الموظفين
 */
export interface IEmployeeRepository extends IRepository<Employee> {
  /**
   * Find employee by company and user ID
   * البحث عن موظف بواسطة الشركة والمستخدم
   * 
   * @param companyId - The company ID
   * @param userId - The user ID
   * @returns The employee if found, null otherwise
   */
  findByCompanyAndUser(companyId: string, userId: string): Promise<Employee | null>;

  /**
   * List all employees for a company
   * قائمة جميع موظفي الشركة
   * 
   * @param companyId - The company ID
   * @returns Array of employees
   */
  listByCompany(companyId: string): Promise<Employee[]>;

  /**
   * List all companies where user is an employee
   * قائمة جميع شركات الموظف
   * 
   * @param userId - The user ID
   * @returns Array of employees with company info
   */
  listByUser(userId: string): Promise<Employee[]>;

  /**
   * Update employee role
   * تحديث دور الموظف
   * 
   * @param employeeId - The employee ID
   * @param role - The new role
   * @param permissions - The new permissions
   */
  updateRole(employeeId: string, role: EmployeeRole, permissions: string): Promise<void>;
}

// ============================================
// Invitation Repository Interface
// ============================================

/**
 * Invitation Repository Interface
 * واجهة مستودع الدعوات
 */
export interface IInvitationRepository extends IRepository<Invitation> {
  /**
   * Find invitation by token
   * البحث عن دعوة بالرمز
   * 
   * @param token - The invitation token
   * @returns The invitation if found, null otherwise
   */
  findByToken(token: string): Promise<Invitation | null>;

  /**
   * Find pending invitation by company and email
   * البحث عن دعوة معلقة بواسطة الشركة والبريد
   * 
   * @param companyId - The company ID
   * @param email - The email address
   * @returns The invitation if found, null otherwise
   */
  findPendingByCompanyAndEmail(companyId: string, email: string): Promise<Invitation | null>;

  /**
   * List pending invitations for a company
   * قائمة الدعوات المعلقة للشركة
   * 
   * @param companyId - The company ID
   * @returns Array of pending invitations
   */
  listPendingByCompany(companyId: string): Promise<Invitation[]>;

  /**
   * Mark invitation as accepted
   * تحديد الدعوة كمقبولة
   * 
   * @param invitationId - The invitation ID
   */
  accept(invitationId: string): Promise<void>;

  /**
   * Mark invitation as declined
   * تحديد الدعوة كمرفوضة
   * 
   * @param invitationId - The invitation ID
   */
  decline(invitationId: string): Promise<void>;

  /**
   * Mark invitation as expired
   * تحديد الدعوة كمنتهية
   * 
   * @param invitationId - The invitation ID
   */
  expire(invitationId: string): Promise<void>;
}
