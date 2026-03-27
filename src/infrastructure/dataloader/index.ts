/**
 * DataLoader Registry - سجل DataLoaders الجذري
 *
 * هذا النظام يوفر batching تلقائي لجميع استعلامات findById.
 * يعمل على مستوى الـ request لضمان عدم خلط البيانات بين الطلبات.
 *
 * المبدأ: منع N+1 queries جذرياً على مستوى البنية
 *
 * مثال على المشكلة:
 * ```
 * // N+1 query problem
 * const bookings = await bookingRepo.findMany({ userId });
 * for (const booking of bookings) {
 *   const service = await serviceRepo.findById(booking.serviceId); // N queries!
 * }
 * ```
 *
 * الحل مع DataLoader:
 * ```
 * // Batching automatically
 * const bookings = await bookingRepo.findMany({ userId });
 * const services = await serviceLoader.loadMany(bookings.map(b => b.serviceId)); // 1 query!
 * ```
 */

import DataLoader from 'dataloader';
import { getSupabaseProvider } from '../database/supabase-provider';
import type { IDatabaseProvider } from '../../core/database/interface';

// ============================================
// Types
// ============================================

export type LoaderKey = string;
export type LoaderResult<T> = T | null;
export type LoaderResults<T> = (LoaderResult<T>)[];

export interface DataLoaderOptions {
  /** اسم الجدول */
  tableName: string;
  /** حقل المفتاح الأساسي */
  idField?: string;
  /** حقول إضافية للـ select */
  selectFields?: string;
  /** cache batch results */
  cache?: boolean;
  /** batch size */
  maxBatchSize?: number;
}

// ============================================
// DataLoader Factory
// ============================================

/**
 * إنشاء DataLoader لجدول معين
 */
export function createDataLoader<T extends Record<string, unknown>>(
  options: DataLoaderOptions
): DataLoader<LoaderKey, LoaderResult<T>> {
  const {
    tableName,
    idField = 'id',
    selectFields = '*',
    cache = true,
    maxBatchSize = 100,
  } = options;

  const provider = getSupabaseProvider();

  return new DataLoader<LoaderKey, LoaderResult<T>>(
    async (keys: readonly LoaderKey[]): Promise<LoaderResults<T>> => {
      // تجميع الطلبات في استعلام واحد
      const results = await provider.query<T>(
        `SELECT ${selectFields} FROM ${tableName} WHERE ${idField} = ANY($1)`,
        [keys as string[]]
      );

      // إنشاء Map للبحث السريع
      const resultMap = new Map<string, T>();
      for (const result of results) {
        const key = result[idField] as string;
        resultMap.set(key, result);
      }

      // إرجاع النتائج بنفس ترتيب الـ keys
      return keys.map(key => resultMap.get(key) || null);
    },
    {
      cache,
      maxBatchSize,
    }
  );
}

/**
 * إنشاء DataLoader للعلاقات (مثل user profiles)
 */
export function createRelationLoader<
  T extends Record<string, unknown>,
  K extends string = 'id'
>(
  tableName: string,
  foreignKey: string,
  selectFields: string = '*'
): DataLoader<LoaderKey, LoaderResult<T>> {
  const provider = getSupabaseProvider();

  return new DataLoader<LoaderKey, LoaderResult<T>>(
    async (keys: readonly LoaderKey[]): Promise<LoaderResults<T>> => {
      const results = await provider.query<T>(
        `SELECT ${selectFields} FROM ${tableName} WHERE ${foreignKey} = ANY($1)`,
        [keys as string[]]
      );

      const resultMap = new Map<string, T>();
      for (const result of results) {
        const key = result[foreignKey] as string;
        resultMap.set(key, result);
      }

      return keys.map(key => resultMap.get(key) || null);
    }
  );
}

// ============================================
// DataLoader Registry
// ============================================

/**
 * سجل DataLoaders لكل request
 *
 * يجب إنشاء registry جديد لكل request لضمان:
 * 1. عدم خلط البيانات بين الطلبات
 * 2. تنظيف الـ cache بعد انتهاء الـ request
 */
export class DataLoaderRegistry {
  private loaders: Map<string, DataLoader<LoaderKey, LoaderResult<unknown>>> = new Map();
  private provider: IDatabaseProvider;

  constructor(provider?: IDatabaseProvider) {
    this.provider = provider || getSupabaseProvider();
  }

