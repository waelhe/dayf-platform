/**
 * Resource Ownership System - نظام ملكية الموارد الجذري
 *
 * هذا النظام يتحقق تلقائياً من ملكية المستخدم للموارد.
 * يعمل مع Owner routes ويمنع IDOR vulnerabilities.
 *
 * المبدأ: Deny by Default (Constitution Article VI)
 *
 * ⚠️ مهم: جميع الحقول يجب أن تكون camelCase لتتطابق مع Repository Interfaces
 */

import { getBookingRepository } from '@/features/bookings/infrastructure/repositories/booking.repository';
import { getReviewRepository } from '@/features/reviews/infrastructure/repositories/review.repository';
import { getEscrowRepository } from '@/features/escrow/infrastructure/repositories/escrow.repository';
import { getCompanyRepository } from '@/features/companies/infrastructure/repositories/company.repository';
import { getDisputeRepository } from '@/features/disputes/infrastructure/repositories/dispute.repository';
import { getOrderRepository } from '@/features/orders/infrastructure/repositories/order.repository';
import { getTopicRepository, getReplyRepository } from '@/features/community/infrastructure/repositories/community.repository';
import { getProductRepository, getCartRepository, getWishlistRepository } from '@/features/marketplace/infrastructure/repositories';
import { getDestinationRepository, getActivityRepository, getTourRepository } from '@/features/tourism/infrastructure/repositories';
import { getEmployeeRepository, getInvitationRepository } from '@/features/companies/infrastructure/repositories';
import { servicesService } from '@/features/services/infrastructure/services-service';
import { Role } from '@/core/types/enums';

// ============================================
// Types
// ============================================

export interface ResourceConfig {
  /** اسم الجدول/المورد */
  entity: string;
  /** حقل المالك في الجدول (camelCase) */
  ownerField: string;
  /** هل يمكن للأدمن تجاوز التحقق */
  adminOverride: boolean;
  /** حقول إضافية للتحقق (اختياري) */
  additionalChecks?: ResourceCheck[];
}

export interface ResourceCheck {
  /** اسم الحقل للتحقق (camelCase) */
  field: string;
  /** القيمة المتوقعة */
  expectedValue?: string | number | boolean;
  /** مقارنة مخصصة */
  customCheck?: (value: unknown, userId: string) => boolean;
}

export interface OwnershipResult {
  /** هل يملك المستخدم المورد */
  isOwner: boolean;
  /** معرف المالك الفعلي */
  ownerId: string | null;
  /** هل يمكن للأدمن الوصول */
  isAdmin: boolean;
  /** سبب الرفض إن وجد */
  reason?: string;
}

// ============================================
// Resource Configurations
// ============================================

/**
 * تعريف ملكية كل مورد في النظام
 * 
 * ⚠️ جميع الحقول camelCase لتتطابق مع Repository Interfaces
 */
