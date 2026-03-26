/**
 * Validation Schemas
 * مخططات التحقق
 * 
 * Zod schemas for input validation across the application.
 */

import { z } from 'zod';

// ============================================
// Auth Validation
// ============================================

export const loginSchema = z.object({
  method: z.enum(['email', 'phone']),
  email: z.string().email('البريد الإلكتروني غير صالح').optional(),
  password: z.string().min(8, 'كلمة المرور قصيرة جداً').optional(),
  phone: z.string().min(10, 'رقم الهاتف غير صالح').optional(),
  otp: z.string().length(6, 'رمز التحقق يجب أن يكون 6 أرقام').optional(),
});

export const registerSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح').optional(),
  phone: z.string().min(10, 'رقم الهاتف غير صالح').optional(),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'كلمة المرور يجب أن تحتوي على حرف كبير')
    .regex(/[0-9]/, 'كلمة المرور يجب أن تحتوي على رقم'),
  firstName: z.string().min(2, 'الاسم الأول قصير جداً'),
  lastName: z.string().min(2, 'الاسم الأخير قصير جداً'),
  method: z.enum(['email', 'phone']).default('email'),
});

export const sendOTPSchema = z.object({
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
  type: z.enum(['LOGIN', 'REGISTER', 'VERIFY', 'RESET_PASSWORD']),
});

export const verifyOTPSchema = z.object({
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
  code: z.string().length(6, 'رمز التحقق يجب أن يكون 6 أرقام'),
  type: z.enum(['LOGIN', 'REGISTER', 'VERIFY', 'RESET_PASSWORD']),
});

// ============================================
// Company Validation
// ============================================

export const createCompanySchema = z.object({
  name: z.string().min(2, 'اسم الشركة قصير جداً').max(100),
  type: z.enum(['HOTEL', 'TOUR_OPERATOR', 'TRANSPORT', 'RESTAURANT', 'SHOP', 'TRAVEL_AGENCY', 'CAR_RENTAL', 'EVENT_ORGANIZER', 'OTHER']),
  description: z.string().max(500).optional(),
  email: z.string().email('البريد الإلكتروني غير صالح').optional(),
  phone: z.string().min(10, 'رقم الهاتف غير صالح').optional(),
  website: z.string().url('رابط الموقع غير صالح').optional().or(z.literal('')),
  country: z.string().max(50).optional(),
  city: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  commercialReg: z.string().optional(),
  taxNumber: z.string().optional(),
  documents: z.array(z.string().url()).optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const inviteEmployeeSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF', 'VIEWER']),
  permissions: z.array(z.string()).optional(),
});

// ============================================
// Booking Validation
// ============================================

export const createBookingSchema = z.object({
  guestId: z.string().min(1, 'معرف الضيف مطلوب'),
  hostId: z.string().min(1, 'معرف المضيف مطلوب'),
  serviceId: z.string().min(1, 'معرف الخدمة مطلوب'),
  checkIn: z.string().transform(v => new Date(v)).refine(v => v > new Date(), 'تاريخ الوصول يجب أن يكون في المستقبل'),
  checkOut: z.string().transform(v => new Date(v)),
  guests: z.number().int().min(1, 'عدد الضيوف يجب أن يكون على الأقل 1'),
  totalPrice: z.number().positive('السعر يجب أن يكون موجباً'),
}).refine(data => data.checkOut > data.checkIn, {
  message: 'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول',
  path: ['checkOut'],
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
});

// ============================================
// Order Validation
// ============================================

export const createOrderSchema = z.object({
  userId: z.string().min(1, 'معرف المستخدم مطلوب'),
  items: z.array(z.object({
    productId: z.string().min(1, 'معرف المنتج مطلوب'),
    quantity: z.number().int().positive('الكمية يجب أن تكون موجبة'),
  })).min(1, 'يجب إضافة منتج واحد على الأقل'),
  shippingInfo: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(10),
    address: z.string().min(5),
    city: z.string().min(2),
    notes: z.string().optional(),
  }).optional(),
});

// ============================================
// Review Validation
// ============================================

export const createReviewSchema = z.object({
  type: z.enum(['SERVICE', 'ACTIVITY', 'DESTINATION', 'PRODUCT', 'COMPANY']),
  referenceId: z.string().min(1, 'معرف المرجع مطلوب'),
  bookingId: z.string().optional(),
  source: z.enum(['BOOKING', 'COMMUNITY', 'MARKETPLACE', 'DIRECT']),
  travelPhase: z.enum(['BEFORE', 'DURING', 'AFTER']).optional(),
  title: z.string().max(100).optional(),
  content: z.string().min(10, 'المحتوى قصير جداً').max(2000),
  rating: z.number().min(1).max(5),
  cleanliness: z.number().min(1).max(5).optional(),
  location: z.number().min(1).max(5).optional(),
  value: z.number().min(1).max(5).optional(),
  serviceRating: z.number().min(1).max(5).optional(),
  amenities: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
  visitDate: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

// ============================================
// Dispute Validation
// ============================================

export const createDisputeSchema = z.object({
  escrowId: z.string().min(1, 'معرف الضمان مطلوب'),
  referenceType: z.enum(['BOOKING', 'ORDER', 'ACTIVITY']),
  referenceId: z.string().min(1, 'معرف المرجع مطلوب'),
  againstUser: z.string().min(1, 'معرف المستخدم الآخر مطلوب'),
  type: z.enum(['BOOKING_ISSUE', 'PRODUCT_ISSUE', 'PAYMENT_ISSUE', 'SERVICE_QUALITY', 'CANCELLATION', 'REFUND_REQUEST', 'OTHER']),
  reason: z.string().min(10, 'السبب قصير جداً').max(500),
  description: z.string().min(20, 'الوصف قصير جداً').max(2000),
});

export const addDisputeMessageSchema = z.object({
  message: z.string().min(1, 'الرسالة مطلوبة').max(2000),
  attachments: z.array(z.string()).optional(),
});

// ============================================
// Community Validation
// ============================================

export const createTopicSchema = z.object({
  title: z.string().min(5, 'العنوان قصير جداً').max(200),
  content: z.string().min(10, 'المحتوى قصير جداً').max(10000),
  categoryId: z.string().min(1, 'التصنيف مطلوب'),
  subCategoryId: z.string().optional(),
  isOfficial: z.boolean().optional(),
});

export const createReplySchema = z.object({
  topicId: z.string().min(1, 'معرف الموضوع مطلوب'),
  content: z.string().min(1, 'المحتوى مطلوب').max(5000),
});

// ============================================
// Pagination & Filter Validation
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

// ============================================
// Helper Functions
// ============================================

/**
 * Validate request body against schema
 * التحقق من صحة جسم الطلب مقابل المخطط
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

/**
 * Validate request search params against schema
 * التحقق من صحة معاملات البحث مقابل المخطط
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params = Object.fromEntries(searchParams.entries());
  return schema.parse(params);
}

/**
 * Format Zod error to Arabic
 * تنسيق خطأ Zod إلى العربية
 */
export function formatZodError(error: z.ZodError): string {
  const firstError = error.errors[0];
  return firstError?.message || 'خطأ في التحقق من البيانات';
}
