// Company Service - خدمة إدارة الشركات
// تم تحديثها لاستخدام Repository Pattern بدلاً من Prisma مباشرة

import { 
  getCompanyRepository,
  getEmployeeRepository,
} from './repositories';
import { getUserRepository } from '@/features/auth/infrastructure/repositories/user.repository';
import { 
  CompanyType, 
  CompanyStatus, 
  EmployeeRole,
} from '@/core/types/enums';
import type { 
  CreateCompanyInput, 
  UpdateCompanyInput, 
  CompanyResponse, 
  CompanyListFilters,
  CompanyPermission,
} from '../types';
import { COMPANY_PERMISSIONS, DEFAULT_PERMISSIONS } from '../types';
import { DatabaseError } from '@/core/database';
import { randomBytes } from 'crypto';

// ============================================
// Slug Generation
// ============================================

function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens
    .trim();
  
  const randomSuffix = randomBytes(4).toString('hex');
  return `${baseSlug}-${randomSuffix}`;
}

// ============================================
// Company Service
// ============================================

export const CompanyService = {
  // ----------------------------------------
  // Create Company
  // ----------------------------------------
  async createCompany(ownerId: string, input: CreateCompanyInput): Promise<CompanyResponse> {
    const companyRepo = getCompanyRepository();
    const employeeRepo = getEmployeeRepository();
    
    // Generate slug
    const slug = generateSlug(input.name);
    
    // Create company
    const company = await companyRepo.create({
      name: input.name,
      slug,
      type: input.type as CompanyType,
      description: input.description || null,
      email: input.email || null,
      phone: input.phone || null,
      website: input.website || null,
      country: input.country || null,
      city: input.city || null,
      address: input.address || null,
      commercialReg: input.commercialReg || null,
      taxNumber: input.taxNumber || null,
      documents: input.documents ? JSON.stringify(input.documents) : null,
      logo: null,
      coverImage: null,
      status: CompanyStatus.PENDING,
      verifiedAt: null,
      verifiedBy: null,
      rejectionReason: null,
      totalServices: 0,
      totalProducts: 0,
      totalBookings: 0,
      rating: 0,
      reviewCount: 0,
      ownerId,
    });
    
    // Add owner as employee with OWNER role
    await employeeRepo.create({
      companyId: company.id,
      userId: ownerId,
      role: EmployeeRole.OWNER,
      permissions: JSON.stringify(Object.values(COMPANY_PERMISSIONS)),
      invitedBy: null,
      joinedAt: new Date().toISOString(),
    });
    
    // Get owner info for response
    const userRepo = getUserRepository();
    const owner = await userRepo.findById(ownerId);
    
    return this.toResponse(company, owner ? {
      id: owner.id,
      displayName: owner.displayName,
      avatar: owner.avatar,
    } : undefined);
  },
  
  // ----------------------------------------
  // Get Company by ID
  // ----------------------------------------
  async getCompanyById(id: string): Promise<CompanyResponse | null> {
    const companyRepo = getCompanyRepository();
    const company = await companyRepo.findById(id);
    
    if (!company) return null;
    
    // Get owner info
    const userRepo = getUserRepository();
    const owner = await userRepo.findById(company.ownerId);
    
    return this.toResponse(company, owner ? {
      id: owner.id,
      displayName: owner.displayName,
      avatar: owner.avatar,
    } : undefined);
  },
  
  // ----------------------------------------
  // Get Company by Slug
  // ----------------------------------------
  async getCompanyBySlug(slug: string): Promise<CompanyResponse | null> {
    const companyRepo = getCompanyRepository();
    const company = await companyRepo.findBySlug(slug);
    
    if (!company) return null;
    
    // Get owner info
    const userRepo = getUserRepository();
    const owner = await userRepo.findById(company.ownerId);
    
    return this.toResponse(company, owner ? {
      id: owner.id,
      displayName: owner.displayName,
      avatar: owner.avatar,
    } : undefined);
  },
  
  // ----------------------------------------
  // List Companies
  // ----------------------------------------
  async listCompanies(filters: CompanyListFilters = {}): Promise<{
    companies: CompanyResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const companyRepo = getCompanyRepository();
    const userRepo = getUserRepository();
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    
    const { companies, total } = await companyRepo.listWithFilters(
      {
        type: filters.type as CompanyType,
        status: filters.status as CompanyStatus,
        city: filters.city,
        verified: filters.verified,
        search: filters.search,
      },
      page,
      limit
    );
    
    // Get owner info for each company
    const companiesWithOwners = await Promise.all(
      companies.map(async (company) => {
        const owner = await userRepo.findById(company.ownerId);
        return this.toResponse(company, owner ? {
          id: owner.id,
          displayName: owner.displayName,
          avatar: owner.avatar,
        } : undefined);
      })
    );
    
    return {
      companies: companiesWithOwners,
      total,
      page,
      limit,
    };
  },
  
  // ----------------------------------------
  // Update Company
  // ----------------------------------------
  async updateCompany(id: string, input: UpdateCompanyInput): Promise<CompanyResponse> {
    const companyRepo = getCompanyRepository();
    const userRepo = getUserRepository();
    
    const updateData: Record<string, unknown> = { ...input };
    
    // Handle documents array
    if (input.documents) {
      updateData.documents = JSON.stringify(input.documents);
    }
    
    // If critical info changes, require re-verification
    const criticalFields = ['name', 'commercialReg', 'taxNumber'];
    const hasCriticalChanges = criticalFields.some(field => input[field as keyof UpdateCompanyInput]);
    
    if (hasCriticalChanges) {
      const currentCompany = await companyRepo.findById(id);
      
      // If company was verified, reset verification
      if (currentCompany?.verifiedAt) {
        updateData.verifiedAt = null;
        updateData.status = CompanyStatus.PENDING;
      }
    }
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const company = await companyRepo.update(id, updateData);
    
    // Get owner info
    const owner = await userRepo.findById(company.ownerId);
    
    return this.toResponse(company, owner ? {
      id: owner.id,
      displayName: owner.displayName,
      avatar: owner.avatar,
    } : undefined);
  },
  
  // ----------------------------------------
  // Verify Company (Admin)
  // ----------------------------------------
  async verifyCompany(id: string, adminId: string): Promise<CompanyResponse> {
    const companyRepo = getCompanyRepository();
    const userRepo = getUserRepository();
    
    await companyRepo.verify(id, adminId);
    const company = await companyRepo.findById(id);
    
    if (!company) {
      throw new DatabaseError('Company not found after verification', 'NOT_FOUND');
    }
    
    // Get owner info
    const owner = await userRepo.findById(company.ownerId);
    
    return this.toResponse(company, owner ? {
      id: owner.id,
      displayName: owner.displayName,
      avatar: owner.avatar,
    } : undefined);
  },
  
  // ----------------------------------------
  // Reject Company (Admin)
  // ----------------------------------------
  async rejectCompany(id: string, adminId: string, reason: string): Promise<CompanyResponse> {
    const companyRepo = getCompanyRepository();
    const userRepo = getUserRepository();
    
    await companyRepo.reject(id, adminId, reason);
    const company = await companyRepo.findById(id);
    
    if (!company) {
      throw new DatabaseError('Company not found after rejection', 'NOT_FOUND');
    }
    
    // Get owner info
    const owner = await userRepo.findById(company.ownerId);
    
    return this.toResponse(company, owner ? {
      id: owner.id,
      displayName: owner.displayName,
      avatar: owner.avatar,
    } : undefined);
  },
  
  // ----------------------------------------
  // Suspend Company (Admin)
  // ----------------------------------------
  async suspendCompany(id: string, reason: string): Promise<CompanyResponse> {
    const companyRepo = getCompanyRepository();
    const userRepo = getUserRepository();
    
    await companyRepo.suspend(id, reason);
    const company = await companyRepo.findById(id);
    
    if (!company) {
      throw new DatabaseError('Company not found after suspension', 'NOT_FOUND');
    }
    
    // Get owner info
    const owner = await userRepo.findById(company.ownerId);
    
    return this.toResponse(company, owner ? {
      id: owner.id,
      displayName: owner.displayName,
      avatar: owner.avatar,
    } : undefined);
  },
  
  // ----------------------------------------
  // Get Companies by Owner
  // ----------------------------------------
  async getCompaniesByOwner(ownerId: string): Promise<CompanyResponse[]> {
    const companyRepo = getCompanyRepository();
    const userRepo = getUserRepository();
    
    const companies = await companyRepo.findByOwner(ownerId);
    
    // Get owner info
    const owner = await userRepo.findById(ownerId);
    
    return companies.map(c => this.toResponse(c, owner ? {
      id: owner.id,
      displayName: owner.displayName,
      avatar: owner.avatar,
    } : undefined));
  },
  
  // ----------------------------------------
  // Get Companies by Employee
  // ----------------------------------------
  async getCompaniesByEmployee(userId: string): Promise<{
    company: CompanyResponse;
    role: EmployeeRole;
    permissions: CompanyPermission[];
  }[]> {
    const companyRepo = getCompanyRepository();
    const employeeRepo = getEmployeeRepository();
    const userRepo = getUserRepository();
    
    const employees = await employeeRepo.listByUser(userId);
    
    const results = await Promise.all(
      employees.map(async (emp) => {
        const company = await companyRepo.findById(emp.companyId);
        if (!company) return null;
        
        const owner = await userRepo.findById(company.ownerId);
        
        return {
          company: this.toResponse(company, owner ? {
            id: owner.id,
            displayName: owner.displayName,
            avatar: owner.avatar,
          } : undefined),
          role: emp.role,
          permissions: emp.permissions ? JSON.parse(emp.permissions) : [],
        };
      })
    );
    
    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
  
  // ----------------------------------------
  // Check User Permission
  // ----------------------------------------
  async checkUserPermission(
    companyId: string, 
    userId: string, 
    permission: CompanyPermission
  ): Promise<boolean> {
    const employeeRepo = getEmployeeRepository();
    
    const employee = await employeeRepo.findByCompanyAndUser(companyId, userId);
    
    if (!employee) return false;
    
    // OWNER has all permissions
    if (employee.role === EmployeeRole.OWNER) return true;
    
    const permissions: CompanyPermission[] = employee.permissions 
      ? JSON.parse(employee.permissions) 
      : [];
    
    return permissions.includes(permission);
  },
  
  // ----------------------------------------
  // Get Employee Role
  // ----------------------------------------
  async getEmployeeRole(companyId: string, userId: string): Promise<EmployeeRole | null> {
    const employeeRepo = getEmployeeRepository();
    const employee = await employeeRepo.findByCompanyAndUser(companyId, userId);
    
    return employee?.role || null;
  },
  
  // ----------------------------------------
  // Update Statistics
  // ----------------------------------------
  async updateStatistics(companyId: string): Promise<void> {
    const companyRepo = getCompanyRepository();
    await companyRepo.updateStatistics(companyId);
  },
  
  // ----------------------------------------
  // Response Transformer
  // ----------------------------------------
  toResponse(
    company: { 
      id: string; 
      name: string; 
      slug: string; 
      type: string;
      description: string | null;
      email: string | null;
      phone: string | null;
      website: string | null;
      country: string | null;
      city: string | null;
      address: string | null;
      logo: string | null;
      coverImage: string | null;
      status: string;
      verifiedAt: Date | string | null;
      rating: number;
      reviewCount: number;
      totalServices: number;
      totalProducts: number;
      totalBookings: number;
      ownerId: string;
      createdAt: Date | string;
      updatedAt: Date | string;
    },
    owner?: { id: string; displayName: string; avatar: string | null }
  ): CompanyResponse {
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      type: company.type as CompanyType,
      description: company.description,
      email: company.email,
      phone: company.phone,
      website: company.website,
      country: company.country,
      city: company.city,
      address: company.address,
      logo: company.logo,
      coverImage: company.coverImage,
      status: company.status as CompanyStatus,
      verifiedAt: company.verifiedAt ? new Date(company.verifiedAt) : null,
      rating: company.rating,
      reviewCount: company.reviewCount,
      totalServices: company.totalServices,
      totalProducts: company.totalProducts,
      totalBookings: company.totalBookings || 0,
      ownerId: company.ownerId,
      createdAt: new Date(company.createdAt),
      updatedAt: new Date(company.updatedAt),
      owner,
      isVerified: !!company.verifiedAt,
    };
  },
};

export default CompanyService;
