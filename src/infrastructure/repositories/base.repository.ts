/**
 * Base Repository Implementation
 * تنفيذ المستودع الأساسي
 * 
 * Abstract base class implementing IRepository with common CRUD operations
 * يدعم DataLoader لمنع N+1 queries جذرياً
 */

import type { IRepository, IDatabaseProvider, QueryOptions, PaginatedResult, FilterQuery, PaginationOptions, CreateOptions, UpdateOptions, DeleteOptions, CountOptions, BaseEntity } from '@/core/database';
import { DatabaseError, DatabaseErrorCode } from '@/core/database';
import { getSupabaseProvider } from '../database/supabase-provider';
import DataLoader from 'dataloader';

export abstract class BaseRepository<T extends BaseEntity> implements IRepository<T> {
  protected tableName: string;
  protected provider: IDatabaseProvider;
  protected primaryKey: string = 'id';
  
  /**
   * DataLoader لمنع N+1 queries
   * يتم إنشاؤه عند الحاجة ويُخزن للـ request الواحد
   */
  private _loader: DataLoader<string, T | null> | null = null;

  constructor(tableName: string, provider?: IDatabaseProvider) {
    this.tableName = tableName;
    this.provider = provider ?? getSupabaseProvider();
  }

  /**
   * الحصول على DataLoader لهذا الـ repository
   * ينشئ loader جديد إذا لم يكن موجوداً
   */
  protected getLoader(): DataLoader<string, T | null> {
    if (!this._loader) {
      this._loader = new DataLoader<string, T | null>(
        async (keys: readonly string[]) => {
          return this._batchLoad([...keys]);
        },
        {
          cache: true,
          maxBatchSize: 100,
        }
      );
    }
    return this._loader;
  }

