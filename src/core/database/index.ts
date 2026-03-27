/**
 * Core Database Module
 * تصدير وحدات قاعدة البيانات الأساسية
 */

// Types
export type {
  SortDirection,
  SortOptions,
  PaginationOptions,
  FilterOperator,
  FilterValue,
  FilterQuery,
  QueryOptions,
  PaginatedResult,
  FindManyResult,
  TransactionOptions,
  TransactionCallback,
  BaseEntity,
  SoftDeletableEntity,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
  CountOptions,
} from './types';

// Errors
export { DatabaseError, DatabaseErrorCode } from './types';

// Interfaces
export type {
  IRepository,
  IDatabaseProvider,
  IUnitOfWork,
  IRepositoryFactory,
  IQueryBuilder,
  IMigration,
  IMigrationRunner,
} from './interface';