export const RESOURCE_CONFIGS: Record<string, ResourceConfig> = {
  // ============================================
  // الحجوزات - الضيف (صاحب الحجز) أو المضيف يمكنهم الوصول
  // ============================================
  bookings: {
    entity: 'bookings',
    ownerField: 'guestId', // ✅ camelCase - يتطابق مع Booking.guestId
    adminOverride: true,
    additionalChecks: [
      {
        // المضيف أيضاً يمكنه الوصول للحجز (لتأكيد/إلغاء)
        field: 'hostId', // ✅ camelCase
        customCheck: (value: unknown, userId: string) => value === userId,
      },
    ],
  },

  // ============================================
  // المراجعات - الكاتب
  // ============================================
  reviews: {
    entity: 'reviews',
    ownerField: 'authorId', // ✅ camelCase - يتطابق مع Review.authorId
    adminOverride: true,
  },

  // ============================================
  // الضمانات - المشتري والمزود
  // ============================================
  escrows: {
    entity: 'escrows',
    ownerField: 'buyerId', // ✅ camelCase - يتطابق مع Escrow.buyerId
    adminOverride: true,
    additionalChecks: [
      {
        // المزود أيضاً يمكنه الوصول للضمان
        field: 'providerId', // ✅ camelCase
        customCheck: (value: unknown, userId: string) => value === userId,
      },
    ],
  },

  // ============================================
  // الخدمات - المضيف
  // ============================================
  services: {
    entity: 'services',
    ownerField: 'hostId', // ✅ camelCase - يتطابق مع Service.hostId
    adminOverride: true,
  },

  // ============================================
  // الشركات - المالك
  // ============================================
  companies: {
    entity: 'companies',
    ownerField: 'ownerId', // ✅ camelCase - يتطابق مع Company.ownerId
    adminOverride: true,
  },

  // ============================================
  // النزاعات - صاحب النزاع والمدعى عليه
  // ============================================
  disputes: {
    entity: 'disputes',
    ownerField: 'openedBy', // ✅ camelCase - يتطابق مع Dispute.openedBy
    adminOverride: true,
    additionalChecks: [
      {
        // المدعى عليه أيضاً يمكنه الوصول للنزاع
        field: 'againstUser', // ✅ camelCase
        customCheck: (value: unknown, userId: string) => value === userId,
      },
    ],
  },

  // ============================================
  // المنتجات - البائع
  // ============================================
  products: {
    entity: 'products',
    ownerField: 'vendorId', // ✅ camelCase - يتطابق مع ProductEntity.vendorId
    adminOverride: true,
  },

  // ============================================
  // السلة - المستخدم
  // ============================================
  cart: {
    entity: 'cart', // ✅ Supabase uses 'cart' not 'carts'
    ownerField: 'userId', // ✅ camelCase - يتطابق مع CartEntity.userId
    adminOverride: true,
  },

  // ============================================
  // المفضلة - المستخدم
  // ============================================
  wishlist: {
    entity: 'wishlist', // ✅ Supabase uses 'wishlist' not 'wishlist_items'
    ownerField: 'userId', // ✅ camelCase - يتطابق مع WishlistItemEntity.userId
    adminOverride: true,
  },

  // ============================================
  // المواضيع - الكاتب
  // ============================================
  topics: {
    entity: 'topics',
    ownerField: 'authorId', // ✅ camelCase - يتطابق مع Topic.authorId
    adminOverride: true,
  },

  // ============================================
  // الردود - الكاتب
  // ============================================
  replies: {
    entity: 'replies',
    ownerField: 'authorId', // ✅ camelCase - يتطابق مع ReplyEntity.authorId
    adminOverride: true,
  },

  // ============================================
  // الطلبات - المستخدم
  // ============================================
  orders: {
    entity: 'orders',
    ownerField: 'userId', // ✅ camelCase - يتطابق مع Order.userId
    adminOverride: true,
  },

  // ============================================
  // الوجهات السياحية - المالك (اختياري) أو Admin فقط للتعديل
  // ============================================
  destinations: {
    entity: 'destinations',
    ownerField: 'ownerId', // ✅ camelCase - يتطابق مع Destination.ownerId
    adminOverride: true, // Admin فقط يمكنه التعديل عادة
  },

  // ============================================
  // الأنشطة السياحية - المالك (اختياري)
  // ============================================
  activities: {
    entity: 'activities',
    ownerField: 'ownerId', // ✅ camelCase - يتطابق مع Activity.ownerId
    adminOverride: true,
  },

  // ============================================
  // الجولات السياحية - المالك (اختياري)
  // ============================================
  tours: {
    entity: 'tours',
    ownerField: 'ownerId', // ✅ camelCase - يتطابق مع Tour.ownerId
    adminOverride: true,
  },

  // ============================================
  // الموظفين - المستخدم + الشركة
  // ============================================
  employees: {
    entity: 'company_employees',
    ownerField: 'userId', // ✅ camelCase - يتطابق مع Employee.userId
    adminOverride: true,
    additionalChecks: [
      {
        // مالك الشركة أيضاً يمكنه إدارة الموظفين
        field: 'companyId',
        customCheck: async (value: unknown, userId: string) => {
          // هذا يتحقق عبر Company.ownerId
          return false; // سيتم التحقق بشكل منفصل
        },
      },
    ],
  },

  // ============================================
  // الدعوات - الشركة (من خلال المالك/المدير)
  // ============================================
  invitations: {
    entity: 'company_invitations',
    ownerField: 'invitedBy', // ✅ camelCase - يتطابق مع Invitation.invitedBy
    adminOverride: true,
  },
};

// ============================================
// Repository Map - الربط مع Repositories الفعلية
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const repositoryMap: Record<string, () => { findById: (id: string) => Promise<any> }> = {
  // Core Resources
  bookings: getBookingRepository,
  reviews: getReviewRepository,
  escrows: getEscrowRepository,
  companies: getCompanyRepository,
  disputes: getDisputeRepository,
  orders: getOrderRepository,
  
  // Community
  topics: getTopicRepository,
  replies: getReplyRepository,
  
  // Marketplace
  products: getProductRepository,
  cart: getCartRepository,
  wishlist: getWishlistRepository,
  
  // Tourism
  destinations: getDestinationRepository,
  activities: getActivityRepository,
  tours: getTourRepository,
  
  // Company
  employees: getEmployeeRepository,
  invitations: getInvitationRepository,
};

// Special handlers for resources without standard repositories
const specialHandlers: Record<string, (id: string) => Promise<Record<string, unknown> | null>> = {
  services: async (id: string) => {
    const service = await servicesService.getById(id);
    if (!service) return null;
    // Convert to Record<string, unknown> for ownership checking
    return service as unknown as Record<string, unknown>;
  },
};

