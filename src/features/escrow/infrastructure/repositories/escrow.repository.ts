/**
 * Escrow Repository Implementation
 * تنفيذ مستودع الضمان
 * 
 * Implements IEscrowRepository using Supabase as the data source.
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES, type SupabaseEscrow } from '@/lib/supabase';
import type { 
  Escrow, 
  EscrowTransaction, 
  EscrowWithTransactions, 
  EscrowUserStats,
  IEscrowRepository, 
  IEscrowTransactionRepository 
} from '../../domain/interfaces';
import { EscrowStatus, EscrowTransactionType } from '@/core/types/enums';
import { DatabaseError } from '@/core/database';

/**
 * Escrow Repository
 * مستودع الضمان
 */
export class EscrowRepository extends BaseRepository<Escrow> implements IEscrowRepository {
  constructor() {
    super(TABLES.ESCROWS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): Escrow {
    const dbRow = row as unknown as SupabaseEscrow;
    
    return {
      id: dbRow.id,
      buyerId: dbRow.buyer_id,
      providerId: dbRow.provider_id,
      amount: dbRow.amount,
      platformFee: dbRow.platform_fee,
      netAmount: dbRow.net_amount,
      currency: dbRow.currency,
      status: dbRow.status as EscrowStatus,
      referenceType: dbRow.reference_type,
      referenceId: dbRow.reference_id,
      fundedAt: dbRow.funded_at,
      releasedAt: dbRow.released_at,
      refundedAt: dbRow.refunded_at,
      autoReleaseAt: dbRow.auto_release_at,
      notes: dbRow.notes,
      releaseNotes: dbRow.release_notes,
      refundReason: dbRow.refund_reason,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<Escrow>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.buyerId !== undefined) row.buyer_id = entity.buyerId;
    if (entity.providerId !== undefined) row.provider_id = entity.providerId;
    if (entity.amount !== undefined) row.amount = entity.amount;
    if (entity.platformFee !== undefined) row.platform_fee = entity.platformFee;
    if (entity.netAmount !== undefined) row.net_amount = entity.netAmount;
    if (entity.currency !== undefined) row.currency = entity.currency;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.referenceType !== undefined) row.reference_type = entity.referenceType;
    if (entity.referenceId !== undefined) row.reference_id = entity.referenceId;
    if (entity.fundedAt !== undefined) row.funded_at = entity.fundedAt;
    if (entity.releasedAt !== undefined) row.released_at = entity.releasedAt;
    if (entity.refundedAt !== undefined) row.refunded_at = entity.refundedAt;
    if (entity.autoReleaseAt !== undefined) row.auto_release_at = entity.autoReleaseAt;
    if (entity.notes !== undefined) row.notes = entity.notes;
    if (entity.releaseNotes !== undefined) row.release_notes = entity.releaseNotes;
    if (entity.refundReason !== undefined) row.refund_reason = entity.refundReason;

    return row;
  }

  // ============================================
  // Escrow-Specific Repository Methods
  // ============================================

