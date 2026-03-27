/**
 * Shared Enums for Dayf Platform
 * الأنواع المشتركة لمنصة ضيف
 * 
 * These enums were previously imported from @prisma/client.
 * Now they are defined locally for use with Supabase.
 */

// ============================================
// User Enums
// ============================================

export enum Role {
  GUEST = 'GUEST',
  USER = 'USER',
  HOST = 'HOST',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum MembershipLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
  FACEBOOK = 'FACEBOOK',
}

export enum OTPType {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  VERIFY = 'VERIFY',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

export enum VerificationType {
  IDENTITY = 'IDENTITY',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  ADDRESS = 'ADDRESS',
  BUSINESS = 'BUSINESS',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// ============================================
// Booking Enums
// ============================================

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// ============================================
// Company Enums
// ============================================

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

export enum CompanyStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum EmployeeRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  VIEWER = 'VIEWER',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

// ============================================
// Destination & Activity Enums
// ============================================

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

// ============================================
// Escrow Enums
// ============================================

export enum EscrowStatus {
  PENDING = 'PENDING',
  FUNDED = 'FUNDED',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export enum EscrowTransactionType {
  FUND = 'FUND',
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  FEE = 'FEE',
}

// ============================================
// Review Enums
// ============================================

export enum ReviewStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  REJECTED = 'REJECTED',
}

export enum ReviewType {
  SERVICE = 'SERVICE',
  ACTIVITY = 'ACTIVITY',
  DESTINATION = 'DESTINATION',
  PRODUCT = 'PRODUCT',
  COMPANY = 'COMPANY',
}

export enum ReviewerLevel {
  NEW_REVIEWER = 'NEW_REVIEWER',
  ACTIVE_REVIEWER = 'ACTIVE_REVIEWER',
  EXPERT_REVIEWER = 'EXPERT_REVIEWER',
  TRUSTED_REVIEWER = 'TRUSTED_REVIEWER',
}

export enum ReviewSource {
  BOOKING = 'BOOKING',
  COMMUNITY = 'COMMUNITY',
  MARKETPLACE = 'MARKETPLACE',
  DIRECT = 'DIRECT',
}

export enum TravelPhase {
  BEFORE = 'BEFORE',
  DURING = 'DURING',
  AFTER = 'AFTER',
}

// ============================================
// Dispute Enums
// ============================================

export enum DisputeType {
  BOOKING_ISSUE = 'BOOKING_ISSUE',
  PRODUCT_ISSUE = 'PRODUCT_ISSUE',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  SERVICE_QUALITY = 'SERVICE_QUALITY',
  CANCELLATION = 'CANCELLATION',
  REFUND_REQUEST = 'REFUND_REQUEST',
  OTHER = 'OTHER',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum DisputeDecision {
  BUYER_FAVOR = 'BUYER_FAVOR',
  PROVIDER_FAVOR = 'PROVIDER_FAVOR',
  SPLIT = 'SPLIT',
  NO_ACTION = 'NO_ACTION',
}
