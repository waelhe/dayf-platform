/**
 * Core Database Types
 * أنواع قاعدة البيانات الأساسية
 */

// ============================================
// Query Types
// ============================================

export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  direction: SortDirection;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface FilterOperator {
  eq?: unknown;
  neq?: unknown;
  gt?: unknown;
  gte?: unknown;
  lt?: unknown;
  lte?: unknown;
  in?: unknown[];
  notIn?: unknown[];
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  isNull?: boolean;
  isNotNull?: boolean;
}

export type FilterValue = string | number | boolean | Date | null | FilterOperator;

export interface FilterQuery {
  [key: string]: FilterValue | FilterQuery | FilterQuery[];
}

export interface QueryOptions {
  filters?: FilterQuery;
  sort?: SortOptions | SortOptions[];
  pagination?: PaginationOptions;
  select?: string[];
  include?: string[];
}

// ============================================
// Result Types
// ============================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface FindManyResult<T> {
  data: T[];
  count: number;
}

// ============================================
// Transaction Types
// ============================================

export interface TransactionOptions {
  timeout?: number;
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
}

export type TransactionCallback<T> = (tx: unknown) => Promise<T>;

// ============================================
// Error Types
// ============================================

export enum DatabaseErrorCode {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_KEY = 'DUPLICATE_KEY',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: DatabaseErrorCode,
    public cause?: Error,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  static fromError(error: unknown, context?: Record<string, unknown>): DatabaseError {
    if (error instanceof DatabaseError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    
    // PostgreSQL error codes
    const pgError = error as { code?: string };
    
    let code = DatabaseErrorCode.UNKNOWN;
    
    if (pgError.code) {
      switch (pgError.code) {
        case '23505':
          code = DatabaseErrorCode.DUPLICATE_KEY;
          break;
        case '23503':
          code = DatabaseErrorCode.FOREIGN_KEY_VIOLATION;
          break;
        case '23514':
          code = DatabaseErrorCode.CONSTRAINT_VIOLATION;
          break;
        case '08006':
        case '08001':
          code = DatabaseErrorCode.CONNECTION_ERROR;
          break;
        case '57014':
          code = DatabaseErrorCode.TIMEOUT;
          break;
      }
    }

    return new DatabaseError(message, code, error instanceof Error ? error : undefined, context);
  }
}

// ============================================
// Entity Base Types
// ============================================

export interface BaseEntity {
  id: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface SoftDeletableEntity extends BaseEntity {
  deletedAt?: Date | string | null;
}

// ============================================
// Repository Types
// ============================================

export interface CreateOptions {
  returning?: boolean;
}

export interface UpdateOptions {
  returning?: boolean;
}

export interface DeleteOptions {
  soft?: boolean;
  returning?: boolean;
}

export interface CountOptions {
  filters?: FilterQuery;
}
