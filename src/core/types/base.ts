/**
 * Base Types - الأنواع الأساسية
 *
 * هذا الملف يحدد الأنواع الأساسية المشتركة في كل المنصة.
 * كل الأنواع الأخرى يجب أن ترث من هذه الأنواع.
 *
 * المبدأ: Single Source of Truth لكل نوع أساسي
 */

// ============================================
// Utility Types
// ============================================

/**
 * استبدال null بـ undefined (للتوافق مع TypeScript strict mode)
 */
export type NullToUndefined<T> = {
  [K in keyof T]: T[K] extends null ? T[K] | undefined : T[K];
};

/**
 * جعل الحقول الاختيارية اختيارية بشكل صريح
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * استخراج نوع القيمة من Record
 */
export type ValueOf<T> = T[keyof T];

/**
 * مفتاح من نوع معين
 */
export type KeyOf<T> = keyof T;

/**
 * معرف فريد (UUID أو سلسلة)
 */
export type ID = string;

/**
 * الطابع الزمني
 */
export type Timestamp = Date | string;

// ============================================
// Base Entity Types
// ============================================

/**
 * الحقول الأساسية المشتركة في كل كيان
 * هذه هي الواجهة الأساسية لجميع الكيانات في المنصة
 */
export interface BaseEntity {
  /** معرف فريد (UUID) */
  id: ID;
  /** تاريخ الإنشاء */
  createdAt: Date;
  /** تاريخ آخر تحديث */
  updatedAt: Date;
  /** تاريخ الحذف الناعم (إن وجد) */
  deletedAt?: Date | null;
}

/**
 * كيان بصيغة Database Row (snake_case)
 * يُستخدم عند التعامل مباشرة مع Supabase/PostgreSQL
 */
export type DatabaseRow = Record<string, unknown>;

/**
 * كيان بصيغة JSON (للـ API responses)
 * Dates تُحول إلى strings
 */
export type JsonEntity<T extends BaseEntity> = Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

/**
 * كيان مع علاقات
 */
export type EntityWithRelations<T extends BaseEntity, R extends Record<string, unknown>> = T & R;

// ============================================
// Pagination Types
// ============================================

/**
 * خيارات الترقيم
 */
export interface PaginationOptions {
  /** رقم الصفحة (يبدأ من 1) */
  page: number;
  /** عدد العناصر في الصفحة */
  limit: number;
  /** إزاحة مخصصة (يتجاوز page) */
  offset?: number;
  /** الترتيب حسب */
  sortBy?: string;
  /** اتجاه الترتيب */
  sortOrder?: 'asc' | 'desc';
}

/**
 * نتيجة مرقمة
 */
export interface PaginatedResult<T> {
  /** البيانات */
  data: T[];
  /** إجمالي العناصر */
  total: number;
  /** الصفحة الحالية */
  page: number;
  /** عدد العناصر في الصفحة */
  limit: number;
  /** إجمالي الصفحات */
  totalPages: number;
  /** هل هناك صفحة تالية */
  hasMore: boolean;
}

/**
 * معاملات الترقيم للـ API
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * معاملات البحث للـ API
 */
