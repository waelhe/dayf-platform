/**
 * Company Repository Interface
 * واجهة مستودع الشركات
 * 
 * Defines the contract for company data access operations following Clean Architecture principles.
 * This interface belongs to the domain layer and should not depend on infrastructure.
 */

import type { IRepository, BaseEntity } from '@/core/database';
import { CompanyType, CompanyStatus } from '@/core/types/enums';

// Re-export for convenience
export { CompanyType, CompanyStatus };

// ============================================
// Company Entity Interface
// ============================================

/**
 * Company entity interface
 * واجهة كيان الشركة
 * 
 * Represents a company in the system with all their attributes.
 * Uses camelCase for property names (domain layer convention).
 */
export interface Company extends BaseEntity {
  /** Company name */
  name: string;
  
  /** URL-friendly identifier */
  slug: string;
  
  /** Type of company (hotel, tour operator, etc.) */
  type: CompanyType;
  
  /** Company description */
  description: string | null;
  
  /** Contact email */
  email: string | null;
  
  /** Contact phone */
  phone: string | null;
  
  /** Website URL */
  website: string | null;
  
  /** Country location */
  country: string | null;
  
  /** City location */
  city: string | null;
  
  /** Physical address */
  address: string | null;
  
  /** Logo URL */
  logo: string | null;
  
  /** Cover image URL */
  coverImage: string | null;
  
  /** Commercial registration number */
  commercialReg: string | null;
  
  /** Tax identification number */
  taxNumber: string | null;
  
  /** JSON string of document URLs */
  documents: string | null;
  
  /** Current status */
  status: CompanyStatus;
  
  /** When the company was verified */
  verifiedAt: Date | string | null;
  
  /** Admin who verified the company */
  verifiedBy: string | null;
  
  /** Reason for rejection if applicable */
  rejectionReason: string | null;
  
  /** Total number of services */
  totalServices: number;
  
  /** Total number of products */
  totalProducts: number;
  
  /** Total number of bookings */
  totalBookings: number;
  
  /** Average rating */
  rating: number;
  
  /** Number of reviews */
  reviewCount: number;
  
  /** Owner user ID */
  ownerId: string;
}

// ============================================
// Company Filters
// ============================================

/**
 * Company list filters
 * فلاتر قائمة الشركات
 */
export interface CompanyFilters {
  type?: CompanyType;
  status?: CompanyStatus;
  city?: string;
  verified?: boolean;
  search?: string;
  ownerId?: string;
}

// ============================================
// Company Repository Interface
// ============================================

/**
 * Company Repository Interface
 * واجهة مستودع الشركات
 * 
 * Extends the base IRepository with company-specific operations.
 * All methods work with the Company entity type from the domain layer.
 */
export interface ICompanyRepository extends IRepository<Company> {
  /**
   * Find a company by slug
   * البحث عن شركة بالاسم المختصر
   * 
   * @param slug - The slug to search for
   * @returns The company if found, null otherwise
   */
  findBySlug(slug: string): Promise<Company | null>;

  /**
   * Find companies by owner ID
   * البحث عن شركات بواسطة المالك
   * 
   * @param ownerId - The owner's user ID
   * @returns Array of companies owned by the user
   */
  findByOwner(ownerId: string): Promise<Company[]>;

  /**
   * List companies with filters and pagination
   * قائمة الشركات مع الفلاتر والصفحات
   * 
   * @param filters - Filter options
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Paginated company list with total count
   */
  listWithFilters(
    filters: CompanyFilters,
    page: number,
    limit: number
  ): Promise<{ companies: Company[]; total: number }>;

  /**
   * Verify a company
   * توثيق الشركة
   * 
   * @param companyId - The company ID
   * @param adminId - The admin user ID who verified
   */
  verify(companyId: string, adminId: string): Promise<void>;

  /**
   * Suspend a company
   * تعليق الشركة
   * 
   * @param companyId - The company ID
   * @param reason - Reason for suspension
   */
  suspend(companyId: string, reason: string): Promise<void>;

  /**
   * Reject a company
   * رفض الشركة
   * 
   * @param companyId - The company ID
   * @param adminId - The admin user ID who rejected
   * @param reason - Reason for rejection
   */
  reject(companyId: string, adminId: string, reason: string): Promise<void>;

  /**
   * Update company statistics
   * تحديث إحصائيات الشركة
   * 
   * @param companyId - The company ID
   */
  updateStatistics(companyId: string): Promise<void>;
}
