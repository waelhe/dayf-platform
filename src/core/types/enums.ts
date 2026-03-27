/**
 * Unified Enums - الأنواع المشتركة الموحدة
 *
 * هذا الملف هو المصدر الوحيد لجميع الـ enums في المنصة.
 * كل الـ enums تُعرّف هنا ثم تُستورد من أي مكان آخر.
 *
 * المبدأ: Single Source of Truth - لا تكرار
 *
 * @example
 * ```typescript
 * import { BookingStatus, Role } from '@/core/types/enums';
 * // أو
 * import { BookingStatus, Role } from '@/core/types';
 * ```
 */

// ============================================
// User Enums
// ============================================

/**
 * أدوار المستخدمين
 */
export enum Role {
  GUEST = 'GUEST',
  USER = 'USER',
  HOST = 'HOST',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/**
 * نوع الأنواع (للأدوار كـ type)
 */
export type RoleType = `${Role}`;

/**
 * حالة المستخدم
 */
export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export type UserStatusType = `${UserStatus}`;

/**
 * الجنس
 */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export type GenderType = `${Gender}`;

/**
 * مستوى العضوية
 */
export enum MembershipLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export type MembershipLevelType = `${MembershipLevel}`;

/**
 * مزود OAuth
 */
export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
  FACEBOOK = 'FACEBOOK',
}

export type OAuthProviderType = `${OAuthProvider}`;

/**
 * نوع OTP
 */
export enum OTPType {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  VERIFY = 'VERIFY',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

export type OTPTypeType = `${OTPType}`;

/**
 * نوع التحقق
 */
export enum VerificationType {
  IDENTITY = 'IDENTITY',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  ADDRESS = 'ADDRESS',
  BUSINESS = 'BUSINESS',
}

export type VerificationTypeType = `${VerificationType}`;

/**
 * حالة التحقق
 */
export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type VerificationStatusType = `${VerificationStatus}`;

// ============================================
// Booking Enums
// ============================================

/**
 * حالة الحجز
 */
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export type BookingStatusType = `${BookingStatus}`;

/**
 * حالة الطلب
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export type OrderStatusType = `${OrderStatus}`;

// ============================================
// Company Enums
// ============================================

/**
 * نوع الشركة
 */
export enum CompanyType {
  HOTEL = 'HOTEL',
  TOUR_OPERATOR = 'TOUR_OPERATOR',
  TRANSPORT = 'TRANSPORT',
  RESTAURANT = 'RESTAURANT',
  SHOP = 'SHOP',
  TRAVEL_AGENCY = 'TRAVEL_AGENCY',
  CAR_RENTAL = 'CAR_RENTAL',
  EVENT_ORGANIZER = 'EVENT_ORGANIZER',
  OTHER = 'OTHER',
}

export type CompanyTypeType = `${CompanyType}`;

/**
 * حالة الشركة
 */
export enum CompanyStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export type CompanyStatusType = `${CompanyStatus}`;

/**
 * دور الموظف
 */
export enum EmployeeRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  VIEWER = 'VIEWER',
}

export type EmployeeRoleType = `${EmployeeRole}`;

/**
 * حالة الدعوة
 */
export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

export type InvitationStatusType = `${InvitationStatus}`;

// ============================================
// Service Enums
// ============================================

/**
 * فئة الخدمة
 */
export enum ServiceCategory {
  ACCOMMODATION = 'ACCOMMODATION',
  FOOD = 'FOOD',
  TRANSPORT = 'TRANSPORT',
  TOURISM = 'TOURISM',
  MEDICAL = 'MEDICAL',
  REAL_ESTATE = 'REAL_ESTATE',
  OTHER = 'OTHER',
}

export type ServiceCategoryType = `${ServiceCategory}`;

/**
 * حالة الخدمة
 */
export enum ServiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export type ServiceStatusType = `${ServiceStatus}`;

// ============================================
// Destination & Activity Enums
// ============================================

/**
 * نوع الوجهة
 */
export enum DestinationType {
  CITY = 'CITY',
  HISTORICAL_SITE = 'HISTORICAL_SITE',
  NATURAL_LANDMARK = 'NATURAL_LANDMARK',
  RELIGIOUS_SITE = 'RELIGIOUS_SITE',
  MUSEUM = 'MUSEUM',
  BEACH = 'BEACH',
  MOUNTAIN = 'MOUNTAIN',
  PARK = 'PARK',
  MARKET = 'MARKET',
  OTHER = 'OTHER',
}

export type DestinationTypeType = `${DestinationType}`;

/**
 * نوع النشاط
 */
export enum ActivityType {
  TOUR = 'TOUR',
  EXPERIENCE = 'EXPERIENCE',
  WORKSHOP = 'WORKSHOP',
  ADVENTURE = 'ADVENTURE',
  CULTURAL = 'CULTURAL',
  RELAXATION = 'RELAXATION',
  FOOD_TOUR = 'FOOD_TOUR',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  WATER_SPORT = 'WATER_SPORT',
  OTHER = 'OTHER',
}

export type ActivityTypeType = `${ActivityType}`;

/**
 * نوع الجولة
 */
