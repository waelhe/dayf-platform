// Employee Service - خدمة إدارة موظفي الشركات
// تم تحديثها لاستخدام Repository Pattern بدلاً من Prisma مباشرة

import { getEmployeeRepository, getInvitationRepository, getCompanyRepository } from './repositories';
import { getUserRepository } from '@/features/auth/infrastructure/repositories/user.repository';
import { 
  EmployeeRole, 
  CompanyStatus,
  InvitationStatus,
} from '../domain/interfaces';
import type { 
  InviteEmployeeInput, 
  AcceptInvitationInput,
  EmployeeResponse,
  InvitationResponse,
  CompanyPermission,
} from '../types';
import { DEFAULT_PERMISSIONS } from '../types';
import { randomBytes } from 'crypto';

// Invitation expiry: 7 days
const INVITATION_EXPIRY_DAYS = 7;

// ============================================
// Employee Service
// ============================================

export const EmployeeService = {
  // ----------------------------------------
  // Invite Employee
  // ----------------------------------------
  async inviteEmployee(
    companyId: string, 
    invitedBy: string, 
    input: InviteEmployeeInput
  ): Promise<InvitationResponse> {
    const companyRepo = getCompanyRepository();
    const employeeRepo = getEmployeeRepository();
    const invitationRepo = getInvitationRepository();
    const userRepo = getUserRepository();
    
    // Check if company exists and is active
    const company = await companyRepo.findById(companyId);
    
    if (!company) {
      throw new Error('الشركة غير موجودة');
    }
    
    if (company.status !== CompanyStatus.ACTIVE) {
      throw new Error('الشركة غير نشطة');
    }
    
    // Check if user is already an employee
    const existingUser = await userRepo.findByEmail(input.email);
    
    if (existingUser) {
      const existingEmployee = await employeeRepo.findByCompanyAndUser(companyId, existingUser.id);
      
      if (existingEmployee) {
        throw new Error('المستخدم موظف بالفعل في هذه الشركة');
      }
    }
    
    // Check for pending invitation
    const existingInvitation = await invitationRepo.findPendingByCompanyAndEmail(companyId, input.email);
    
    if (existingInvitation) {
      throw new Error('توجد دعوة معلقة بالفعل لهذا البريد');
    }
    
    // Generate token
    const token = randomBytes(32).toString('hex');
    
    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);
    
    // Create invitation
    const invitation = await invitationRepo.create({
      companyId,
      email: input.email.toLowerCase(),
      role: input.role as EmployeeRole,
      token,
      invitedBy,
      status: InvitationStatus.PENDING,
      expiresAt: expiresAt.toISOString(),
    });
    
    return this.toInvitationResponse(invitation, {
      id: company.id,
      name: company.name,
      type: company.type,
    });
  },
  
  // ----------------------------------------
  // Accept Invitation
  // ----------------------------------------
  async acceptInvitation(userId: string, input: AcceptInvitationInput): Promise<EmployeeResponse> {
    const invitationRepo = getInvitationRepository();
    const employeeRepo = getEmployeeRepository();
    const userRepo = getUserRepository();
    const companyRepo = getCompanyRepository();
    
    // Find invitation
    const invitation = await invitationRepo.findByToken(input.token);
    
    if (!invitation) {
      throw new Error('الدعوة غير موجودة');
    }
    
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new Error('الدعوة مستخدمة بالفعل');
    }
    
    const invitationExpiresAt = typeof invitation.expiresAt === 'string' 
      ? new Date(invitation.expiresAt) 
      : invitation.expiresAt;
    
    if (invitationExpiresAt < new Date()) {
      // Mark as expired
      await invitationRepo.expire(invitation.id);
      throw new Error('انتهت صلاحية الدعوة');
    }
    
    // Get user
    const user = await userRepo.findById(userId);
    
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }
    
    // Verify email matches
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error('البريد الإلكتروني غير متطابق');
    }
    
    // Get default permissions for role
    const permissions = DEFAULT_PERMISSIONS[invitation.role];
    
    // Create employee
    const employee = await employeeRepo.create({
      companyId: invitation.companyId,
      userId,
      role: invitation.role,
      permissions: JSON.stringify(permissions),
      invitedBy: invitation.invitedBy,
      joinedAt: new Date().toISOString(),
    });
    
    // Update invitation status
    await invitationRepo.accept(invitation.id);
    
    return this.toEmployeeResponse(employee, {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
    });
  },
  
  // ----------------------------------------
  // Decline Invitation
  // ----------------------------------------
  async declineInvitation(token: string): Promise<void> {
    const invitationRepo = getInvitationRepository();
    
    const invitation = await invitationRepo.findByToken(token);
    
    if (!invitation) {
      throw new Error('الدعوة غير موجودة');
    }
    
    await invitationRepo.decline(invitation.id);
  },
  
  // ----------------------------------------
  // Remove Employee
  // ----------------------------------------
  async removeEmployee(companyId: string, employeeId: string, removedBy: string): Promise<void> {
    const employeeRepo = getEmployeeRepository();
    
    // Check if remover is owner or manager
    const remover = await employeeRepo.findByCompanyAndUser(companyId, removedBy);
    
    if (!remover || (remover.role !== EmployeeRole.OWNER && remover.role !== EmployeeRole.MANAGER)) {
      throw new Error('ليس لديك صلاحية لإزالة الموظفين');
    }
    
    // Get employee to remove
    const employee = await employeeRepo.findById(employeeId);
    
    if (!employee || employee.companyId !== companyId) {
      throw new Error('الموظف غير موجود');
    }
    
    // Cannot remove owner
    if (employee.role === EmployeeRole.OWNER) {
      throw new Error('لا يمكن إزالة المالك');
    }
    
    // Manager cannot remove another manager
    if (remover.role === EmployeeRole.MANAGER && employee.role === EmployeeRole.MANAGER) {
      throw new Error('لا يمكن للمدير إزالة مدير آخر');
    }
    
    await employeeRepo.delete(employeeId);
  },
  
  // ----------------------------------------
  // Update Employee Role
  // ----------------------------------------
  async updateEmployeeRole(
    companyId: string,
    employeeId: string,
    newRole: EmployeeRole,
    updatedBy: string
  ): Promise<EmployeeResponse> {
    const employeeRepo = getEmployeeRepository();
    const userRepo = getUserRepository();
    
    // Check if updater is owner
    const updater = await employeeRepo.findByCompanyAndUser(companyId, updatedBy);
    
    if (!updater || updater.role !== EmployeeRole.OWNER) {
      throw new Error('فقط المالك يمكنه تغيير الأدوار');
    }
    
    const employee = await employeeRepo.findById(employeeId);
    
    if (!employee || employee.companyId !== companyId) {
      throw new Error('الموظف غير موجود');
    }
    
    // Cannot change owner role
    if (employee.role === EmployeeRole.OWNER) {
      throw new Error('لا يمكن تغيير دور المالك');
    }
    
    // Update role and permissions
    const permissions = DEFAULT_PERMISSIONS[newRole];
    
    await employeeRepo.updateRole(employeeId, newRole, JSON.stringify(permissions));
    
    // Get updated employee
    const updated = await employeeRepo.findById(employeeId);
    
    if (!updated) {
      throw new Error('الموظف غير موجود بعد التحديث');
    }
    
    // Get user info
    const user = await userRepo.findById(updated.userId);
    
    return this.toEmployeeResponse(updated, user ? {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
    } : undefined);
  },
  
  // ----------------------------------------
  // List Employees
  // ----------------------------------------
  async listEmployees(companyId: string): Promise<EmployeeResponse[]> {
    const employeeRepo = getEmployeeRepository();
    const userRepo = getUserRepository();
    
    const employees = await employeeRepo.listByCompany(companyId);
    
    const results = await Promise.all(
      employees.map(async (emp) => {
        const user = await userRepo.findById(emp.userId);
        return this.toEmployeeResponse(emp, user ? {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          avatar: user.avatar,
        } : undefined);
      })
    );
    
    return results;
  },
  
  // ----------------------------------------
  // List Pending Invitations
  // ----------------------------------------
  async listPendingInvitations(companyId: string): Promise<InvitationResponse[]> {
    const invitationRepo = getInvitationRepository();
    const companyRepo = getCompanyRepository();
    
    const invitations = await invitationRepo.listPendingByCompany(companyId);
    
    // Get company info
    const company = await companyRepo.findById(companyId);
    
    return invitations.map(i => this.toInvitationResponse(i, company ? {
      id: company.id,
      name: company.name,
      type: company.type,
    } : undefined));
  },
  
  // ----------------------------------------
  // Get Invitation by Token
  // ----------------------------------------
  async getInvitationByToken(token: string): Promise<InvitationResponse | null> {
    const invitationRepo = getInvitationRepository();
    const companyRepo = getCompanyRepository();
    
    const invitation = await invitationRepo.findByToken(token);
    
    if (!invitation) return null;
    
    // Get company info
    const company = await companyRepo.findById(invitation.companyId);
    
    return this.toInvitationResponse(invitation, company ? {
      id: company.id,
      name: company.name,
      type: company.type,
    } : undefined);
  },
  
  // ----------------------------------------
  // Cancel Invitation
  // ----------------------------------------
  async cancelInvitation(companyId: string, invitationId: string): Promise<void> {
    const invitationRepo = getInvitationRepository();
    
    const invitation = await invitationRepo.findById(invitationId);
    
    if (!invitation || invitation.companyId !== companyId || invitation.status !== InvitationStatus.PENDING) {
      throw new Error('الدعوة غير موجودة');
    }
    
    await invitationRepo.delete(invitationId);
  },
  
  // ----------------------------------------
  // Response Transformers
  // ----------------------------------------
  toEmployeeResponse(
    employee: { 
      id: string; 
      companyId: string; 
      userId: string; 
      role: EmployeeRole; 
      permissions: string | null; 
      joinedAt: Date | string | null;
    },
    user?: { id: string; displayName: string; email: string | null; avatar: string | null }
  ): EmployeeResponse {
    return {
      id: employee.id,
      companyId: employee.companyId,
      userId: employee.userId,
      role: employee.role,
      permissions: employee.permissions ? JSON.parse(employee.permissions) : null,
      joinedAt: employee.joinedAt ? new Date(employee.joinedAt) : new Date(),
      user: user || { id: employee.userId, displayName: 'مستخدم', email: null, avatar: null },
    };
  },
  
  toInvitationResponse(
    invitation: { 
      id: string; 
      companyId: string; 
      email: string; 
      role: EmployeeRole; 
      status: InvitationStatus;
      expiresAt: Date | string;
      createdAt: Date | string;
    },
    company?: { id: string; name: string; type: string }
  ): InvitationResponse {
    return {
      id: invitation.id,
      companyId: invitation.companyId,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: new Date(invitation.expiresAt),
      createdAt: new Date(invitation.createdAt),
      company,
    };
  },
};

export default EmployeeService;
