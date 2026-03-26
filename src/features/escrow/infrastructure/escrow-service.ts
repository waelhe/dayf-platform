/**
 * Escrow Service - نظام الضمان المالي
 * 
 * يدير حسابات الضمان للحجوزات والطلبات
 * يضمن حماية المشتري والبائع
 * 
 * تم تحديثه لاستخدام Repository Pattern
 */

import { getEscrowRepository, getEscrowTransactionRepository } from './repositories';
import { EscrowStatus, EscrowTransactionType } from '@/core/types/enums';

// ============================================
// Types
// ============================================

export interface CreateEscrowInput {
  buyerId: string;
  providerId: string;
  amount: number;
  platformFee?: number;
  currency?: string;
  referenceType: 'BOOKING' | 'ORDER' | 'ACTIVITY';
  referenceId: string;
  notes?: string;
}

export interface EscrowResponse {
  id: string;
  buyerId: string;
  providerId: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: EscrowStatus;
  referenceType: string;
  referenceId: string;
  fundedAt: Date | string | null;
  releasedAt: Date | string | null;
  refundedAt: Date | string | null;
  autoReleaseAt: Date | string | null;
  notes: string | null;
  createdAt: Date | string;
}

export interface EscrowWithTransactions extends EscrowResponse {
  transactions: {
    id: string;
    type: EscrowTransactionType;
    amount: number;
    currency: string;
    description: string | null;
    createdAt: Date | string;
  }[];
}

// ============================================
// Constants
// ============================================

// نسبة رسوم المنصة (5%)
const PLATFORM_FEE_PERCENTAGE = 0.05;

// فترة الإطلاق التلقائي (7 أيام بعد اكتمال الخدمة)
const AUTO_RELEASE_DAYS = 7;

// ============================================
// Escrow Service
// ============================================

