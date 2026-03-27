/**
 * Core Types - التصدير الموحد للأنواع
 *
 * هذا الملف يجمع كل الأنواع الأساسية في مكان واحد.
 * استخدم: `import { ... } from '@/core/types'`
 *
 * @example
 * ```typescript
 * // استيراد الأنواع
 * import type { Booking, Service, Profile } from '@/core/types';
 *
 * // استيراد الـ enums
 * import { BookingStatus, Role, CompanyType } from '@/core/types';
 *
 * // استيراد دوال المساعدة
 * import { toJson, paginatedToJson, isBooking } from '@/core/types';
 * ```
 */

// ============================================
// Base Types
// ============================================
export type {
  BaseEntity,
  ID,
  JsonEntity,
  PaginatedResult,
  PaginationOptions,
  PaginationQuery,
  SearchQuery,
  FilterQuery,
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
  OperationResult,
  CreateResult,
  UpdateResult,
  DeleteResult,
  DatabaseRow,
  NullToUndefined,
  Optional,
  ValueOf,
  KeyOf,
  Timestamp,
  UUID,
  Email,
  Phone,
  Slug,
} from './base';

export {
  isBaseEntity,
  hasDeletedAt,
  toJson,
  toJsonArray,
  fromJson,
  paginatedToJson,
} from './base';

// ============================================
// Enums
// ============================================
export {
  // User Enums
  Role,
  UserStatus,
  Gender,
  MembershipLevel,
  OAuthProvider,
  OTPType,
  VerificationType,
  VerificationStatus,

  // Booking Enums
  BookingStatus,
  OrderStatus,

  // Company Enums
  CompanyType,
  CompanyStatus,
  EmployeeRole,
  InvitationStatus,

  // Service Enums
  ServiceCategory,
  ServiceStatus,

  // Destination & Activity Enums
  DestinationType,
  ActivityType,
  TourType,

  // Escrow Enums
  EscrowStatus,
  EscrowTransactionType,

  // Review Enums
  ReviewStatus,
  ReviewType,
  ReviewerLevel,
  ReviewSource,
  TravelPhase,

  // Dispute Enums
  DisputeType,
  DisputeStatus,
  DisputeDecision,

  // Product Enums
  ProductStatus,

  // Community Enums
  TopicCategory,

  // Helper Functions
  getEnumValues,
  isValidEnumValue,
  getEnumKey,
  enumToOptions,
} from './enums';

// Export enum types
export type {
  RoleType,
  UserStatusType,
  GenderType,
  MembershipLevelType,
  OAuthProviderType,
  OTPTypeType,
  VerificationTypeType,
  VerificationStatusType,
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
  TourTypeType,
  EscrowStatusType,
  EscrowTransactionTypeType,
  ReviewStatusType,
  ReviewTypeType,
  ReviewerLevelType,
  ReviewSourceType,
  TravelPhaseType,
  DisputeTypeType,
  DisputeStatusType,
  DisputeDecisionType,
  ProductStatusType,
  TopicCategoryType,
} from './enums';

// ============================================
// Entity Types
// ============================================
export type {
  // User & Auth
  Profile,
  Session,
  OTPCode,

  // Company
  Company,
  Employee,
  Invitation,

  // Service
  Service,

  // Booking
  Booking,

  // Escrow
  Escrow,
  EscrowTransaction,

  // Review
  Review,
  ReviewPhoto,
  ReviewReply,
  ReviewHelpful,
  ReviewerProfile,

  // Dispute
  Dispute,
  DisputeMessage,

  // Destination & Activity
  Destination,
  Activity,

  // Marketplace
  Product,
  Cart,
  CartItem,
  WishlistItem,

  // Community
  Topic,
  CommunityReply,

  // Order
  Order,
  OrderItem,
} from './entities';

export {
  isProfile,
  isService,
  isBooking,
} from './entities';

// ============================================
// API Types
// ============================================
export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  ApiPaginatedResponse,
  ApiEmptyResponse,
  ApiContext,
  ApiHandlerOptions,
} from './api';

export {
  success,
  error,
  paginated,
  empty,
  isSuccessResponse,
  isErrorResponse,
  isPaginatedResponse,
  ErrorCodes,
} from './api';

export type { ErrorCode } from './api';
