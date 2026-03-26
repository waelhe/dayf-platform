/**
 * Escrow Repository Interface
 * واجهة مستودع الضمان
 * 
 * Defines the contract for escrow data access operations.
 */

import type { IRepository, BaseEntity } from '@/core/database';
import { EscrowStatus, EscrowTransactionType } from '@/core/types/enums';

export { EscrowStatus, EscrowTransactionType };

/**
 * Escrow entity interface
 * واجهة كيان الضمان
 */
export interface Escrow extends BaseEntity {
  /** Buyer (payer) ID */
  buyerId: string;
  
  /** Provider (recipient) ID */
  providerId: string;
  
  /** Total amount held */
  amount: number;
  
  /** Platform fee */
  platformFee: number;
  
  /** Amount after fee */
  netAmount: number;
  
  /** Currency code */
  currency: string;
  
  /** Escrow status */
  status: EscrowStatus;
  
  /** Reference type (BOOKING, ORDER, ACTIVITY) */
  referenceType: string;
  
  /** Reference ID */
  referenceId: string;
  
  /** When funded */
  fundedAt: Date | string | null;
  
  /** When released */
  releasedAt: Date | string | null;
  
  /** When refunded */
  refundedAt: Date | string | null;
  
  /** Auto release date */
  autoReleaseAt: Date | string | null;
  
  /** Notes */
  notes: string | null;
  
  /** Release notes */
  releaseNotes: string | null;
  
  /** Refund reason */
  refundReason: string | null;
}

/**
 * Escrow transaction entity
 * كيان معاملة الضمان
 */
export interface EscrowTransaction extends BaseEntity {
  /** Escrow ID */
  escrowId: string;
  
  /** Transaction type */
  type: EscrowTransactionType;
  
  /** Amount */
  amount: number;
  
  /** Currency */
  currency: string;
  
  /** Description */
  description: string | null;
  
  /** Metadata JSON */
  metadata: string | null;
  
  /** Sender user ID */
  fromUserId: string | null;
  
  /** Recipient user ID */
  toUserId: string | null;
}

/**
 * Escrow with transactions
 * الضمان مع المعاملات
 */
export interface EscrowWithTransactions extends Escrow {
  transactions: EscrowTransaction[];
}

/**
 * Escrow stats for user
 * إحصائيات الضمان للمستخدم
 */
export interface EscrowUserStats {
  asBuyer: {
    total: number;
    pending: number;
    funded: number;
    released: number;
    refunded: number;
    totalAmount: number;
  };
  asProvider: {
    total: number;
    pending: number;
    funded: number;
    released: number;
    totalEarnings: number;
  };
}

/**
 * Escrow Repository Interface
 * واجهة مستودع الضمان
 */
export interface IEscrowRepository extends IRepository<Escrow> {
  /**
   * Find escrow by reference
   * البحث عن ضمان بالمرجع
   */
  findByReference(referenceType: string, referenceId: string): Promise<Escrow | null>;

  /**
   * Find escrow with transactions
   * البحث عن ضمان مع المعاملات
   */
  findWithTransactions(escrowId: string): Promise<EscrowWithTransactions | null>;

  /**
   * Find escrows by buyer
   * البحث عن ضمانات المشتري
   */
  findByBuyer(buyerId: string, status?: EscrowStatus): Promise<Escrow[]>;

  /**
   * Find escrows by provider
   * البحث عن ضمانات المزود
   */
  findByProvider(providerId: string, status?: EscrowStatus): Promise<Escrow[]>;

  /**
   * Find escrows ready for auto-release
   * البحث عن ضمانات جاهزة للإطلاق التلقائي
   */
  findReadyForAutoRelease(): Promise<Escrow[]>;

  /**
   * Update escrow status
   * تحديث حالة الضمان
   */
  updateStatus(escrowId: string, status: EscrowStatus, updates?: Partial<Escrow>): Promise<void>;

  /**
   * Get user escrow stats
   * الحصول على إحصائيات الضمان للمستخدم
   */
  getUserStats(userId: string): Promise<EscrowUserStats>;
}

/**
 * Escrow Transaction Repository Interface
 * واجهة مستودع معاملات الضمان
 */
export interface IEscrowTransactionRepository extends IRepository<EscrowTransaction> {
  /**
   * Find transactions by escrow
   * البحث عن معاملات بواسطة الضمان
   */
  findByEscrow(escrowId: string): Promise<EscrowTransaction[]>;

  /**
   * Create transaction
   * إنشاء معاملة
   */
  createTransaction(transaction: Omit<EscrowTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<EscrowTransaction>;
}
