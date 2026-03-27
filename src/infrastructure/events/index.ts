/**
 * Events Infrastructure
 * البنية التحتية للأحداث
 *
 * 🏛️ Constitutional Compliance:
 * - المادة V: الاستقلالية بين الوحدات عبر الأحداث فقط
 * - Wildcard support
 * - Distributed via BullMQ
 */

// Event Bus
export {
  publish,
  subscribe,
  once,
  subscribeWildcard,
  unsubscribeAll,
  getListenerCount,
  safeHandler,
  publishAsync,
  setDebugMode,
  getEventLog,
  clearEventLog,
  EVENTS,
  eventBus,
  EventEmitter2,
  type EventPayload,
  type EventLog,
  type EventHandler,
} from './event-bus';

// ============================================
// Event Listeners Setup
// ============================================

import { subscribe, EVENTS } from './event-bus';
import {
  sendPushNotification,
  notifyBookingConfirmed,
  notifyEscrowReleased,
  notifyReviewRequest,
} from '../notifications';
import {
  queueEmail,
  queueNotification,
} from '../queue';

/**
 * Setup all event listeners
 * إعداد جميع مستمعي الأحداث
 */
export function setupEventListeners(): void {
  console.log('[EventBus] Setting up event listeners...');

  // ============================================
  // Booking Events
  // ============================================

  // Booking created → Create Escrow (handled in service)
  subscribe(EVENTS.BOOKING_CREATED, async (data) => {
    console.log('[EventBus] Booking created:', data);
    // Stats update, etc.
  });

  // Booking confirmed → Send notification
  subscribe(EVENTS.BOOKING_CONFIRMED, async (data) => {
    console.log('[EventBus] Booking confirmed:', data);
    
    // Send push notification
    await queueNotification(
      (data as { guestId: string }).guestId,
      'تم تأكيد الحجز ✅',
      'تم تأكيد حجزك بنجاح'
    );
  });

  // Booking completed → Request review
  subscribe(EVENTS.BOOKING_COMPLETED, async (data) => {
    console.log('[EventBus] Booking completed:', data);
    
    const payload = data as {
      bookingId: string;
      guestId: string;
      hostId: string;
      serviceId: string;
      totalPrice: number;
    };

    // Request review from guest
    await queueNotification(
      payload.guestId,
      'شاركنا رأيك ⭐',
      'كيف كانت تجربتك؟ شاركنا مراجعتك'
    );

    // Notify host of completion
    await queueNotification(
      payload.hostId,
      'اكتمل الحجز ✅',
      'تم إكمال الحجز بنجاح'
    );
  });

  // Booking cancelled → Refund Escrow
  subscribe(EVENTS.BOOKING_CANCELLED, async (data) => {
    console.log('[EventBus] Booking cancelled:', data);
    // Handle refund logic
  });

  // ============================================
  // Escrow Events
  // ============================================

  // Escrow funded → Notify provider
  subscribe(EVENTS.ESCROW_FUNDED, async (data) => {
    console.log('[EventBus] Escrow funded:', data);
    
    const payload = data as {
      escrowId: string;
      buyerId: string;
      providerId: string;
      amount: number;
    };

    await queueNotification(
      payload.providerId,
      'تم استلام الدفعة 💰',
      `تم استلام ${payload.amount} في حساب الضمان`
    );
  });

  // Escrow released → Notify both parties
  subscribe(EVENTS.ESCROW_RELEASED, async (data) => {
    console.log('[EventBus] Escrow released:', data);
    
    const payload = data as {
      escrowId: string;
      buyerId: string;
      providerId: string;
      amount: number;
    };

    // Notify provider
    await queueNotification(
      payload.providerId,
      'تم إطلاق المبلغ 💰',
      `تم إطلاق ${payload.amount} لحسابك`
    );

    // Notify buyer
    await queueNotification(
      payload.buyerId,
      'تم إطلاق المبلغ 💰',
      'تم إطلاق المبلغ للمزود'
    );
  });

  // Escrow refunded → Notify buyer
  subscribe(EVENTS.ESCROW_REFUNDED, async (data) => {
    console.log('[EventBus] Escrow refunded:', data);
    
    const payload = data as {
      escrowId: string;
      buyerId: string;
      amount: number;
    };

    await queueNotification(
      payload.buyerId,
      'تم استرداد المبلغ 💸',
      `تم استرداد ${payload.amount} لحسابك`
    );
  });

  // ============================================
  // Review Events
  // ============================================

  // Review created → Update stats
  subscribe(EVENTS.REVIEW_CREATED, async (data) => {
    console.log('[EventBus] Review created:', data);
    // Update service/company rating
  });

  // ============================================
  // Dispute Events
  // ============================================

  // Dispute created → Notify admin
  subscribe(EVENTS.DISPUTE_CREATED, async (data) => {
    console.log('[EventBus] Dispute created:', data);
    // Notify admins
  });

  // Dispute resolved → Notify parties
  subscribe(EVENTS.DISPUTE_RESOLVED, async (data) => {
    console.log('[EventBus] Dispute resolved:', data);
    
    const payload = data as {
      disputeId: string;
      openedBy: string;
      againstUser: string;
      decision: string;
    };

    // Notify both parties
    await queueNotification(
      payload.openedBy,
      'تم حل النزاع ⚖️',
      `تم حل النزاع: ${payload.decision}`
    );

    await queueNotification(
      payload.againstUser,
      'تم حل النزاع ⚖️',
      `تم حل النزاع: ${payload.decision}`
    );
  });

  // ============================================
  // User Events
  // ============================================

  // User registered → Send welcome email
  subscribe(EVENTS.USER_REGISTERED, async (data) => {
    console.log('[EventBus] User registered:', data);
    
    const payload = data as {
      userId: string;
      email: string;
      displayName: string;
    };

    await queueEmail(
      payload.email,
      'مرحباً بك في منصة ضيف!',
      'welcome',
      { name: payload.displayName }
    );
  });

  console.log('[EventBus] Event listeners setup complete');
}

/**
 * Teardown event listeners
 */
export function teardownEventListeners(): void {
  console.log('[EventBus] Tearing down event listeners...');
  unsubscribeAll();
  console.log('[EventBus] Event listeners removed');
}