  /**
   * الحصول على DataLoader لجدول معين
   * ينشئ loader جديد إذا لم يكن موجوداً
   */
  getLoader<T extends Record<string, unknown>>(
    tableName: string,
    options?: Partial<DataLoaderOptions>
  ): DataLoader<LoaderKey, LoaderResult<T>> {
    const key = `${tableName}:${options?.idField || 'id'}`;

    if (!this.loaders.has(key)) {
      const loader = createDataLoader<T>({
        tableName,
        idField: options?.idField,
        selectFields: options?.selectFields,
        cache: options?.cache ?? true,
        maxBatchSize: options?.maxBatchSize,
      });
      this.loaders.set(key, loader);
    }

    return this.loaders.get(key) as DataLoader<LoaderKey, LoaderResult<T>>;
  }

  /**
   * الحصول على loader للمستخدمين
   */
  getUserLoader(): DataLoader<LoaderKey, LoaderResult<UserRecord>> {
    return this.getLoader<UserRecord>('profiles', {
      selectFields: 'id, email, full_name, phone, avatar, role, status, created_at, updated_at',
    });
  }

  /**
   * الحصول على loader للخدمات
   */
  getServiceLoader(): DataLoader<LoaderKey, LoaderResult<ServiceRecord>> {
    return this.getLoader<ServiceRecord>('services', {
      selectFields: 'id, title, description, host_id, category, status, price, created_at',
    });
  }

  /**
   * الحصول على loader للحجوزات
   */
  getBookingLoader(): DataLoader<LoaderKey, LoaderResult<BookingRecord>> {
    return this.getLoader<BookingRecord>('bookings');
  }

  /**
   * الحصول على loader للشركات
   */
  getCompanyLoader(): DataLoader<LoaderKey, LoaderResult<CompanyRecord>> {
    return this.getLoader<CompanyRecord>('companies');
  }

  /**
   * الحصول على loader للمراجعات
   */
  getReviewLoader(): DataLoader<LoaderKey, LoaderResult<ReviewRecord>> {
    return this.getLoader<ReviewRecord>('reviews');
  }

  /**
   * الحصول على loader للضمانات
   */
  getEscrowLoader(): DataLoader<LoaderKey, LoaderResult<EscrowRecord>> {
    return this.getLoader<EscrowRecord>('escrows');
  }

  /**
   * تحميل عدة سجلات دفعة واحدة
   */
  async loadMany<T extends Record<string, unknown>>(
    tableName: string,
    ids: string[]
  ): Promise<(T | null)[]> {
    const loader = this.getLoader<T>(tableName);
    return loader.loadMany(ids);
  }

  /**
   * تحميل سجل واحد
   */
  async load<T extends Record<string, unknown>>(
    tableName: string,
    id: string
  ): Promise<T | null> {
    const loader = this.getLoader<T>(tableName);
    return loader.load(id);
  }

  /**
   * مسح كل الـ loaders
   */
  clearAll(): void {
    for (const loader of this.loaders.values()) {
      loader.clearAll();
    }
    this.loaders.clear();
  }

  /**
   * مسح loader معين
   */
  clear(tableName: string, id?: string): void {
    const key = `${tableName}:id`;
    const loader = this.loaders.get(key);
    if (loader) {
      if (id) {
        loader.clear(id);
      } else {
        loader.clearAll();
      }
    }
  }
}

// ============================================
// Types for Records
// ============================================

interface UserRecord {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ServiceRecord {
  id: string;
  title: string;
  description: string | null;
  host_id: string;
  category: string;
  status: string;
  price: number | null;
  created_at: string;
}

interface BookingRecord {
  id: string;
  user_id: string;
  service_id: string;
  status: string;
  total_amount: number | null;
  created_at: string;
}

interface CompanyRecord {
  id: string;
  name: string;
  owner_id: string;
  type: string;
  status: string;
  created_at: string;
}

interface ReviewRecord {
  id: string;
  author_id: string;
  reference_id: string;
  rating: number;
  content: string | null;
  status: string;
  created_at: string;
}

interface EscrowRecord {
  id: string;
  booking_id: string;
  buyer_id: string;
  provider_id: string;
  amount: number;
  status: string;
  created_at: string;
}

// ============================================
// Singleton per Request
// ============================================

let currentRegistry: DataLoaderRegistry | null = null;

/**
 * الحصول على الـ registry الحالي أو إنشاء واحد جديد
 */
export function getDataLoaderRegistry(): DataLoaderRegistry {
  if (!currentRegistry) {
    currentRegistry = new DataLoaderRegistry();
  }
  return currentRegistry;
}

/**
 * إنشاء registry جديد (يستدعى في بداية كل request)
 */
export function createDataLoaderRegistry(): DataLoaderRegistry {
  currentRegistry = new DataLoaderRegistry();
  return currentRegistry;
}

/**
 * تنظيف الـ registry (يستدعى في نهاية كل request)
 */
export function cleanupDataLoaderRegistry(): void {
  if (currentRegistry) {
    currentRegistry.clearAll();
    currentRegistry = null;
  }
}
