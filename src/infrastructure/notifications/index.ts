/**
 * Notifications Infrastructure
 * البنية التحتية للإشعارات
 *
 * 🏛️ Constitutional Compliance:
 * - المادة VI: إشعارات للمستخدمين
 * - Push + In-App notifications
 */

// OneSignal
export {
  isOneSignalAvailable,
  sendPushNotification,
  sendBroadcastNotification,
  sendSegmentNotification,
  registerDevice,
  notificationTemplates,
  type PushNotificationOptions,
  type PushNotificationResult,
} from './onesignal-client';

// ============================================
// Unified Notification Service
// ============================================

import {
  sendPushNotification,
  type PushNotificationResult,
} from './onesignal-client';
import {
  queueNotification,
  isBullMQAvailable,
} from '../queue';

/**
 * Notification types
 */
export type NotificationType =
  | 'booking.confirmed'
  | 'booking.reminder'
  | 'booking.cancelled'
  | 'escrow.funded'
  | 'escrow.released'
  | 'escrow.refunded'
  | 'review.request'
  | 'dispute.opened'
  | 'dispute.resolved'
  | 'message.new';

/**
 * Notification payload
 */
export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Send notification (unified)
 * يرسل إشعار Push ويضيفه للـ Queue
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<PushNotificationResult> {
  // Queue for background processing
  if (isBullMQAvailable()) {
    await queueNotification(
      payload.userId,
      payload.title,
      payload.body,
      { ...payload.data, type: payload.type }
    );
  }

  // Send push notification immediately
  return sendPushNotification({
    userId: payload.userId,
    title: payload.title,
    body: payload.body,
    data: payload.data,
  });
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Notify booking confirmed
 */
export async function notifyBookingConfirmed(
  userId: string,
  serviceName: string,
  bookingId: string
): Promise<PushNotificationResult> {
  return sendNotification({
    userId,
    type: 'booking.confirmed',
    title: 'تم تأكيد الحجز ✅',
    body: `تم تأكيد حجزك في ${serviceName}`,
    data: { bookingId },
  });
}

/**
 * Notify escrow released
 */
export async function notifyEscrowReleased(
  userId: string,
  amount: string,
  escrowId: string
): Promise<PushNotificationResult> {
  return sendNotification({
    userId,
    type: 'escrow.released',
    title: 'تم إطلاق المبلغ 💰',
    body: `تم إطلاق ${amount} لحسابك`,
    data: { escrowId },
  });
}

/**
 * Notify review request
 */
export async function notifyReviewRequest(
  userId: string,
  serviceName: string,
  bookingId: string
): Promise<PushNotificationResult> {
  return sendNotification({
    userId,
    type: 'review.request',
    title: 'شاركنا رأيك ⭐',
    body: `كيف كانت تجربتك في ${serviceName}؟`,
    data: { bookingId },
  });
}

/**
 * Notify dispute update
 */
export async function notifyDisputeUpdate(
  userId: string,
  status: string,
  disputeId: string
): Promise<PushNotificationResult> {
  return sendNotification({
    userId,
    type: 'dispute.resolved',
    title: 'تحديث النزاع ⚖️',
    body: `تم تحديث حالة النزاع: ${status}`,
    data: { disputeId },
  });
}

/**
 * Notify new message
 */
export async function notifyNewMessage(
  userId: string,
  senderName: string,
  conversationId: string
): Promise<PushNotificationResult> {
  return sendNotification({
    userId,
    type: 'message.new',
    title: 'رسالة جديدة 💬',
    body: `${senderName} أرسل لك رسالة`,
    data: { conversationId },
  });
}
