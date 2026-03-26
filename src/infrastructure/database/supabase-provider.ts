/**
 * Supabase Database Provider
 * موفر قاعدة بيانات Supabase
 * 
 * Implements IDatabaseProvider for Supabase/PostgreSQL
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, checkConnection } from '@/lib/supabase';
import type { IDatabaseProvider } from '@/core/database';
import { DatabaseError, DatabaseErrorCode, type TransactionOptions, type TransactionCallback } from '@/core/database';

export class SupabaseProvider implements IDatabaseProvider {
  private client: SupabaseClient;
  private connected: boolean = false;

  constructor(client?: SupabaseClient) {
    this.client = client || getSupabaseClient();
  }

  // ============================================
  // Connection Management
  // ============================================

  async isConnected(): Promise<boolean> {
    if (!this.connected) {
      const result = await this.healthCheck();
      this.connected = result.healthy;
    }
    return this.connected;
  }

  async connect(): Promise<void> {
    const result = await this.healthCheck();
    if (!result.healthy) {
      throw new DatabaseError(
        `Failed to connect to Supabase: ${result.error}`,
        DatabaseErrorCode.CONNECTION_ERROR
      );
    }
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    // Supabase client doesn't need explicit disconnect
    this.connected = false;
  }

  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    return checkConnection();
  }

  // ============================================
  // Query Execution
  // ============================================

  async query<T>(table: string, options?: {
    select?: string;
    filters?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    try {
      let query = this.client.from(table).select(options?.select || '*');

      // Apply filters
      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (value === null) {
            query = query.is(key, null);
          } else if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      }

      // Apply ordering
      if (options?.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw DatabaseError.fromError(error, { table, options });
      }

      return (data as T[]) || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table, options });
    }
  }

  async execute(table: string, operation: 'insert' | 'update' | 'delete', data?: unknown, filters?: Record<string, unknown>): Promise<{ affectedRows: number; insertId?: string }> {
    try {
      let result;

      switch (operation) {
        case 'insert': {
          const { data: inserted, error } = await this.client
            .from(table)
            .insert(data as Record<string, unknown>)
            .select('id');
          
          if (error) throw DatabaseError.fromError(error, { table, operation, data });
          
          return {
            affectedRows: inserted?.length || 0,
            insertId: inserted?.[0]?.id,
          };
        }

        case 'update': {
          if (!filters) throw new Error('Update operation requires filters');
          
          let query = this.client.from(table).update(data as Record<string, unknown>);
          
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value);
          }
          
          const { data: updated, error } = await query.select('id');
          
          if (error) throw DatabaseError.fromError(error, { table, operation, data, filters });
          
          return {
            affectedRows: updated?.length || 0,
          };
        }

        case 'delete': {
          if (!filters) throw new Error('Delete operation requires filters');
          
          let query = this.client.from(table).delete();
          
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value);
          }
          
          const { data: deleted, error } = await query.select('id');
          
          if (error) throw DatabaseError.fromError(error, { table, operation, filters });
          
          return {
            affectedRows: deleted?.length || 0,
          };
        }

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table, operation, data, filters });
    }
  }

  // ============================================
  // Transaction Support
  // ============================================

  async beginTransaction(): Promise<unknown> {
    // Supabase/PostgreSQL transactions are handled via RPC or multiple queries
    // For now, we return a transaction marker
    return { startTime: Date.now(), operations: [] as unknown[] };
  }

  async commit(transaction: unknown): Promise<void> {
    // In Supabase, we commit by executing all operations
    // For complex transactions, use RPC functions
    console.log('Transaction committed:', transaction);
  }

  async rollback(transaction: unknown): Promise<void> {
    // In Supabase, we would need to implement compensating actions
    // For complex transactions, use RPC functions with proper rollback
    console.log('Transaction rolled back:', transaction);
  }

  async transaction<R>(callback: TransactionCallback<R>, _options?: TransactionOptions): Promise<R> {
    // For Supabase, we use a simplified transaction model
    // Complex transactions should be implemented as RPC functions
    const tx = await this.beginTransaction();
    
    try {
      const result = await callback(tx);
      await this.commit(tx);
      return result;
    } catch (error) {
      await this.rollback(tx);
      throw DatabaseError.fromError(error, { context: 'transaction' });
    }
  }

  // ============================================
  // Table Operations
  // ============================================

  async getTableNames(): Promise<string[]> {
    const { data, error } = await this.client.rpc('get_table_names');
    
    if (error) {
      // Fallback to known tables
      return [
        'users', 'sessions', 'otp_codes', 'user_verifications',
        'companies', 'company_employees', 'company_invitations',
        'destinations', 'activities', 'tours',
        'products', 'carts', 'cart_items',
        'topics', 'replies',
        'bookings', 'services',
        'orders', 'order_items',
        'escrows', 'escrow_transactions',
        'disputes', 'dispute_messages', 'dispute_timeline',
        'reviews', 'review_photos', 'review_helpful', 'review_replies',
        'wishlist_items', 'reviewer_profiles',
      ];
    }
    
    return data?.map((row: { table_name: string }) => row.table_name) || [];
  }

  async tableExists(tableName: string): Promise<boolean> {
    const { error } = await this.client
      .from(tableName)
      .select('id')
      .limit(1);
    
    // If error code is for relation not found, table doesn't exist
    return !error || error.code !== '42P01';
  }

  // ============================================
  // Raw Access
  // ============================================

  getRawClient(): SupabaseClient {
    return this.client;
  }
}

// Singleton instance
let providerInstance: SupabaseProvider | null = null;

export function getSupabaseProvider(): SupabaseProvider {
  if (!providerInstance) {
    providerInstance = new SupabaseProvider();
  }
  return providerInstance;
}