  /**
   * تحميل مجموعة من السجلات دفعة واحدة
   * هذه هي الدالة الأساسية للـ batching
   */
  protected async _batchLoad(ids: string[]): Promise<(T | null)[]> {
    if (ids.length === 0) return [];

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .in(this.primaryKey, ids);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, ids });
      }

      // إنشاء Map للبحث السريع
      const resultMap = new Map<string, T>();
      for (const row of data || []) {
        const entity = this.toEntity(row);
        const key = (row as Record<string, unknown>)[this.primaryKey] as string;
        resultMap.set(key, entity);
      }

      // إرجاع النتائج بنفس ترتيب الـ ids
      return ids.map(id => resultMap.get(id) || null);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, ids });
    }
  }

  /**
   * مسح الـ cache للـ DataLoader
   * يجب استدعاؤها بعد كل عملية كتابة
   */
  protected clearLoader(id?: string): void {
    if (this._loader) {
      if (id) {
        this._loader.clear(id);
      } else {
        this._loader.clearAll();
      }
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Convert database row to entity
   * Override in subclass for custom mapping
   */
  protected toEntity(row: Record<string, unknown>): T {
    return row as unknown as T;
  }

  /**
   * Convert entity to database row
   * Override in subclass for custom mapping
   */
  protected toRow(entity: Partial<T>): Record<string, unknown> {
    return entity as unknown as Record<string, unknown>;
  }

  /**
   * Transform FilterQuery to Supabase query
   */
  protected buildFilters(query: any, filters: FilterQuery): any {
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) {
        query = query.is(key, null);
      } else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        // Handle FilterOperator
        const op = value as Record<string, unknown>;
        if ('eq' in op) query = query.eq(key, op.eq);
        else if ('neq' in op) query = query.neq(key, op.neq);
        else if ('gt' in op) query = query.gt(key, op.gt);
        else if ('gte' in op) query = query.gte(key, op.gte);
        else if ('lt' in op) query = query.lt(key, op.lt);
        else if ('lte' in op) query = query.lte(key, op.lte);
        else if ('in' in op && Array.isArray(op.in)) query = query.in(key, op.in);
        else if ('contains' in op) query = query.ilike(key, `%${op.contains}%`);
        else if ('startsWith' in op) query = query.ilike(key, `${op.startsWith}%`);
        else if ('endsWith' in op) query = query.ilike(key, `%${op.endsWith}`);
        else if ('isNull' in op && op.isNull) query = query.is(key, null);
        else if ('isNotNull' in op && op.isNotNull) query = query.not(key, 'is', null);
      } else if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    }
    return query;
  }

  /**
   * Get Supabase client from provider
   */
  protected getClient(): any {
    return this.provider.getRawClient();
  }

  // ============================================
  // Read Operations
  // ============================================

  /**
   * البحث عن سجل بالمعرف
   * يستخدم DataLoader تلقائياً للـ batching
   */
  async findById(id: string): Promise<T | null> {
    return this.getLoader().load(id);
  }

  /**
   * البحث عن عدة سجلات بمعرفات متعددة
   * يستخدم batching تلقائياً
   */
  async findByIds(ids: string[]): Promise<(T | null)[]> {
    return this.getLoader().loadMany(ids);
  }

  /**
   * البحث عن سجل بالمعرف (بدون DataLoader)
   * يستخدم للعمليات التي تحتاج استعلام مباشر
   */
  async findByIdDirect(id: string): Promise<T | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq(this.primaryKey, id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, id });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id });
    }
  }

  async findOne(filters: FilterQuery): Promise<T | null> {
    try {
      const client = this.getClient();
      let query = client.from(this.tableName).select('*');
      query = this.buildFilters(query, filters);

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, filters });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, filters });
    }
  }

  async findMany(options?: QueryOptions): Promise<T[]> {
    try {
      const client = this.getClient();
      let query = client.from(this.tableName).select(options?.select?.join(',') || '*');

      // Apply filters
      if (options?.filters) {
        query = this.buildFilters(query, options.filters);
      }

      // Apply sorting
      if (options?.sort) {
        const sorts = Array.isArray(options.sort) ? options.sort : [options.sort];
        for (const sort of sorts) {
          query = query.order(sort.field, { ascending: sort.direction === 'asc' });
        }
      }

      // Apply pagination
      if (options?.pagination) {
        const { page = 1, limit = 10, offset } = options.pagination;
        const actualOffset = offset ?? (page - 1) * limit;
        query = query.range(actualOffset, actualOffset + limit - 1);
      }

      // Apply includes (relations)
      if (options?.include && options.include.length > 0) {
        // For Supabase, we use the select syntax for relations
        // This is a simplified version - complex relations need custom handling
      }

      const { data, error } = await query;

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, options });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, options });
    }
  }

  async findManyPaginated(options: QueryOptions & { pagination: PaginationOptions }): Promise<PaginatedResult<T>> {
    try {
      const { page = 1, limit = 10 } = options.pagination;
      const offset = (page - 1) * limit;

      const client = this.getClient();

      // Get total count
      let countQuery = client.from(this.tableName).select('*', { count: 'exact', head: true });
      if (options.filters) {
        countQuery = this.buildFilters(countQuery, options.filters);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        throw DatabaseError.fromError(countError, { table: this.tableName, context: 'count' });
      }

      const total = count || 0;

      // Get data
      let dataQuery = client.from(this.tableName).select('*');
      if (options.filters) {
        dataQuery = this.buildFilters(dataQuery, options.filters);
      }
      if (options.sort) {
        const sorts = Array.isArray(options.sort) ? options.sort : [options.sort];
        for (const sort of sorts) {
          dataQuery = dataQuery.order(sort.field, { ascending: sort.direction === 'asc' });
        }
      }
      dataQuery = dataQuery.range(offset, offset + limit - 1);

      const { data, error } = await dataQuery;

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, options });
      }

      const totalPages = Math.ceil(total / limit);

      return {
        data: (data || []).map(row => this.toEntity(row)),
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, options });
    }
  }

  async count(options?: CountOptions): Promise<number> {
    try {
      const client = this.getClient();
      let query = client.from(this.tableName).select('*', { count: 'exact', head: true });

      if (options?.filters) {
        query = this.buildFilters(query, options.filters);
      }

      const { count, error } = await query;

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, options });
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, options });
    }
  }

  async exists(filters: FilterQuery): Promise<boolean> {
    const count = await this.count({ filters });
    return count > 0;
  }

  // ============================================
  // Write Operations
  // ============================================

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, _options?: CreateOptions): Promise<T> {
    try {
      const client = this.getClient();
      const row = this.toRow(data as Partial<T>);
      
      // Add timestamps
      const now = new Date().toISOString();
      row.created_at = now;
      row.updated_at = now;

      const { data: result, error } = await client
        .from(this.tableName)
        .insert(row)
        .select()
        .single();

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, data: row });
      }

      const entity = this.toEntity(result);
      
      // تحديث الـ cache
      this.clearLoader();
      
      return entity;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, data });
    }
  }

  async createMany(data: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>, _options?: CreateOptions): Promise<T[]> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();
      
      const rows = data.map(item => {
        const row = this.toRow(item as Partial<T>);
        row.created_at = now;
        row.updated_at = now;
        return row;
      });

      const { data: result, error } = await client
        .from(this.tableName)
        .insert(rows)
        .select();

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, count: rows.length });
      }

      return (result || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, count: data.length });
    }
  }

  async update(id: string, data: Partial<T>, _options?: UpdateOptions): Promise<T | null> {
    try {
      const client = this.getClient();
      const row = this.toRow(data);
      
      // Update timestamp
      row.updated_at = new Date().toISOString();
      
      // Remove protected fields
      delete row.id;
      delete row.created_at;

      const { data: result, error } = await client
        .from(this.tableName)
        .update(row)
        .eq(this.primaryKey, id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: this.tableName, id, data: row });
      }

      const entity = result ? this.toEntity(result) : null;
      
      // تحديث الـ cache للـ id المحدد
      this.clearLoader(id);
      
      return entity;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id, data });
    }
  }

  async updateMany(filters: FilterQuery, data: Partial<T>, _options?: UpdateOptions): Promise<number> {
    try {
      const client = this.getClient();
      const row = this.toRow(data);
      
      // Update timestamp
      row.updated_at = new Date().toISOString();
      
      // Remove protected fields
      delete row.id;
      delete row.created_at;

      let query = client.from(this.tableName).update(row);
      query = this.buildFilters(query, filters);

      const { data: result, error } = await query.select('id');

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, filters, data: row });
      }

      return result?.length || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, filters, data });
    }
  }

  async delete(id: string, options?: DeleteOptions): Promise<boolean> {
    try {
      const client = this.getClient();

      if (options?.soft) {
        // Soft delete - set deleted_at
        const { error } = await client
          .from(this.tableName)
          .update({ deleted_at: new Date().toISOString() })
          .eq(this.primaryKey, id);

        if (error) {
          throw DatabaseError.fromError(error, { table: this.tableName, id, softDelete: true });
        }

        // تحديث الـ cache
        this.clearLoader(id);

        return true;
      }

      // Hard delete
      const { error } = await client
        .from(this.tableName)
        .delete()
        .eq(this.primaryKey, id);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, id });
      }

      // تحديث الـ cache
      this.clearLoader(id);

      return true;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id });
    }
  }

  async deleteMany(filters: FilterQuery, options?: DeleteOptions): Promise<number> {
    try {
      const client = this.getClient();

      if (options?.soft) {
        // Soft delete
        let query = client.from(this.tableName).update({ deleted_at: new Date().toISOString() });
        query = this.buildFilters(query, filters);
        
        const { data: result, error } = await query.select('id');

        if (error) {
          throw DatabaseError.fromError(error, { table: this.tableName, filters, softDelete: true });
        }

        return result?.length || 0;
      }

      // Hard delete
      let query = client.from(this.tableName).delete();
      query = this.buildFilters(query, filters);
      
      const { data: result, error } = await query.select('id');

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, filters });
      }

      return result?.length || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, filters });
    }
  }

  // ============================================
  // Transaction Support
  // ============================================

  async transaction<R>(callback: (tx: unknown) => Promise<R>, options?: import('@/core/database').TransactionOptions): Promise<R> {
    return this.provider.transaction(callback, options);
  }
}