  /**
   * Find escrow by reference
   * البحث عن ضمان بالمرجع
   */
  async findByReference(referenceType: string, referenceId: string): Promise<Escrow | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('reference_type', referenceType)
        .eq('reference_id', referenceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: this.tableName, referenceType, referenceId });
      }

      return data ? this.toEntity(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, referenceType, referenceId });
    }
  }

  /**
   * Find escrow with transactions
   * البحث عن ضمان مع المعاملات
   */
  async findWithTransactions(escrowId: string): Promise<EscrowWithTransactions | null> {
    try {
      const client = this.getClient();
      
      // Get escrow
      const escrow = await this.findById(escrowId);
      if (!escrow) return null;

      // Get transactions
      const { data: transactions, error: txError } = await client
        .from(TABLES.ESCROW_TRANSACTIONS)
        .select('*')
        .eq('escrow_id', escrowId)
        .order('created_at', { ascending: true });

      if (txError) {
        throw DatabaseError.fromError(txError, { table: TABLES.ESCROW_TRANSACTIONS, escrowId });
      }

      return {
        ...escrow,
        transactions: (transactions || []).map(tx => this.toTransactionEntity(tx)),
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, escrowId });
    }
  }

  /**
   * Find escrows by buyer
   * البحث عن ضمانات المشتري
   */
  async findByBuyer(buyerId: string, status?: EscrowStatus): Promise<Escrow[]> {
    try {
      const client = this.getClient();
      let query = client
        .from(this.tableName)
        .select('*')
        .eq('buyer_id', buyerId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, buyerId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, buyerId });
    }
  }

  /**
   * Find escrows by provider
   * البحث عن ضمانات المزود
   */
  async findByProvider(providerId: string, status?: EscrowStatus): Promise<Escrow[]> {
    try {
      const client = this.getClient();
      let query = client
        .from(this.tableName)
        .select('*')
        .eq('provider_id', providerId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, providerId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, providerId });
    }
  }

  /**
   * Find escrows ready for auto-release
   * البحث عن ضمانات جاهزة للإطلاق التلقائي
   */
  async findReadyForAutoRelease(): Promise<Escrow[]> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('status', EscrowStatus.FUNDED)
        .lte('auto_release_at', now);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, operation: 'findReadyForAutoRelease' });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, operation: 'findReadyForAutoRelease' });
    }
  }

  /**
   * Update escrow status
   * تحديث حالة الضمان
   */
  async updateStatus(escrowId: string, status: EscrowStatus, updates?: Partial<Escrow>): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const updateData: Record<string, unknown> = {
        status,
        updated_at: now,
        ...updates,
      };

      // Handle date conversions
      if (updates?.fundedAt !== undefined) updateData.funded_at = updates.fundedAt;
      if (updates?.releasedAt !== undefined) updateData.released_at = updates.releasedAt;
      if (updates?.refundedAt !== undefined) updateData.refunded_at = updates.refundedAt;
      if (updates?.autoReleaseAt !== undefined) updateData.auto_release_at = updates.autoReleaseAt;
      if (updates?.notes !== undefined) updateData.notes = updates.notes;
      if (updates?.releaseNotes !== undefined) updateData.release_notes = updates.releaseNotes;
      if (updates?.refundReason !== undefined) updateData.refund_reason = updates.refundReason;

      const { error } = await client
        .from(this.tableName)
        .update(updateData)
        .eq('id', escrowId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, escrowId, operation: 'updateStatus' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, escrowId, operation: 'updateStatus' });
    }
  }

  /**
   * Get user escrow stats
   * الحصول على إحصائيات الضمان للمستخدم
   */
  async getUserStats(userId: string): Promise<EscrowUserStats> {
    try {
      const [buyerEscrows, providerEscrows] = await Promise.all([
        this.findByBuyer(userId),
        this.findByProvider(userId),
      ]);

      return {
        asBuyer: {
          total: buyerEscrows.length,
          pending: buyerEscrows.filter(e => e.status === EscrowStatus.PENDING).length,
          funded: buyerEscrows.filter(e => e.status === EscrowStatus.FUNDED).length,
          released: buyerEscrows.filter(e => e.status === EscrowStatus.RELEASED).length,
          refunded: buyerEscrows.filter(e => e.status === EscrowStatus.REFUNDED).length,
          totalAmount: buyerEscrows.reduce((sum, e) => sum + e.amount, 0),
        },
        asProvider: {
          total: providerEscrows.length,
          pending: providerEscrows.filter(e => e.status === EscrowStatus.PENDING).length,
          funded: providerEscrows.filter(e => e.status === EscrowStatus.FUNDED).length,
          released: providerEscrows.filter(e => e.status === EscrowStatus.RELEASED).length,
          totalEarnings: providerEscrows
            .filter(e => e.status === EscrowStatus.RELEASED)
            .reduce((sum, e) => sum + e.netAmount, 0),
        },
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId, operation: 'getUserStats' });
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private toTransactionEntity(row: Record<string, unknown>): EscrowTransaction {
    return {
      id: row.id as string,
      escrowId: row.escrow_id as string,
      type: row.type as EscrowTransactionType,
      amount: row.amount as number,
      currency: row.currency as string,
      description: row.description as string | null,
      metadata: row.metadata as string | null,
      fromUserId: row.from_user_id as string | null,
      toUserId: row.to_user_id as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

/**
 * Escrow Transaction Repository
 * مستودع معاملات الضمان
 */
export class EscrowTransactionRepository extends BaseRepository<EscrowTransaction> implements IEscrowTransactionRepository {
  constructor() {
    super(TABLES.ESCROW_TRANSACTIONS, getSupabaseProvider());
  }

  protected override toEntity(row: Record<string, unknown>): EscrowTransaction {
    return {
      id: row.id as string,
      escrowId: row.escrow_id as string,
      type: row.type as EscrowTransactionType,
      amount: row.amount as number,
      currency: row.currency as string,
      description: row.description as string | null,
      metadata: row.metadata as string | null,
      fromUserId: row.from_user_id as string | null,
      toUserId: row.to_user_id as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  protected override toRow(entity: Partial<EscrowTransaction>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.escrowId !== undefined) row.escrow_id = entity.escrowId;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.amount !== undefined) row.amount = entity.amount;
    if (entity.currency !== undefined) row.currency = entity.currency;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.metadata !== undefined) row.metadata = entity.metadata;
    if (entity.fromUserId !== undefined) row.from_user_id = entity.fromUserId;
    if (entity.toUserId !== undefined) row.to_user_id = entity.toUserId;

    return row;
  }

  /**
   * Find transactions by escrow
   * البحث عن معاملات بواسطة الضمان
   */
  async findByEscrow(escrowId: string): Promise<EscrowTransaction[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('escrow_id', escrowId)
        .order('created_at', { ascending: true });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, escrowId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, escrowId });
    }
  }

  /**
   * Create transaction
   * إنشاء معاملة
   */
  async createTransaction(transaction: Omit<EscrowTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<EscrowTransaction> {
    const now = new Date().toISOString();
    
    const result = await this.create({
      ...transaction,
      createdAt: now,
      updatedAt: now,
    });

    return result;
  }
}

// ============================================
// Singleton Instances
// ============================================

let escrowRepositoryInstance: EscrowRepository | null = null;
let escrowTransactionRepositoryInstance: EscrowTransactionRepository | null = null;

/**
 * Get the EscrowRepository singleton instance
 * الحصول على مثيل مستودع الضمان
 */
export function getEscrowRepository(): EscrowRepository {
  if (!escrowRepositoryInstance) {
    escrowRepositoryInstance = new EscrowRepository();
  }
  return escrowRepositoryInstance;
}

/**
 * Get the EscrowTransactionRepository singleton instance
 * الحصول على مثيل مستودع معاملات الضمان
 */
export function getEscrowTransactionRepository(): EscrowTransactionRepository {
  if (!escrowTransactionRepositoryInstance) {
    escrowTransactionRepositoryInstance = new EscrowTransactionRepository();
  }
  return escrowTransactionRepositoryInstance;
}