export interface SearchQuery extends PaginationQuery {
  q?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * معاملات التصفية للـ API
 */
export interface FilterQuery {
  status?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================
// Repository Types
// ============================================

/**
 * خيارات البحث
 */
export interface FindOptions {
  /** ترتيب النتائج */
  orderBy?: Record<string, 'asc' | 'desc'>;
  /** تحديد عدد النتائج */
  limit?: number;
  /** إزاحة النتائج */
  offset?: number;
  /** تضمين العلاقات */
  include?: string[];
  /** تضمين المحذوفة ناعماً */
  includeDeleted?: boolean;
}

/**
 * خيارات الإنشاء
 */
export interface CreateOptions {
  /** إرجاع السجل المنشأ */
  returning?: boolean;
}

/**
 * خيارات التحديث
 */
export interface UpdateOptions {
  /** تحديث حتى لو كان محذوفاً */
  includeDeleted?: boolean;
}

/**
 * خيارات الحذف
 */
export interface DeleteOptions {
  /** حذف ناعم (soft delete) */
  soft?: boolean;
  /** حذف نهائي (force) */
  force?: boolean;
}

// ============================================
// Result Types
// ============================================

/**
 * نتيجة عملية
 */
export interface OperationResult<T = unknown> {
  /** نجاح العملية */
  success: boolean;
  /** البيانات (إن وجدت) */
  data?: T;
  /** خطأ (إن وجد) */
  error?: string;
  /** تفاصيل الخطأ */
  details?: Record<string, string[]>;
}

/**
 * نتيجة إنشاء
 */
export interface CreateResult<T extends BaseEntity> {
  /** السجل المنشأ */
  record: T;
  /** معرف السجل */
  id: string;
}

/**
 * نتيجة تحديث
 */
export interface UpdateResult<T extends BaseEntity> {
  /** السجل المحدث */
  record: T;
  /** عدد السجلات المتأثرة */
  affected: number;
}

/**
 * نتيجة حذف
 */
export interface DeleteResult {
  /** نجاح العملية */
  success: boolean;
  /** عدد السجلات المحذوفة */
  affected: number;
}

// ============================================
// Type Guards
// ============================================

/**
 * التحقق من أن الكائن هو BaseEntity
 */
export function isBaseEntity(value: unknown): value is BaseEntity {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as BaseEntity).id === 'string'
  );
}

/**
 * التحقق من أن الكائن له حقل محذوف
 */
export function hasDeletedAt(value: unknown): value is BaseEntity & { deletedAt: Date | null } {
  return isBaseEntity(value) && 'deletedAt' in value;
}

// ============================================
// Serialization Helpers
// ============================================

/**
 * تحويل كيان إلى JSON للـ API response
 */
export function toJson<T extends BaseEntity>(entity: T): JsonEntity<T> {
  return {
    ...entity,
    createdAt: entity.createdAt instanceof Date 
      ? entity.createdAt.toISOString() 
      : String(entity.createdAt),
    updatedAt: entity.updatedAt instanceof Date 
      ? entity.updatedAt.toISOString() 
      : String(entity.updatedAt),
    deletedAt: entity.deletedAt 
      ? (entity.deletedAt instanceof Date ? entity.deletedAt.toISOString() : String(entity.deletedAt))
      : null,
  } as JsonEntity<T>;
}

/**
 * تحويل مجموعة من الكيانات إلى JSON
 */
export function toJsonArray<T extends BaseEntity>(entities: T[]): JsonEntity<T>[] {
  return entities.map(toJson);
}

/**
 * تحويل JSON إلى كيان (مع تحويل التواريخ)
 */
export function fromJson<T extends BaseEntity>(
  json: JsonEntity<T>,
  dateFields: (keyof T)[] = ['createdAt', 'updatedAt', 'deletedAt'] as (keyof T)[]
): T {
  const result = { ...json } as unknown as T;
  
  for (const field of dateFields) {
    const value = (json as unknown as Record<string, unknown>)[field as string];
    if (typeof value === 'string') {
      (result as unknown as Record<string, unknown>)[field as string] = new Date(value);
    }
  }
  
  return result;
}

/**
 * تحويل PaginatedResult إلى JSON
 */
export function paginatedToJson<T extends BaseEntity>(
  result: PaginatedResult<T>
): PaginatedResult<JsonEntity<T>> {
  return {
    ...result,
    data: toJsonArray(result.data),
  };
}

// ============================================
// Brand Types (للتمييز بين الأنواع المتشابهة)
// ============================================

/**
 * UUID مُتحقق منه
 */
export type UUID = string & { readonly __brand: unique symbol };

/**
 * بريد إلكتروني مُتحقق منه
 */
export type Email = string & { readonly __brand: unique symbol };

/**
 * رقم هاتف مُتحقق منه
 */
export type Phone = string & { readonly __brand: unique symbol };

/**
 * Slug مُتحقق منه
 */
export type Slug = string & { readonly __brand: unique symbol };
