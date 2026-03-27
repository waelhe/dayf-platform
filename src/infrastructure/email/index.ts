/**
 * Email Infrastructure
 * البنية التحتية للبريد الإلكتروني
 *
 * 🏛️ Constitutional Compliance:
 * - المادة VI: OTP verification
 * - معالجة غير متزامنة
 */

// Client
export {
  getResendClient,
  isResendAvailable,
  sendEmail,
  getEmailTemplate,
  registerEmailTemplate,
  listEmailTemplates,
  type EmailOptions,
  type EmailResult,
  type EmailTemplate,
} from './resend-client';

// ============================================
// Convenience Functions
// ============================================

import { sendEmail, type EmailResult } from './resend-client';

/**
 * Send OTP email
 */
export async function sendOTPEmail(
  to: string,
  code: string
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'رمز التحقق',
    template: 'otp',
    data: { code },
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `مرحباً ${name} في منصة ضيف!`,
    template: 'welcome',
    data: { name },
  });
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  to: string,
  data: {
    bookingId: string;
    serviceName: string;
    checkIn: string;
    checkOut: string;
    totalPrice: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `تأكيد الحجز #${data.bookingId}`,
    template: 'booking-confirmed',
    data,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'إعادة تعيين كلمة المرور',
    template: 'password-reset',
    data: { resetUrl },
  });
}

/**
 * Send review request email
 */
export async function sendReviewRequestEmail(
  to: string,
  data: {
    serviceName: string;
    reviewUrl: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `شاركنا رأيك عن ${data.serviceName}`,
    template: 'review-request',
    data,
  });
}
