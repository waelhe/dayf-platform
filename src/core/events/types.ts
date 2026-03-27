/**
 * Event Types - أنواع الأحداث المركزية
 * 
 * يحدد جميع الأحداث التي يستخدمها النظام
 * يتبع نمط التسمية: entity.action
 */

// ============================================
// Event Names Constants
// ============================================

/**
 * أسماء الأحداث المستخدمة في النظام
 * 
 * التسمية تتبع النمط: entity.action
 * مثال: booking.created, escrow.funded
 */
export const EVENTS = {
  // ============================================
  // Booking Events - أحداث الحجوزات
  // ============================================
  BOOKING_CREATED: 'booking.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_COMPLETED: 'booking.completed',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_MODIFIED: 'booking.modified',

  // ============================================
  // Escrow Events - أحداث الضمان المالي
  // ============================================
  ESCROW_CREATED: 'escrow.created',
  ESCROW_FUNDED: 'escrow.funded',
  ESCROW_RELEASED: 'escrow.released',
  ESCROW_REFUNDED: 'escrow.refunded',
  ESCROW_DISPUTED: 'escrow.disputed',
  ESCROW_CANCELLED: 'escrow.cancelled',

  // ============================================
  // Review Events - أحداث المراجعات
  // ============================================
  REVIEW_CREATED: 'review.created',
  REVIEW_UPDATED: 'review.updated',
  REVIEW_DELETED: 'review.deleted',
  REVIEW_HELPFUL_VOTED: 'review.helpful_voted',
  REPLY_CREATED: 'reply.created',

  // ============================================
  // Dispute Events - أحداث النزاعات
  // ============================================
  DISPUTE_CREATED: 'dispute.created',
  DISPUTE_MESSAGE_ADDED: 'dispute.message_added',
  DISPUTE_ESCALATED: 'dispute.escalated',
  DISPUTE_RESOLVED: 'dispute.resolved',
  DISPUTE_CLOSED: 'dispute.closed',

  // ============================================
  // User Events - أحداث المستخدمين
  // ============================================
  USER_REGISTERED: 'user.registered',
  USER_VERIFIED: 'user.verified',
  USER_PROFILE_UPDATED: 'user.profile_updated',
  USER_SUSPENDED: 'user.suspended',

  // ============================================
  // Company Events - أحداث الشركات
  // ============================================
  COMPANY_REGISTERED: 'company.registered',
  COMPANY_VERIFIED: 'company.verified',
  COMPANY_SUSPENDED: 'company.suspended',
  EMPLOYEE_INVITED: 'employee.invited',
  EMPLOYEE_JOINED: 'employee.joined',

  // ============================================
  // Service Events - أحداث الخدمات
  // ============================================
  SERVICE_CREATED: 'service.created',
  SERVICE_UPDATED: 'service.updated',
  SERVICE_PUBLISHED: 'service.published',
  SERVICE_UNPUBLISHED: 'service.unpublished',

  // ============================================
  // Order Events - أحداث الطلبات
  // ============================================
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',

  // ============================================
  // Community Events - أحداث المجتمع
  // ============================================
  TOPIC_CREATED: 'topic.created',
  TOPIC_LIKED: 'topic.liked',
  REPLY_POSTED: 'reply.posted',

} as const;

// ============================================
// Event Payload Types
// ============================================

/**
 * حمولة حدث إنشاء الحجز
 */
export interface BookingCreatedPayload {
  bookingId: string;
  guestId: string;
  hostId: string;
  serviceId: string;
  escrowId: string;
  totalPrice: number;
  checkIn: string;
  checkOut: string;
}

/**
 * حمولة حدث اكتمال الحجز
 */
export interface BookingCompletedPayload {
  bookingId: string;
  guestId: string;
  hostId: string;
  serviceId: string;
  totalPrice: number;
  completedAt: Date;
}

/**
 * حمولة حدث تأكيد الحجز
 */
export interface BookingConfirmedPayload {
  bookingId: string;
  guestId: string;
  hostId: string;
  confirmedAt: Date;
}

/**
 * حمولة حدث إلغاء الحجز
 */
export interface BookingCancelledPayload {
  bookingId: string;
  guestId: string;
  hostId: string;
  cancelledBy: string;
  reason?: string;
}

/**
 * حمولة حدث إنشاء الضمان
 */
export interface EscrowCreatedPayload {
  escrowId: string;
  bookingId?: string;
  orderId?: string;
  buyerId: string;
  providerId: string;
  amount: number;
  currency: string;
}

/**
 * حمولة حدث تمويل الضمان
 */
export interface EscrowFundedPayload {
  escrowId: string;
  buyerId: string;
  amount: number;
  fundedAt: Date;
}

/**
 * حمولة حدث إطلاق الضمان
 */
export interface EscrowReleasedPayload {
  escrowId: string;
  providerId: string;
  amount: number;
  releasedAt: Date;
}

/**
 * حمولة حدث إنشاء المراجعة
 */
export interface ReviewCreatedPayload {
  reviewId: string;
  authorId: string;
  referenceType: 'service' | 'product' | 'destination' | 'activity';
  referenceId: string;
  rating: number;
  bookingId?: string;
}

/**
 * حمولة حدث حل النزاع
 */
export interface DisputeResolvedPayload {
  disputeId: string;
  escrowId: string;
  openedBy: string;
  againstUser: string;
  decision: 'buyer_favor' | 'provider_favor' | 'split';
  amount: number;
}

/**
 * حمولة حدث تسجيل المستخدم
 */
export interface UserRegisteredPayload {
  userId: string;
  email: string;
  role: string;
  registeredAt: Date;
}

// ============================================
// Event Map Type (for type safety)
// ============================================

/**
 * خريطة الأحداث وأنواع الحمولات
 * تُستخدم للتحقق من أنواع الأحداث
 */
export interface EventMap {
  [EVENTS.BOOKING_CREATED]: BookingCreatedPayload;
  [EVENTS.BOOKING_CONFIRMED]: BookingConfirmedPayload;
  [EVENTS.BOOKING_COMPLETED]: BookingCompletedPayload;
  [EVENTS.BOOKING_CANCELLED]: BookingCancelledPayload;
  [EVENTS.ESCROW_CREATED]: EscrowCreatedPayload;
  [EVENTS.ESCROW_FUNDED]: EscrowFundedPayload;
  [EVENTS.ESCROW_RELEASED]: EscrowReleasedPayload;
  [EVENTS.REVIEW_CREATED]: ReviewCreatedPayload;
  [EVENTS.DISPUTE_RESOLVED]: DisputeResolvedPayload;
  [EVENTS.USER_REGISTERED]: UserRegisteredPayload;
}

// ============================================
// Type-safe publish function
// ============================================

/**
 * دالة نشر آمنة الأنواع
 * 
 * Note: استيراد eventBus داخل الدالة لتجنب الـ circular dependency
 */
export async function publishEvent<K extends keyof EventMap>(
  event: K,
  payload: EventMap[K]
): Promise<void> {
  // Dynamic import لتجنب circular dependency
  const { eventBus } = await import('./index.js');
  return eventBus.publish(event, payload);
}
