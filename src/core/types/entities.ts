/**
 * Unified Entity Types - أنواع الكيانات الموحدة
 *
 * هذا الملف يحدد الأنواع الأساسية لجميع الكيانات في المنصة.
 * كل الكيانات ترث من BaseEntity وتستخدم الـ enums من ./enums.ts
 *
 * المبدأ: Single Source of Truth - كل نوع يُعرّف مرة واحدة
 *
 * @example
 * ```typescript
 * import { Booking, BookingStatus } from '@/core/types';
 * // أو
 * import type { Booking } from '@/core/types/entities';
 * import { BookingStatus } from '@/core/types/enums';
 * ```
 */

import type { BaseEntity, ID, JsonEntity, PaginatedResult } from './base';
import type {
  RoleType,
  UserStatusType,
  GenderType,
  MembershipLevelType,
  BookingStatusType,
  OrderStatusType,
  CompanyTypeType,
  CompanyStatusType,
  EmployeeRoleType,
  InvitationStatusType,
  ServiceCategoryType,
  ServiceStatusType,
  DestinationTypeType,
  ActivityTypeType,
  EscrowStatusType,
  ReviewStatusType,
  ReviewTypeType,
  ProductStatusType,
  TopicCategoryType,
  DisputeTypeType,
  DisputeStatusType,
  DisputeDecisionType,
} from './enums';

// Re-export base types for convenience
export type { BaseEntity, ID, JsonEntity, PaginatedResult } from './base';
export * from './base';

// ============================================
// User & Profile Entities
// ============================================

/**
 * ملف المستخدم
 */
export interface Profile extends BaseEntity {
  email: string | null;
  phone: string | null;
  displayName: string;
  fullName?: string | null;
  avatar?: string | null;
  role: RoleType;
  status: UserStatusType;
  gender?: GenderType | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  membershipLevel?: MembershipLevelType | null;
  emailVerified?: Date | null;
  phoneVerified?: Date | null;
}

/**
 * جلسة المستخدم
 */
