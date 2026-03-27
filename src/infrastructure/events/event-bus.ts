/**
 * Event Bus - EventEmitter2 Integration
 * ناقل الأحداث باستخدام EventEmitter2
 *
 * 🏛️ Constitutional Compliance:
 * - المادة V: الاستقلالية بين الوحدات عبر الأحداث فقط
 * - لا استدعاء مباشر بين modules
 *
 * Features:
 * - Wildcard support (user.*)
 * - Namespaces
 * - Async event handling
 * - Event logging
 * - Integration with BullMQ for distributed events
 */

import EventEmitter2 from 'eventemitter2';

// ============================================
// Types
// ============================================

export interface EventPayload {
  timestamp: Date;
  source: string;
  data: unknown;
}

export interface EventLog {
  event: string;
  payload: EventPayload;
  timestamp: Date;
  listenersCount: number;
}

export type EventHandler<T = unknown> = (payload: T) => Promise<void> | void;

// ============================================
// Event Bus Implementation
// ============================================

/**
 * Create event bus with EventEmitter2
 */
const eventBus = new EventEmitter2.EventEmitter2({
  wildcard: true,
  delimiter: '.',
  newListener: false,
  removeListener: false,
  maxListeners: 100,
  verboseMemoryLeak: true,
  ignoreErrors: false,
});

// ============================================
// Event Logging
// ============================================

let eventLog: EventLog[] = [];
let debugMode = false;

/**
 * Enable/disable debug mode
 */
export function setDebugMode(enabled: boolean): void {
  debugMode = enabled;
}

/**
 * Get event log
 */
export function getEventLog(): EventLog[] {
  return [...eventLog];
}

/**
 * Clear event log
 */
export function clearEventLog(): void {
  eventLog = [];
}

// ============================================
// Core Functions
// ============================================

/**
 * Publish event
 * نشر حدث
 */
export async function publish<T>(
  event: string,
  data: T,
  source: string = 'unknown'
): Promise<void> {
  const payload: EventPayload = {
    timestamp: new Date(),
    source,
    data,
  };

  // Log event
  if (debugMode) {
    const listenersCount = eventBus.listenerCount(event);
    eventLog.push({
      event,
      payload,
      timestamp: new Date(),
      listenersCount,
    });
    console.log(`[EventBus] Publishing: ${event} to ${listenersCount} listeners`);
  }

  // Emit event (async)
  eventBus.emitAsync(event, payload);
}

/**
 * Subscribe to event
 * الاشتراك في حدث
 */
export function subscribe<T>(
  event: string,
  handler: EventHandler<T>
): () => void {
  eventBus.on(event, async (payload: EventPayload) => {
    try {
      await handler(payload.data as T);
    } catch (error) {
      console.error(`[EventBus] Handler for "${event}" failed:`, error);
    }
  });

  if (debugMode) {
    console.log(`[EventBus] Subscribed to: ${event}`);
  }

  // Return unsubscribe function
  return () => {
    eventBus.off(event, handler as never);
    if (debugMode) {
      console.log(`[EventBus] Unsubscribed from: ${event}`);
    }
  };
}

/**
 * Subscribe to event once
 * الاشتراك في حدث مرة واحدة
 */
export function once<T>(
  event: string,
  handler: EventHandler<T>
): void {
  eventBus.once(event, async (payload: EventPayload) => {
    try {
      await handler(payload.data as T);
    } catch (error) {
      console.error(`[EventBus] Once handler for "${event}" failed:`, error);
    }
  });
}

/**
 * Subscribe to wildcard events
 * الاشتراك في أحداث متعددة (user.*)
 */
export function subscribeWildcard<T>(
  pattern: string,
  handler: EventHandler<T & { eventName: string }>
): () => void {
  eventBus.on(pattern, async (payload: EventPayload, eventName: string) => {
    try {
      await handler({ ...payload.data as T, eventName });
    } catch (error) {
      console.error(`[EventBus] Wildcard handler for "${eventName}" failed:`, error);
    }
  });

  if (debugMode) {
    console.log(`[EventBus] Subscribed to wildcard: ${pattern}`);
  }

  return () => {
    eventBus.off(pattern, handler as never);
  };
}

/**
 * Unsubscribe all listeners for event
 */
export function unsubscribeAll(event?: string): void {
  if (event) {
    eventBus.removeAllListeners(event);
  } else {
    eventBus.removeAllListeners();
  }
}

/**
 * Get listener count for event
 */
export function getListenerCount(event: string): number {
  return eventBus.listenerCount(event);
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create safe handler (catches errors)
 */
export function safeHandler<T>(
  handler: EventHandler<T>
): EventHandler<T> {
  return async (payload: T) => {
    try {
      await handler(payload);
    } catch (error) {
      console.error('[EventBus] Safe handler caught error:', error);
    }
  };
}

/**
 * Publish async (fire and forget)
 */
export function publishAsync<T>(
  event: string,
  data: T,
  source?: string
): void {
  publish(event, data, source).catch(error => {
    console.error(`[EventBus] Async publish failed for "${event}":`, error);
  });
}

// ============================================
// Event Names Constants
// ============================================

/**
 * Standard event names
 */
export const EVENTS = {
  // Booking Events
  BOOKING_CREATED: 'booking.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_COMPLETED: 'booking.completed',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_MODIFIED: 'booking.modified',

  // Escrow Events
  ESCROW_CREATED: 'escrow.created',
  ESCROW_FUNDED: 'escrow.funded',
  ESCROW_RELEASED: 'escrow.released',
  ESCROW_REFUNDED: 'escrow.refunded',
  ESCROW_DISPUTED: 'escrow.disputed',
  ESCROW_CANCELLED: 'escrow.cancelled',

  // Review Events
  REVIEW_CREATED: 'review.created',
  REVIEW_UPDATED: 'review.updated',
  REVIEW_DELETED: 'review.deleted',
  REVIEW_HELPFUL_VOTED: 'review.helpful_voted',
  REPLY_CREATED: 'reply.created',

  // Dispute Events
  DISPUTE_CREATED: 'dispute.created',
  DISPUTE_MESSAGE_ADDED: 'dispute.message_added',
  DISPUTE_ESCALATED: 'dispute.escalated',
  DISPUTE_RESOLVED: 'dispute.resolved',
  DISPUTE_CLOSED: 'dispute.closed',

  // User Events
  USER_REGISTERED: 'user.registered',
  USER_VERIFIED: 'user.verified',
  USER_PROFILE_UPDATED: 'user.profile_updated',
  USER_SUSPENDED: 'user.suspended',

  // Company Events
  COMPANY_REGISTERED: 'company.registered',
  COMPANY_VERIFIED: 'company.verified',
  COMPANY_SUSPENDED: 'company.suspended',
  EMPLOYEE_INVITED: 'employee.invited',
  EMPLOYEE_JOINED: 'employee.joined',

  // Service Events
  SERVICE_CREATED: 'service.created',
  SERVICE_UPDATED: 'service.updated',
  SERVICE_PUBLISHED: 'service.published',
  SERVICE_UNPUBLISHED: 'service.unpublished',

  // Order Events
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',

  // Community Events
  TOPIC_CREATED: 'topic.created',
  TOPIC_LIKED: 'topic.liked',
  REPLY_POSTED: 'reply.posted',

  // Notification Events
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_READ: 'notification.read',

  // Email Events
  EMAIL_SENT: 'email.sent',
  EMAIL_FAILED: 'email.failed',

} as const;

// ============================================
// Export
// ============================================

export { EventEmitter2 };
export default eventBus;
