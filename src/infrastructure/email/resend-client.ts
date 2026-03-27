/**
 * Resend Email Client
 * عميل البريد الإلكتروني Resend
 *
 * 🏛️ Constitutional Compliance:
 * - المادة VI: الأمان بالافتراض
 * - OTP emails, password reset, etc.
 */

import Resend from 'resend';
import { ReactNode } from 'react';
import { render } from '@react-email/render';

// ============================================
// Types
// ============================================

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export interface EmailResult {
  id: string;
  success: boolean;
  error?: string;
}

export interface EmailTemplate {
  name: string;
  subject: (data: Record<string, unknown>) => string;
  html: (data: Record<string, unknown>) => string;
  react?: (data: Record<string, unknown>) => ReactNode;
}

// ============================================
// Resend Client
// ============================================

let resendClient: Resend | null = null;

/**
 * Get Resend client
 */
export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required');
    }

    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

/**
 * Check if Resend is available
 */
export function isResendAvailable(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// ============================================
// Email Sending
// ============================================

/**
 * Send email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const client = getResendClient();

    // Get template
    const template = getEmailTemplate(options.template);
    if (!template) {
      throw new Error(`Email template not found: ${options.template}`);
    }

    // Render email content
    const subject = template.subject(options.data);
    const html = template.html(options.data);

    // Send email
    const { data, error } = await client.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@dayf.sy',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: subject || options.subject,
      html,
    });

    if (error) {
      return {
        id: '',
        success: false,
        error: error.message,
      };
    }

    return {
      id: data?.id || '',
      success: true,
    };
  } catch (error) {
    return {
      id: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Email Templates
// ============================================

const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  // OTP Email
  otp: {
    name: 'OTP Verification',
    subject: (data) => `رمز التحقق: ${data.code}`,
    html: (data) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رمز التحقق</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a365d; margin: 0; font-size: 28px;">ضيف</h1>
      <p style="color: #718096; margin: 10px 0 0;">منصة السياحة السورية</p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <p style="color: #2d3748; font-size: 18px; margin-bottom: 20px;">رمز التحقق الخاص بك:</p>
      <div style="background-color: #edf2f7; border-radius: 8px; padding: 20px; display: inline-block;">
        <span style="font-size: 32px; font-weight: bold; color: #1a365d; letter-spacing: 8px;">${data.code}</span>
      </div>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="color: #718096; font-size: 14px; text-align: center;">
        هذا الرمز صالح لمدة 5 دقائق فقط.<br>
        إذا لم تطلب هذا الرمز، يمكنك تجاهل هذا البريد.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #a0aec0; font-size: 12px;">
        © ${new Date().getFullYear()} منصة ضيف. جميع الحقوق محفوظة.
      </p>
    </div>
  </div>
</body>
</html>
    `,
  },

  // Welcome Email
  welcome: {
    name: 'Welcome',
    subject: (data) => `مرحباً ${data.name} في منصة ضيف!`,
    html: (data) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مرحباً بك</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a365d; margin: 0; font-size: 28px;">ضيف</h1>
      <p style="color: #718096; margin: 10px 0 0;">منصة السياحة السورية</p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <h2 style="color: #2d3748; font-size: 24px;">مرحباً ${data.name}! 👋</h2>
      <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
        نرحب بك في منصة ضيف، بوابتك لاكتشاف سوريا الجميلة.
      </p>
    </div>
    
    <div style="background-color: #edf2f7; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #1a365d; margin-top: 0;">ابدأ الآن:</h3>
      <ul style="color: #4a5568;">
        <li>استكشف الوجهات السياحية</li>
        <li>احجز خدماتك المفضلة</li>
        <li>تواصل مع مقدمي الخدمات</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dayf.sy'}" 
         style="display: inline-block; background-color: #1a365d; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
        ابدأ الاستكشاف
      </a>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #a0aec0; font-size: 12px;">
        © ${new Date().getFullYear()} منصة ضيف. جميع الحقوق محفوظة.
      </p>
    </div>
  </div>
</body>
</html>
    `,
  },

  // Booking Confirmed
  'booking-confirmed': {
    name: 'Booking Confirmed',
    subject: (data) => `تأكيد الحجز #${data.bookingId}`,
    html: (data) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد الحجز</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a365d; margin: 0; font-size: 28px;">ضيف</h1>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <h2 style="color: #38a169;">✅ تم تأكيد حجزك!</h2>
      <p style="color: #4a5568; font-size: 16px;">
        رقم الحجز: <strong>${data.bookingId}</strong>
      </p>
    </div>
    
    <div style="background-color: #edf2f7; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #1a365d; margin-top: 0;">تفاصيل الحجز:</h3>
      <p><strong>الخدمة:</strong> ${data.serviceName || 'غير محدد'}</p>
      <p><strong>تاريخ الوصول:</strong> ${data.checkIn || 'غير محدد'}</p>
      <p><strong>تاريخ المغادرة:</strong> ${data.checkOut || 'غير محدد'}</p>
      <p><strong>المجموع:</strong> ${data.totalPrice || 'غير محدد'} ل.س</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dayf.sy'}/bookings" 
         style="display: inline-block; background-color: #1a365d; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
        عرض الحجز
      </a>
    </div>
  </div>
</body>
</html>
    `,
  },

  // Password Reset
  'password-reset': {
    name: 'Password Reset',
    subject: () => 'إعادة تعيين كلمة المرور',
    html: (data) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة تعيين كلمة المرور</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a365d; margin: 0; font-size: 28px;">ضيف</h1>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <h2 style="color: #2d3748;">إعادة تعيين كلمة المرور</h2>
      <p style="color: #4a5568; font-size: 16px;">
        تم طلب إعادة تعيين كلمة المرور لحسابك.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.resetUrl}" 
         style="display: inline-block; background-color: #1a365d; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
        إعادة تعيين كلمة المرور
      </a>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="color: #718096; font-size: 14px; text-align: center;">
        هذا الرابط صالح لمدة ساعة واحدة فقط.<br>
        إذا لم تطلب هذا، يمكنك تجاهل هذا البريد.
      </p>
    </div>
  </div>
</body>
</html>
    `,
  },

  // Review Request
  'review-request': {
    name: 'Review Request',
    subject: (data) => `شاركنا رأيك عن ${data.serviceName}`,
    html: (data) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>شاركنا رأيك</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a365d; margin: 0; font-size: 28px;">ضيف</h1>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <h2 style="color: #2d3748;">كيف كانت تجربتك؟</h2>
      <p style="color: #4a5568; font-size: 16px;">
        نود معرفة رأيك عن ${data.serviceName}
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.reviewUrl}" 
         style="display: inline-block; background-color: #38a169; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
        اكتب مراجعة
      </a>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="color: #718096; font-size: 14px; text-align: center;">
        رأيك يساعد الآخرين على اتخاذ قرارات أفضل.<br>
        شكراً لكونك جزءاً من مجتمع ضيف!
      </p>
    </div>
  </div>
</body>
</html>
    `,
  },
};

/**
 * Get email template by name
 */
export function getEmailTemplate(name: string): EmailTemplate | null {
  return EMAIL_TEMPLATES[name] || null;
}

/**
 * Register custom email template
 */
export function registerEmailTemplate(name: string, template: EmailTemplate): void {
  EMAIL_TEMPLATES[name] = template;
}

/**
 * List available templates
 */
export function listEmailTemplates(): string[] {
  return Object.keys(EMAIL_TEMPLATES);
}

// Export
export { Resend };