export enum TourType {
  CITY_TOUR = 'CITY_TOUR',
  DAY_TRIP = 'DAY_TRIP',
  MULTI_DAY = 'MULTI_DAY',
  ADVENTURE = 'ADVENTURE',
  CULTURAL = 'CULTURAL',
  RELIGIOUS = 'RELIGIOUS',
  FOOD_TOUR = 'FOOD_TOUR',
  NATURE = 'NATURE',
  CUSTOM = 'CUSTOM',
}

export type TourTypeType = `${TourType}`;

// ============================================
// Escrow Enums
// ============================================

/**
 * حالة الضمان
 */
export enum EscrowStatus {
  PENDING = 'PENDING',
  FUNDED = 'FUNDED',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export type EscrowStatusType = `${EscrowStatus}`;

/**
 * نوع معاملة الضمان
 */
export enum EscrowTransactionType {
  FUND = 'FUND',
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  FEE = 'FEE',
}

export type EscrowTransactionTypeType = `${EscrowTransactionType}`;

// ============================================
// Review Enums
// ============================================

/**
 * حالة المراجعة
 */
export enum ReviewStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  REJECTED = 'REJECTED',
}

export type ReviewStatusType = `${ReviewStatus}`;

/**
 * نوع المراجعة
 */
export enum ReviewType {
  SERVICE = 'SERVICE',
  ACTIVITY = 'ACTIVITY',
  DESTINATION = 'DESTINATION',
  PRODUCT = 'PRODUCT',
  COMPANY = 'COMPANY',
}

export type ReviewTypeType = `${ReviewType}`;

/**
 * مستوى المراجع
 */
export enum ReviewerLevel {
  NEW_REVIEWER = 'NEW_REVIEWER',
  ACTIVE_REVIEWER = 'ACTIVE_REVIEWER',
  EXPERT_REVIEWER = 'EXPERT_REVIEWER',
  TRUSTED_REVIEWER = 'TRUSTED_REVIEWER',
}

export type ReviewerLevelType = `${ReviewerLevel}`;

/**
 * مصدر المراجعة
 */
export enum ReviewSource {
  BOOKING = 'BOOKING',
  COMMUNITY = 'COMMUNITY',
  MARKETPLACE = 'MARKETPLACE',
  DIRECT = 'DIRECT',
}

export type ReviewSourceType = `${ReviewSource}`;

/**
 * مرحلة السفر
 */
export enum TravelPhase {
  BEFORE = 'BEFORE',
  DURING = 'DURING',
  AFTER = 'AFTER',
}

export type TravelPhaseType = `${TravelPhase}`;

// ============================================
// Dispute Enums
// ============================================

/**
 * نوع النزاع
 */
export enum DisputeType {
  BOOKING_ISSUE = 'BOOKING_ISSUE',
  PRODUCT_ISSUE = 'PRODUCT_ISSUE',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  SERVICE_QUALITY = 'SERVICE_QUALITY',
  CANCELLATION = 'CANCELLATION',
  REFUND_REQUEST = 'REFUND_REQUEST',
  OTHER = 'OTHER',
}

export type DisputeTypeType = `${DisputeType}`;

/**
 * حالة النزاع
 */
export enum DisputeStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export type DisputeStatusType = `${DisputeStatus}`;

/**
 * قرار النزاع
 */
export enum DisputeDecision {
  BUYER_FAVOR = 'BUYER_FAVOR',
  PROVIDER_FAVOR = 'PROVIDER_FAVOR',
  SPLIT = 'SPLIT',
  NO_ACTION = 'NO_ACTION',
}

export type DisputeDecisionType = `${DisputeDecision}`;

// ============================================
// Product Enums
// ============================================

/**
 * حالة المنتج
 */
export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

export type ProductStatusType = `${ProductStatus}`;

// ============================================
// Community Enums
// ============================================

/**
 * فئة الموضوع
 */
export enum TopicCategory {
  GENERAL = 'GENERAL',
  TRAVEL_TIPS = 'TRAVEL_TIPS',
  REVIEWS = 'REVIEWS',
  QUESTIONS = 'QUESTIONS',
  ANNOUNCEMENTS = 'ANNOUNCEMENTS',
}

export type TopicCategoryType = `${TopicCategory}`;

// ============================================
// Helper Functions
// ============================================

/**
 * الحصول على جميع قيم الـ enum
 */
export function getEnumValues<T extends Record<string, string>>(enumObj: T): T[keyof T][] {
  return Object.values(enumObj) as T[keyof T][];
}

/**
 * التحقق من أن القيمة موجودة في الـ enum
 */
export function isValidEnumValue<T extends Record<string, string>>(
  enumObj: T,
  value: string
): value is T[keyof T] {
  return Object.values(enumObj).includes(value as T[keyof T]);
}

/**
 * الحصول على مفتاح الـ enum من القيمة
 */
export function getEnumKey<T extends Record<string, string>>(
  enumObj: T,
  value: string
): keyof T | null {
  const entry = Object.entries(enumObj).find(([, v]) => v === value);
  return entry ? (entry[0] as keyof T) : null;
}

/**
 * تحويل enum إلى خيارات للـ select
 */
export function enumToOptions<T extends Record<string, string>>(
  enumObj: T,
  labels?: Partial<Record<T[keyof T], string>>
): Array<{ value: T[keyof T]; label: string }> {
  return Object.values(enumObj).map((value) => ({
    value,
    label: labels?.[value] ?? value,
  }));
}