// ============================================
// Core Functions
// ============================================

/**
 * التحقق من ملكية مورد معين
 *
 * @param resourceType نوع المورد (bookings, reviews, etc.)
 * @param resourceId معرف المورد
 * @param userId معرف المستخدم
 * @param userRole دور المستخدم
 * @returns نتيجة التحقق من الملكية
 */
export async function verifyOwnership(
  resourceType: string,
  resourceId: string,
  userId: string,
  userRole: string
): Promise<OwnershipResult> {
  const config = RESOURCE_CONFIGS[resourceType];

  if (!config) {
    return {
      isOwner: false,
      ownerId: null,
      isAdmin: false,
      reason: `نوع المورد غير معروف: ${resourceType}`,
    };
  }

  // التحقق من صلاحية الأدمن
  const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
  if (isAdmin && config.adminOverride) {
    return {
      isOwner: true,
      ownerId: null,
      isAdmin: true,
    };
  }

  // الحصول على الـ repository المناسب
  const getRepo = repositoryMap[resourceType];
  const specialHandler = specialHandlers[resourceType];

  if (!getRepo && !specialHandler) {
    return {
      isOwner: false,
      ownerId: null,
      isAdmin: false,
      reason: `Repository غير موجود: ${resourceType}`,
    };
  }

  // الحصول على السجل - إما من repository أو special handler
  let record: Record<string, unknown> | null = null;

  if (specialHandler) {
    record = await specialHandler(resourceId);
  } else if (getRepo) {
    const repo = getRepo();
    record = await repo.findById(resourceId);
  }

  if (!record) {
    return {
      isOwner: false,
      ownerId: null,
      isAdmin: false,
      reason: 'المورد غير موجود',
    };
  }

  // التحقق من الملكية الأساسية
  const ownerId = record[config.ownerField] as string | null;
  const isOwner = ownerId === userId;

  if (isOwner) {
    return {
      isOwner: true,
      ownerId,
      isAdmin: false,
    };
  }

  // التحقق من الشروط الإضافية
  if (config.additionalChecks) {
    for (const check of config.additionalChecks) {
      const fieldValue = record[check.field];
      if (check.customCheck && check.customCheck(fieldValue, userId)) {
        return {
          isOwner: true,
          ownerId: fieldValue as string,
          isAdmin: false,
        };
      }
    }
  }

  return {
    isOwner: false,
    ownerId,
    isAdmin: false,
    reason: 'ليس لديك صلاحية الوصول لهذا المورد',
  };
}

/**
 * middleware للتحقق من ملكية المورد
 * يستخدم في الـ owner routes
 *
 * @param request الـ Next.js request
 * @param resourceType نوع المورد
 * @returns نتيجة التحقق أو خطأ
 */
export async function requireOwner(
  request: Request,
  resourceType: string
): Promise<{ userId: string; resourceId: string } | Response> {
  // الحصول على معلومات المستخدم من الـ headers (المضافة بواسطة middleware الجذري)
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role') || 'user';
  const resourceId = request.headers.get('x-resource-id');

  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'غير مصادق - يرجى تسجيل الدخول' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!resourceId) {
    return new Response(
      JSON.stringify({ error: 'معرف المورد غير موجود' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = await verifyOwnership(resourceType, resourceId, userId, userRole);

  if (!result.isOwner) {
    return new Response(
      JSON.stringify({
        error: result.reason || 'غير مصرح بالوصول لهذا المورد',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return { userId, resourceId };
}

/**
 * التحقق من ملكية مورد مع معرفة معرف المورد من الـ params
 *
 * @param resourceType نوع المورد
 * @param resourceId معرف المورد
 * @param userId معرف المستخدم
 * @param userRole دور المستخدم
 * @returns true إذا كان المالك أو الأدمن
 */
export async function isResourceOwner(
  resourceType: string,
  resourceId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  const result = await verifyOwnership(resourceType, resourceId, userId, userRole);
  return result.isOwner;
}

/**
 * الحصول على معرف مالك المورد
 *
 * @param resourceType نوع المورد
 * @param resourceId معرف المورد
 * @returns معرف المالك أو null
 */
export async function getResourceOwner(
  resourceType: string,
  resourceId: string
): Promise<string | null> {
  const config = RESOURCE_CONFIGS[resourceType];

  if (!config) {
    return null;
  }

  const getRepo = repositoryMap[resourceType];
  const specialHandler = specialHandlers[resourceType];

  if (!getRepo && !specialHandler) {
    return null;
  }

  let record: Record<string, unknown> | null = null;

  if (specialHandler) {
    record = await specialHandler(resourceId);
  } else if (getRepo) {
    const repo = getRepo();
    record = await repo.findById(resourceId);
  }

  if (!record) {
    return null;
  }

  return record[config.ownerField] as string | null;
}
