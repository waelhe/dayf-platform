/**
 * Core Database Interface
 * واجهة قاعدة البيانات الأساسية
 * 
 * This interface provides an abstraction layer between the domain layer
 * and the database implementation (Supabase/PostgreSQL).
 */

import type {
  BaseEntity,
  QueryOptions,
  PaginatedResult,
  FilterQuery,
  PaginationOptions,
  TransactionCallback,
  TransactionOptions,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
  CountOptions,
} from './types';

// ============================================
// Repository Interface
// ============================================

/**
 * Generic Repository Interface
 * Implements the Repository Pattern for clean architecture
 */
export interface IRepository<T extends BaseEntity> {
  // Read Operations
  findById(id: string): Promise<T | null>;
  findOne(filters: FilterQuery): Promise<T | null>;
  findMany(options?: QueryOptions): Promise<T[]>;
  findManyPaginated(options: QueryOptions & { pagination: PaginationOptions }): Promise<PaginatedResult<T>>;
  count(options?: CountOptions): Promise<number>;
  exists(filters: FilterQuery): Promise<boolean>;

  // Write Operations
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, options?: CreateOptions): Promise<T>;
  createMany(data: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>, options?: CreateOptions): Promise<T[]>;
  update(id: string, data: Partial<T>, options?: UpdateOptions): Promise<T | null>;
  updateMany(filters: FilterQuery, data: Partial<T>, options?: UpdateOptions): Promise<number>;
  delete(id: string, options?: DeleteOptions): Promise<boolean>;
  deleteMany(filters: FilterQuery, options?: DeleteOptions): Promise<number>;

  // Utility
  transaction<R>(callback: TransactionCallback<R>, options?: TransactionOptions): Promise<R>;
}

// ============================================
// Database Provider Interface
// ============================================

/**
 * Database Provider Interface
 * Abstracts the underlying database connection
 */
export interface IDatabaseProvider {
  // Connection Management
  isConnected(): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }>;

  // Query Execution - supports both SQL and Supabase-style queries
  query<T>(sqlOrTable: string, paramsOrOptions?: unknown): Promise<T[]>;
  execute(sqlOrTable: string, paramsOrOperation?: unknown, data?: unknown, filters?: Record<string, unknown>): Promise<{ affectedRows: number; insertId?: string }>;

  // Transaction Support
  beginTransaction(): Promise<unknown>;
  commit(transaction: unknown): Promise<void>;
  rollback(transaction: unknown): Promise<void>;
  transaction<R>(callback: (tx: unknown) => Promise<R>, options?: TransactionOptions): Promise<R>;

  // Table Operations
  getTableNames(): Promise<string[]>;
  tableExists(tableName: string): Promise<boolean>;

  // Raw Access (for complex operations)
  getRawClient(): unknown;
}

// ============================================
// Unit of Work Interface
// ============================================

/**
 * Unit of Work Interface
 * Manages a batch of operations as a single unit
 */
export interface IUnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  
  getRepository<T extends BaseEntity>(entityName: string): IRepository<T>;
  
  // Track changes
  track<T extends BaseEntity>(entity: T): void;
  markDeleted<T extends BaseEntity>(entity: T): void;
  
  // Flush all pending changes
  flush(): Promise<void>;
}

// ============================================
// Repository Factory Interface
// ============================================

/**
 * Repository Factory Interface
 * Creates repository instances with proper dependency injection
 */
export interface IRepositoryFactory {
  getRepository<T extends BaseEntity>(entityName: string): IRepository<T>;
  registerRepository<T extends BaseEntity>(entityName: string, repository: IRepository<T>): void;
  clear(): void;
}

// ============================================
// Query Builder Interface
// ============================================

/**
 * Query Builder Interface
 * For building complex queries fluently
 */
export interface IQueryBuilder<T extends BaseEntity> {
  select(fields: string[]): IQueryBuilder<T>;
  where(field: string, operator: string, value: unknown): IQueryBuilder<T>;
  whereIn(field: string, values: unknown[]): IQueryBuilder<T>;
  whereNull(field: string): IQueryBuilder<T>;
  whereNotNull(field: string): IQueryBuilder<T>;
  orderBy(field: string, direction: 'asc' | 'desc'): IQueryBuilder<T>;
  limit(limit: number): IQueryBuilder<T>;
  offset(offset: number): IQueryBuilder<T>;
  include(relation: string): IQueryBuilder<T>;
  
  // Execute
  getOne(): Promise<T | null>;
  getMany(): Promise<T[]>;
  getPaginated(page: number, limit: number): Promise<PaginatedResult<T>>;
  getCount(): Promise<number>;
  
  // Debug
  toSQL(): string;
}

// ============================================
// Migration Interface
// ============================================

export interface IMigration {
  name: string;
  up(provider: IDatabaseProvider): Promise<void>;
  down(provider: IDatabaseProvider): Promise<void>;
}

export interface IMigrationRunner {
  runPending(): Promise<void>;
  runOne(name: string): Promise<void>;
  rollback(steps?: number): Promise<void>;
  status(): Promise<{ name: string; applied: boolean; appliedAt?: Date }[]>;
}
