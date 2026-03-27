/**
 * OneSignal Push Notification Client
 * عميل إشعارات Push باستخدام OneSignal
 *
 * 🏛️ Constitutional Compliance:
 * - المادة VI: إشعارات للمستخدمين
 * - دعم Web + Mobile Push
 */

// ============================================
// Types
// ============================================

export interface PushNotificationOptions {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
}

export interface PushNotificationResult {
  success: boolean;
  id?: string;
  recipients?: number;
  error?: string;
}

export interface OneSignalConfig {
  appId: string;
  apiKey: string;
}

// ============================================
// OneSignal Client
// ============================================

const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1';

/**
 * Get OneSignal configuration
 */
function getOneSignalConfig(): OneSignalConfig {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;

  if (!appId || !apiKey) {
    throw new Error('ONESIGNAL_APP_ID and ONESIGNAL_API_KEY are required');
  }

  return { appId, apiKey };
}

/**
 * Check if OneSignal is available
 */
export function isOneSignalAvailable(): boolean {
  return !!(process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY);
}

// ============================================
// Push Notification Functions
// ============================================

/**
 * Send push notification to specific user
 */
export async function sendPushNotification(
  options: PushNotificationOptions
): Promise<PushNotificationResult> {
  try {
    if (!isOneSignalAvailable()) {
      console.warn('[OneSignal] Not configured, skipping push notification');
      return { success: false, error: 'OneSignal not configured' };
    }

    const config = getOneSignalConfig();

    const response = await fetch(`${ONESIGNAL_API_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${config.apiKey}`,
      },
      body: JSON.stringify({
        app_id: config.appId,
        include_external_user_ids: [options.userId],
        headings: { en: options.title, ar: options.title },
        contents: { en: options.body, ar: options.body },
        data: options.data || {},
        big_picture: options.imageUrl,
        chrome_web_image: options.imageUrl,
        ios_attachments: options.imageUrl ? { id: options.imageUrl } : undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: (result as { errors?: string[] }).errors?.[0] || 'Failed to send notification',
      };
    }

    return {
      success: true,
      id: (result as { id?: string }).id,
      recipients: (result as { recipients?: number }).recipients,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send push notification to all subscribers
 */
export async function sendBroadcastNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<PushNotificationResult> {
  try {
    if (!isOneSignalAvailable()) {
      return { success: false, error: 'OneSignal not configured' };
    }

    const config = getOneSignalConfig();

    const response = await fetch(`${ONESIGNAL_API_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${config.apiKey}`,
      },
      body: JSON.stringify({
        app_id: config.appId,
        included_segments: ['All'],
        headings: { en: title, ar: title },
        contents: { en: body, ar: body },
        data: data || {},
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: (result as { errors?: string[] }).errors?.[0] || 'Failed to send broadcast',
      };
    }

    return {
      success: true,
      id: (result as { id?: string }).id,
      recipients: (result as { recipients?: number }).recipients,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send push notification to specific segment
 */
export async function sendSegmentNotification(
  segment: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<PushNotificationResult> {
  try {
    if (!isOneSignalAvailable()) {
      return { success: false, error: 'OneSignal not configured' };
    }

    const config = getOneSignalConfig();

    const response = await fetch(`${ONESIGNAL_API_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${config.apiKey}`,
      },
      body: JSON.stringify({
        app_id: config.appId,
        included_segments: [segment],
        headings: { en: title, ar: title },
        contents: { en: body, ar: body },
        data: data || {},
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: (result as { errors?: string[] }).errors?.[0] || 'Failed to send segment notification',
      };
    }

    return {
      success: true,
      id: (result as { id?: string }).id,
      recipients: (result as { recipients?: number }).recipients,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Device Management
// ============================================

/**
 * Register device token for user
 */
export async function registerDevice(
  userId: string,
  deviceToken: string,
  platform: 'ios' | 'android' | 'web'
): Promise<{ success: boolean; playerId?: string; error?: string }> {
  try {
    if (!isOneSignalAvailable()) {
      return { success: false, error: 'OneSignal not configured' };
    }

    const config = getOneSignalConfig();

    const response = await fetch(`${ONESIGNAL_API_URL}/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${config.apiKey}`,
      },
      body: JSON.stringify({
        app_id: config.appId,
        identifier: deviceToken,
        device_type: platform === 'ios' ? 0 : platform === 'android' ? 1 : 2,
        external_user_id: userId,
        language: 'ar',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: (result as { errors?: string[] }).errors?.[0] || 'Failed to register device',
      };
    }

    return {
      success: true,
      playerId: (result as { id?: string }).id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Notification Templates
// ============================================

/**
 * Common notification templates
 */
export const notificationTemplates = {
  bookingConfirmed: (serviceName: string) => ({
    title: 'تم تأكيد الحجز ✅',
    body: `تم تأكيد حجزك في ${serviceName}`,
    data: { type: 'booking', action: 'confirmed' },
  }),

  bookingReminder: (serviceName: string, time: string) => ({
    title: 'تذكير بالحجز 📅',
    body: `حجزك في ${serviceName} غداً الساعة ${time}`,
    data: { type: 'booking', action: 'reminder' },
  }),

  reviewRequest: (serviceName: string) => ({
    title: 'شاركنا رأيك ⭐',
    body: `كيف كانت تجربتك في ${serviceName}؟`,
    data: { type: 'review', action: 'request' },
  }),

  escrowReleased: (amount: string) => ({
    title: 'تم إطلاق المبلغ 💰',
    body: `تم إطلاق ${amount} لحسابك`,
    data: { type: 'escrow', action: 'released' },
  }),

  newMessage: (senderName: string) => ({
    title: 'رسالة جديدة 💬',
    body: `${senderName} أرسل لك رسالة`,
    data: { type: 'message', action: 'new' },
  }),

  disputeUpdate: (status: string) => ({
    title: 'تحديث النزاع ⚖️',
    body: `تم تحديث حالة النزاع: ${status}`,
    data: { type: 'dispute', action: 'update' },
  }),
};