export const EscrowService = {
  /**
   * إنشاء حساب ضمان جديد
   */
  async createEscrow(input: CreateEscrowInput): Promise<EscrowResponse> {
    const escrowRepo = getEscrowRepository();
    
    const platformFee = input.platformFee ?? (input.amount * PLATFORM_FEE_PERCENTAGE);
    const netAmount = input.amount - platformFee;

    const escrow = await escrowRepo.create({
      buyerId: input.buyerId,
      providerId: input.providerId,
      amount: input.amount,
      platformFee,
      netAmount,
      currency: input.currency ?? 'SYP',
      status: EscrowStatus.PENDING,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      notes: input.notes || null,
      fundedAt: null,
      releasedAt: null,
      refundedAt: null,
      autoReleaseAt: null,
      releaseNotes: null,
      refundReason: null,
    });

    return escrow;
  },

  /**
   * تمويل حساب الضمان (عند الدفع)
   */
  async fundEscrow(
    escrowId: string,
    paymentMetadata?: Record<string, unknown>
  ): Promise<EscrowResponse> {
    const escrowRepo = getEscrowRepository();
    const txRepo = getEscrowTransactionRepository();

    const escrow = await escrowRepo.findById(escrowId);

    if (!escrow) {
      throw new Error('حساب الضمان غير موجود');
    }

    if (escrow.status !== EscrowStatus.PENDING) {
      throw new Error('حساب الضمان ليس في حالة الانتظار');
    }

    // حساب تاريخ الإطلاق التلقائي
    const autoReleaseAt = new Date();
    autoReleaseAt.setDate(autoReleaseAt.getDate() + AUTO_RELEASE_DAYS);
    const now = new Date().toISOString();

    // Update escrow status
    await escrowRepo.updateStatus(escrowId, EscrowStatus.FUNDED, {
      fundedAt: now,
      autoReleaseAt: autoReleaseAt.toISOString(),
    });

    // تسجيل معاملة التمويل
    await txRepo.createTransaction({
      escrowId,
      type: EscrowTransactionType.FUND,
      amount: escrow.amount,
      currency: escrow.currency,
      description: 'تمويل حساب الضمان',
      metadata: paymentMetadata ? JSON.stringify(paymentMetadata) : null,
      fromUserId: escrow.buyerId,
      toUserId: null,
    });

    // تسجيل معاملة الرسوم
    if (escrow.platformFee > 0) {
      await txRepo.createTransaction({
        escrowId,
        type: EscrowTransactionType.FEE,
        amount: escrow.platformFee,
        currency: escrow.currency,
        description: 'رسوم المنصة',
        metadata: null,
        fromUserId: null,
        toUserId: null,
      });
    }

    const updated = await escrowRepo.findById(escrowId);
    if (!updated) throw new Error('Escrow not found after update');
    
    return updated;
  },

  /**
   * إطلاق المبلغ للمزود (عند اكتمال الخدمة)
   */
  async releaseEscrow(
    escrowId: string,
    _releasedBy: string,
    notes?: string
  ): Promise<EscrowResponse> {
    const escrowRepo = getEscrowRepository();
    const txRepo = getEscrowTransactionRepository();

    const escrow = await escrowRepo.findById(escrowId);

    if (!escrow) {
      throw new Error('حساب الضمان غير موجود');
    }

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new Error('حساب الضمان ليس في حالة التمويل');
    }

    const now = new Date().toISOString();

    await escrowRepo.updateStatus(escrowId, EscrowStatus.RELEASED, {
      releasedAt: now,
      releaseNotes: notes || null,
    });

    // تسجيل معاملة الإطلاق
    await txRepo.createTransaction({
      escrowId,
      type: EscrowTransactionType.RELEASE,
      amount: escrow.netAmount,
      currency: escrow.currency,
      description: notes ?? 'إطلاق المبلغ للمزود',
      metadata: null,
      fromUserId: null,
      toUserId: escrow.providerId,
    });

    const updated = await escrowRepo.findById(escrowId);
    if (!updated) throw new Error('Escrow not found after update');
    
    return updated;
  },

  /**
   * استرداد المبلغ للمشتري
   */
  async refundEscrow(
    escrowId: string,
    refundReason: string,
    partialAmount?: number
  ): Promise<EscrowResponse> {
    const escrowRepo = getEscrowRepository();
    const txRepo = getEscrowTransactionRepository();

    const escrow = await escrowRepo.findById(escrowId);

    if (!escrow) {
      throw new Error('حساب الضمان غير موجود');
    }

    if (![EscrowStatus.FUNDED, EscrowStatus.DISPUTED].includes(escrow.status)) {
      throw new Error('حساب الضمان لا يمكن استرداده');
    }

    const isPartial = partialAmount && partialAmount < escrow.amount;
    const refundAmount = partialAmount ?? escrow.amount;
    const now = new Date().toISOString();

    await escrowRepo.updateStatus(escrowId, isPartial ? escrow.status : EscrowStatus.REFUNDED, {
      refundedAt: isPartial ? null : now,
      refundReason,
    });

    // تسجيل معاملة الاسترداد
    await txRepo.createTransaction({
      escrowId,
      type: isPartial ? EscrowTransactionType.PARTIAL_REFUND : EscrowTransactionType.REFUND,
      amount: refundAmount,
      currency: escrow.currency,
      description: refundReason,
      metadata: null,
      fromUserId: null,
      toUserId: escrow.buyerId,
    });

    const updated = await escrowRepo.findById(escrowId);
    if (!updated) throw new Error('Escrow not found after update');
    
    return updated;
  },

  /**
   * وضع الضمان في حالة نزاع
   */
  async disputeEscrow(escrowId: string, reason: string): Promise<EscrowResponse> {
    const escrowRepo = getEscrowRepository();

    const escrow = await escrowRepo.findById(escrowId);

    if (!escrow) {
      throw new Error('حساب الضمان غير موجود');
    }

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new Error('حساب الضمان ليس في حالة التمويل');
    }

    await escrowRepo.updateStatus(escrowId, EscrowStatus.DISPUTED, {
      notes: reason,
    });

    const updated = await escrowRepo.findById(escrowId);
    if (!updated) throw new Error('Escrow not found after update');
    
    return updated;
  },

  /**
   * إلغاء الضمان
   */
  async cancelEscrow(escrowId: string, reason: string): Promise<EscrowResponse> {
    const escrowRepo = getEscrowRepository();

    const escrow = await escrowRepo.findById(escrowId);

    if (!escrow) {
      throw new Error('حساب الضمان غير موجود');
    }

    if (![EscrowStatus.PENDING, EscrowStatus.FUNDED].includes(escrow.status)) {
      throw new Error('حساب الضمان لا يمكن إلغاؤه');
    }

    // إذا كان ممولاً، نسترد المبلغ
    if (escrow.status === EscrowStatus.FUNDED) {
      return this.refundEscrow(escrowId, reason);
    }

    await escrowRepo.updateStatus(escrowId, EscrowStatus.CANCELLED, {
      notes: reason,
    });

    const updated = await escrowRepo.findById(escrowId);
    if (!updated) throw new Error('Escrow not found after update');
    
    return updated;
  },

  /**
   * الحصول على ضمان بالمعرف
   */
  async getEscrowById(escrowId: string): Promise<EscrowWithTransactions | null> {
    const escrowRepo = getEscrowRepository();
    const txRepo = getEscrowTransactionRepository();

    const escrow = await escrowRepo.findById(escrowId);
    if (!escrow) return null;

    const transactions = await txRepo.findByEscrow(escrowId);

    return {
      ...escrow,
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
    };
  },

  /**
   * الحصول على ضمان بالمرجع
   */
  async getEscrowByReference(
    referenceType: string,
    referenceId: string
  ): Promise<EscrowResponse | null> {
    const escrowRepo = getEscrowRepository();
    return escrowRepo.findByReference(referenceType, referenceId);
  },

  /**
   * قائمة ضمانات المشتري
   */
  async listBuyerEscrows(
    buyerId: string,
    status?: EscrowStatus
  ): Promise<EscrowResponse[]> {
    const escrowRepo = getEscrowRepository();
    return escrowRepo.findByBuyer(buyerId, status);
  },

  /**
   * قائمة ضمانات المزود
   */
  async listProviderEscrows(
    providerId: string,
    status?: EscrowStatus
  ): Promise<EscrowResponse[]> {
    const escrowRepo = getEscrowRepository();
    return escrowRepo.findByProvider(providerId, status);
  },

  /**
   * الإطلاق التلقائي للضمانات المنتهية
   */
  async processAutoRelease(): Promise<number> {
    const escrowRepo = getEscrowRepository();

    const escrowsToRelease = await escrowRepo.findReadyForAutoRelease();

    let releasedCount = 0;

    for (const escrow of escrowsToRelease) {
      try {
        await this.releaseEscrow(
          escrow.id,
          'system',
          'إطلاق تلقائي بعد انتهاء فترة الانتظار'
        );
        releasedCount++;
      } catch (error) {
        console.error(`Failed to auto-release escrow ${escrow.id}:`, error);
      }
    }

    return releasedCount;
  },

  /**
   * إحصائيات الضمان للمستخدم
   */
  async getUserEscrowStats(userId: string) {
    const escrowRepo = getEscrowRepository();
    return escrowRepo.getUserStats(userId);
  },
};