export interface Session extends BaseEntity {
  userId: ID;
  token: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * كود OTP
 */
export interface OTPCode extends BaseEntity {
  phone: string;
  code: string;
  type: 'LOGIN' | 'REGISTER' | 'VERIFY' | 'RESET_PASSWORD';
  expiresAt: Date;
  used: boolean;
}

// ============================================
// Company Entities
// ============================================

/**
 * الشركة
 */
export interface Company extends BaseEntity {
  name: string;
  slug: string;
  type: CompanyTypeType;
  status: CompanyStatusType;
  description?: string | null;
  ownerId: ID;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  verifiedAt?: Date | null;
}

/**
 * موظف الشركة
 */
export interface Employee extends BaseEntity {
  companyId: ID;
  userId: ID;
  role: EmployeeRoleType;
  permissions?: string[] | null;
}

/**
 * دعوة موظف
 */
export interface Invitation extends BaseEntity {
  companyId: ID;
  email: string;
  role: EmployeeRoleType;
  token: string;
  status: InvitationStatusType;
  expiresAt: Date;
  invitedBy: ID;
}

// ============================================
// Service Entities
// ============================================

/**
 * الخدمة
 */
export interface Service extends BaseEntity {
  title: string;
  slug: string;
  description?: string | null;
  hostId: ID;
  companyId?: ID | null;
  category: ServiceCategoryType;
  status: ServiceStatusType;
  price?: number | null;
  priceUnit?: string | null;
  capacity?: number | null;
  minDuration?: number | null;
  maxDuration?: number | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  amenities?: string[] | null;
  features?: string[] | null;
  images?: string[] | null;
  verifiedAt?: Date | null;
}

// ============================================
// Booking Entities
// ============================================

/**
 * الحجز (يتطابق مع قاعدة البيانات الفعلية)
 * Booking entity (matches actual database schema)
 */
export interface Booking extends BaseEntity {
  /** الضيف - معرف المستخدم الذي قام بالحجز */
  guestId: ID;
  /** المضيف - معرف مالك الخدمة */
  hostId: ID;
  /** معرف الخدمة */
  serviceId: ID;
  /** تاريخ الوصول */
  checkIn: Date;
  /** تاريخ المغادرة */
  checkOut: Date;
  /** عدد الضيوف */
  guests: number;
  /** السعر الإجمالي */
  totalPrice: number;
  /** حالة الحجز */
  status: BookingStatusType;
  /** معرف الضمان (اختياري) */
  escrowId?: ID | null;
}

// ============================================
// Escrow Entities
// ============================================

/**
 * الضمان
 */
export interface Escrow extends BaseEntity {
  bookingId: ID;
  buyerId: ID;
  providerId: ID;
  amount: number;
  status: EscrowStatusType;
  fundedAt?: Date | null;
  releasedAt?: Date | null;
  refundedAt?: Date | null;
  releaseScheduledAt?: Date | null;
}

/**
 * معاملة الضمان
 */
export interface EscrowTransaction extends BaseEntity {
  escrowId: ID;
  type: 'FUND' | 'RELEASE' | 'REFUND' | 'PARTIAL_REFUND' | 'FEE';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string | null;
}

// ============================================
// Review Entities
// ============================================

/**
 * المراجعة
 */
export interface Review extends BaseEntity {
  authorId: ID;
  referenceId: ID;
  referenceType: ReviewTypeType;
  bookingId?: ID | null;
  rating: number;
  title?: string | null;
  content?: string | null;
  status: ReviewStatusType;
  verified: boolean;
  helpfulCount: number;
  replyCount: number;
}

/**
 * صورة المراجعة
 */
export interface ReviewPhoto extends BaseEntity {
  reviewId: ID;
  url: string;
  caption?: string | null;
  order: number;
}

/**
 * رد المراجعة
 */
export interface ReviewReply extends BaseEntity {
  reviewId: ID;
  authorId: ID;
  content: string;
}

/**
 * تصويت مفيد
 */
export interface ReviewHelpful extends BaseEntity {
  reviewId: ID;
  userId: ID;
}

/**
 * ملف المراجع
 */
export interface ReviewerProfile extends BaseEntity {
  userId: ID;
  level: 'NEW_REVIEWER' | 'ACTIVE_REVIEWER' | 'EXPERT_REVIEWER' | 'TRUSTED_REVIEWER';
  totalReviews: number;
  helpfulVotes: number;
  badges?: string[] | null;
}

// ============================================
// Dispute Entities
// ============================================

/**
 * النزاع
 */
export interface Dispute extends BaseEntity {
  escrowId: ID;
  complainantId: ID;
  respondentId: ID;
  type: DisputeTypeType;
  status: DisputeStatusType;
  reason: string;
  resolution?: string | null;
  decision?: DisputeDecisionType | null;
  resolvedAt?: Date | null;
  resolvedBy?: ID | null;
}

/**
 * رسالة النزاع
 */
export interface DisputeMessage extends BaseEntity {
  disputeId: ID;
  senderId: ID;
  content: string;
  attachments?: string[] | null;
}

// ============================================
// Destination & Activity Entities
// ============================================

/**
 * الوجهة السياحية
 */
export interface Destination extends BaseEntity {
  name: string;
  slug: string;
  type: DestinationTypeType;
  description?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: string[] | null;
  featured: boolean;
  verifiedAt?: Date | null;
}

/**
 * النشاط السياحي
 */
export interface Activity extends BaseEntity {
  name: string;
  slug: string;
  destinationId?: ID | null;
  type: ActivityTypeType;
  description?: string | null;
  duration?: number | null;
  price?: number | null;
  images?: string[] | null;
  featured: boolean;
  approvedAt?: Date | null;
}

// ============================================
// Marketplace Entities
// ============================================

/**
 * المنتج
 */
export interface Product extends BaseEntity {
  name: string;
  slug: string;
  description?: string | null;
  vendorId: ID;
  price: number;
  comparePrice?: number | null;
  status: ProductStatusType;
  quantity: number;
  images?: string[] | null;
  category?: string | null;
}

/**
 * السلة
 */
export interface Cart extends BaseEntity {
  userId: ID;
}

/**
 * عنصر السلة
 */
export interface CartItem extends BaseEntity {
  cartId: ID;
  productId: ID;
  quantity: number;
  price: number;
}

/**
 * عنصر المفضلة
 */
export interface WishlistItem extends BaseEntity {
  userId: ID;
  itemType: 'service' | 'product' | 'destination' | 'activity';
  itemId: ID;
}

// ============================================
// Community Entities
// ============================================

/**
 * موضوع المجتمع
 */
export interface Topic extends BaseEntity {
  title: string;
  content: string;
  authorId: ID;
  category: TopicCategoryType;
  pinned: boolean;
  locked: boolean;
  views: number;
  likeCount: number;
  replyCount: number;
}

/**
 * رد المجتمع
 */
export interface CommunityReply extends BaseEntity {
  topicId: ID;
  authorId: ID;
  content: string;
  likeCount: number;
}

// ============================================
// Order Entities
// ============================================

/**
 * الطلب
 */
export interface Order extends BaseEntity {
  userId: ID;
  status: OrderStatusType;
  totalAmount: number;
  shippingAddress?: string | null;
  notes?: string | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
}

/**
 * عنصر الطلب
 */
export interface OrderItem extends BaseEntity {
  orderId: ID;
  productId: ID;
  quantity: number;
  price: number;
}

// ============================================
// Type Guards
// ============================================

/**
 * التحقق من أن الكائن هو Profile
 */
export function isProfile(value: unknown): value is Profile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'displayName' in value &&
    'role' in value
  );
}

/**
 * التحقق من أن الكائن هو Service
 */
export function isService(value: unknown): value is Service {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'hostId' in value &&
    'category' in value
  );
}

/**
 * التحقق من أن الكائن هو Booking
 */
export function isBooking(value: unknown): value is Booking {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'userId' in value &&
    'serviceId' in value &&
    'status' in value
  );
}
