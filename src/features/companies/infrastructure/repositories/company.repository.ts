/**
 * Company Repository Implementation
 * تنفيذ مستودع الشركات
 * 
 * Implements ICompanyRepository using Supabase as the data source.
 * Handles the conversion between domain entities (camelCase) and database rows (snake_case).
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES, type SupabaseCompany } from '@/lib/supabase';
import type { Company, CompanyFilters, ICompanyRepository } from '../../domain/interfaces';
import { CompanyType, CompanyStatus } from '@/core/types/enums';
import { DatabaseError } from '@/core/database';

// ============================================
// Company Repository Implementation
// ============================================

/**
 * Company Repository
 * مستودع الشركات
 * 
 * Provides data access operations for Company entities.
 * Inherits common CRUD operations from BaseRepository and adds company-specific methods.
 */
export class CompanyRepository extends BaseRepository<Company> implements ICompanyRepository {
  constructor() {
    super(TABLES.COMPANIES, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  /**
   * Convert database row (snake_case) to domain entity (camelCase)
   * تحويل صف قاعدة البيانات إلى كيان النطاق
   */
  protected override toEntity(row: Record<string, unknown>): Company {
    const dbRow = row as unknown as SupabaseCompany;
    
    return {
      id: dbRow.id,
      name: dbRow.name,
      slug: dbRow.slug,
      type: dbRow.type as CompanyType,
      description: dbRow.description,
      email: dbRow.email,
      phone: dbRow.phone,
      website: dbRow.website,
      country: dbRow.country,
      city: dbRow.city,
      address: dbRow.address,
      logo: dbRow.logo,
      coverImage: dbRow.cover_image,
      commercialReg: dbRow.commercial_reg,
      taxNumber: dbRow.tax_number,
      documents: dbRow.documents,
      status: dbRow.status as CompanyStatus,
      verifiedAt: dbRow.verified_at,
      verifiedBy: dbRow.verified_by,
      rejectionReason: dbRow.rejection_reason,
      totalServices: dbRow.total_services,
      totalProducts: dbRow.total_products,
      totalBookings: dbRow.total_bookings,
      rating: dbRow.rating,
      reviewCount: dbRow.review_count,
      ownerId: dbRow.owner_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  /**
   * Convert domain entity (camelCase) to database row (snake_case)
   * تحويل كيان النطاق إلى صف قاعدة البيانات
   */
  protected override toRow(entity: Partial<Company>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.name !== undefined) row.name = entity.name;
    if (entity.slug !== undefined) row.slug = entity.slug;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.email !== undefined) row.email = entity.email;
    if (entity.phone !== undefined) row.phone = entity.phone;
    if (entity.website !== undefined) row.website = entity.website;
    if (entity.country !== undefined) row.country = entity.country;
    if (entity.city !== undefined) row.city = entity.city;
    if (entity.address !== undefined) row.address = entity.address;
    if (entity.logo !== undefined) row.logo = entity.logo;
    if (entity.coverImage !== undefined) row.cover_image = entity.coverImage;
    if (entity.commercialReg !== undefined) row.commercial_reg = entity.commercialReg;
    if (entity.taxNumber !== undefined) row.tax_number = entity.taxNumber;
    if (entity.documents !== undefined) row.documents = entity.documents;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.verifiedAt !== undefined) row.verified_at = entity.verifiedAt;
    if (entity.verifiedBy !== undefined) row.verified_by = entity.verifiedBy;
    if (entity.rejectionReason !== undefined) row.rejection_reason = entity.rejectionReason;
    if (entity.totalServices !== undefined) row.total_services = entity.totalServices;
    if (entity.totalProducts !== undefined) row.total_products = entity.totalProducts;
    if (entity.totalBookings !== undefined) row.total_bookings = entity.totalBookings;
    if (entity.rating !== undefined) row.rating = entity.rating;
    if (entity.reviewCount !== undefined) row.review_count = entity.reviewCount;
    if (entity.ownerId !== undefined) row.owner_id = entity.ownerId;

    return row;
  }

  // ============================================
  // Company-Specific Repository Methods
  // ============================================

  /**
   * Find a company by slug
   * البحث عن شركة بالاسم المختصر
   */
  async findBySlug(slug: string): Promise<Company | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, slug });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, slug });
    }
  }

  /**
   * Find companies by owner ID
   * البحث عن شركات بواسطة المالك
   */
  async findByOwner(ownerId: string): Promise<Company[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, ownerId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, ownerId });
    }
  }

  /**
   * List companies with filters and pagination
   * قائمة الشركات مع الفلاتر والصفحات
   */
  async listWithFilters(
    filters: CompanyFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ companies: Company[]; total: number }> {
    try {
      const client = this.getClient();
      const offset = (page - 1) * limit;

      // Build query
      let query = client
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.city) {
        query = query.eq('city', filters.city);
      }
      if (filters.verified !== undefined) {
        if (filters.verified) {
          query = query.not('verified_at', 'is', null);
        } else {
          query = query.is('verified_at', null);
        }
      }
      if (filters.ownerId) {
        query = query.eq('owner_id', filters.ownerId);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply pagination and ordering
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, filters });
      }

      return {
        companies: (data || []).map(row => this.toEntity(row)),
        total: count || 0,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, filters });
    }
  }

  /**
   * Verify a company
   * توثيق الشركة
   */
  async verify(companyId: string, adminId: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          status: CompanyStatus.ACTIVE,
          verified_at: now,
          verified_by: adminId,
          rejection_reason: null,
          updated_at: now,
        })
        .eq('id', companyId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, companyId, operation: 'verify' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, companyId, operation: 'verify' });
    }
  }

  /**
   * Suspend a company
   * تعليق الشركة
   */
  async suspend(companyId: string, reason: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          status: CompanyStatus.SUSPENDED,
          rejection_reason: reason,
          updated_at: now,
        })
        .eq('id', companyId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, companyId, operation: 'suspend' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, companyId, operation: 'suspend' });
    }
  }

  /**
   * Reject a company
   * رفض الشركة
   */
  async reject(companyId: string, adminId: string, reason: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          status: CompanyStatus.SUSPENDED,
          verified_by: adminId,
          rejection_reason: reason,
          updated_at: now,
        })
        .eq('id', companyId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, companyId, operation: 'reject' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, companyId, operation: 'reject' });
    }
  }

  /**
   * Update company statistics
   * تحديث إحصائيات الشركة
   */
  async updateStatistics(companyId: string): Promise<void> {
    try {
      const client = this.getClient();

      // Count services
      const { count: serviceCount, error: serviceError } = await client
        .from(TABLES.SERVICES)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (serviceError) {
        throw DatabaseError.fromError(serviceError, { table: TABLES.SERVICES, companyId });
      }

      // Count products
      const { count: productCount, error: productError } = await client
        .from(TABLES.PRODUCTS)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (productError) {
        throw DatabaseError.fromError(productError, { table: TABLES.PRODUCTS, companyId });
      }

      // Count bookings (through services)
      const { data: serviceIds, error: servicesError } = await client
        .from(TABLES.SERVICES)
        .select('id')
        .eq('company_id', companyId);

      if (servicesError) {
        throw DatabaseError.fromError(servicesError, { table: TABLES.SERVICES, companyId });
      }

      let bookingCount = 0;
      if (serviceIds && serviceIds.length > 0) {
        const ids = serviceIds.map(s => s.id);
        const { count, error: bookingError } = await client
          .from(TABLES.BOOKINGS)
          .select('*', { count: 'exact', head: true })
          .in('service_id', ids);

        if (bookingError) {
          throw DatabaseError.fromError(bookingError, { table: TABLES.BOOKINGS, companyId });
        }
        bookingCount = count || 0;
      }

      // Update company
      const now = new Date().toISOString();
      const { error: updateError } = await client
        .from(this.tableName)
        .update({
          total_services: serviceCount || 0,
          total_products: productCount || 0,
          total_bookings: bookingCount,
          updated_at: now,
        })
        .eq('id', companyId);

      if (updateError) {
        throw DatabaseError.fromError(updateError, { table: this.tableName, companyId, operation: 'updateStatistics' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, companyId, operation: 'updateStatistics' });
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let companyRepositoryInstance: CompanyRepository | null = null;

/**
 * Get the CompanyRepository singleton instance
 * الحصول على مثيل مستودع الشركات
 */
export function getCompanyRepository(): CompanyRepository {
  if (!companyRepositoryInstance) {
    companyRepositoryInstance = new CompanyRepository();
  }
  return companyRepositoryInstance;
}
