/**
 * Dispute Service - نظام المنازعات
 * 
 * يدير المنازعات بين المشترين والمزودين
 * يربط مع نظام الضمان لتنفيذ القرارات
 */

import { EscrowService } from '@/features/escrow/infrastructure/escrow-service';
import {
  getDisputeRepository,
  getDisputeMessageRepository,
  getDisputeTimelineRepository,
} from './repositories';
import type {
  Dispute,
  DisputeMessage,
  DisputeTimeline,
  DisputeWithDetails,
  DisputeStats,
} from '../domain/interfaces';
import { DisputeStatus, DisputeDecision, DisputeType } from '@/core/types/enums';

// ============================================
// Types
// ============================================

export interface CreateDisputeInput {
  escrowId: string;
  referenceType: 'BOOKING' | 'ORDER';
  referenceId: string;
  openedBy: string;
  againstUser: string;
  type: DisputeType;
  reason: string;
  description: string;
  attachments?: string[];
}

export interface DisputeResponse {
  id: string;
  escrowId: string;
  referenceType: string;
  referenceId: string;
  openedBy: string;
  againstUser: string;
  type: DisputeType;
  reason: string;
  description: string;
  status: DisputeStatus;
  decision: DisputeDecision | null;
  decisionReason: string | null;
  decidedBy: string | null;
  decidedAt: Date | string | null;
  escalatedAt: Date | string | null;
  resolvedAt: Date | string | null;
  closedAt: Date | string | null;
  createdAt: Date | string;
}

export interface DisputeWithDetailsResponse extends DisputeResponse {
  messages: {
    id: string;
    senderId: string;
    senderRole: string;
    message: string;
    attachments: string | null;
    isInternal: boolean;
    createdAt: Date | string;
  }[];
  timeline: {
    id: string;
    action: string;
    description: string;
    performedBy: string;
    performedByRole: string;
    createdAt: Date | string;
  }[];
  escrow: {
    id: string;
    buyerId: string;
    providerId: string;
    amount: number;
    currency: string;
    status: string;
  };
}

// ============================================
// Helper Functions
// ============================================

function toDisputeResponse(dispute: Dispute): DisputeResponse {
  return {
    id: dispute.id,
    escrowId: dispute.escrowId,
    referenceType: dispute.referenceType,
    referenceId: dispute.referenceId,
    openedBy: dispute.openedBy,
    againstUser: dispute.againstUser,
    type: dispute.type,
    reason: dispute.reason,
    description: dispute.description,
    status: dispute.status,
    decision: dispute.decision,
    decisionReason: dispute.decisionReason,
    decidedBy: dispute.decidedBy,
    decidedAt: dispute.decidedAt,
    escalatedAt: dispute.escalatedAt,
    resolvedAt: dispute.resolvedAt,
    closedAt: dispute.closedAt,
    createdAt: dispute.createdAt,
  };
}

function toDisputeWithDetailsResponse(dispute: DisputeWithDetails): DisputeWithDetailsResponse {
  return {
    ...toDisputeResponse(dispute),
    messages: dispute.messages.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      senderRole: msg.senderRole,
      message: msg.message,
      attachments: msg.attachments,
      isInternal: msg.isInternal,
      createdAt: msg.createdAt,
    })),
    timeline: dispute.timeline.map(t => ({
      id: t.id,
      action: t.action,
      description: t.description,
      performedBy: t.performedBy,
      performedByRole: t.performedByRole,
      createdAt: t.createdAt,
    })),
    escrow: dispute.escrow,
  };
}

// ============================================
// Dispute Service
// ============================================

export const DisputeService = {
  /**
   * إنشاء منازعة جديدة
   */
  async createDispute(input: CreateDisputeInput): Promise<DisputeResponse> {
    const disputeRepo = getDisputeRepository();
    const messageRepo = getDisputeMessageRepository();
    const timelineRepo = getDisputeTimelineRepository();

    // التحقق من وجود الضمان
    const escrow = await EscrowService.getEscrowById(input.escrowId);
    if (!escrow) {
      throw new Error('حساب الضمان غير موجود');
    }

    // التحقق من أن الضمان في حالة تسمح بالمنازعة
    if (!['FUNDED', 'DISPUTED'].includes(escrow.status)) {
      throw new Error('حساب الضمان لا يسمح بفتح منازعة');
    }

    // إنشاء المنازعة
    const dispute = await disputeRepo.create({
      escrowId: input.escrowId,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      openedBy: input.openedBy,
      againstUser: input.againstUser,
      type: input.type,
      reason: input.reason,
      description: input.description,
      status: DisputeStatus.OPEN,
      decision: null,
      decisionReason: null,
      decidedBy: null,
      decidedAt: null,
      escalatedAt: null,
      resolvedAt: null,
      closedAt: null,
    });

    // إضافة رسالة أولية إن وجدت مرفقات
    if (input.attachments && input.attachments.length > 0) {
      const senderRole = input.openedBy === escrow.buyerId ? 'BUYER' : 'PROVIDER';
      await messageRepo.create({
        disputeId: dispute.id,
        senderId: input.openedBy,
        senderRole,
        message: input.description,
        attachments: JSON.stringify(input.attachments),
        isInternal: false,
      });
    }

    // إضافة حدث للجدول الزمني
    const performedByRole = input.openedBy === escrow.buyerId ? 'BUYER' : 'PROVIDER';
    await timelineRepo.create({
      disputeId: dispute.id,
      action: 'OPENED',
      description: `تم فتح المنازعة: ${input.reason}`,
      performedBy: input.openedBy,
      performedByRole,
    });

    // تحديث حالة الضمان إلى DISPUTED
    await EscrowService.disputeEscrow(input.escrowId, `Dispute opened: ${input.reason}`);

    return toDisputeResponse(dispute);
  },

  /**
   * إضافة رسالة للمنازعة
   */
  async addMessage(
    disputeId: string,
    senderId: string,
    senderRole: 'BUYER' | 'PROVIDER' | 'ADMIN',
    message: string,
    attachments?: string[],
    isInternal: boolean = false
  ): Promise<void> {
    const disputeRepo = getDisputeRepository();
    const messageRepo = getDisputeMessageRepository();
    const timelineRepo = getDisputeTimelineRepository();

    const dispute = await disputeRepo.findById(disputeId);
    if (!dispute) {
      throw new Error('المنازعة غير موجودة');
    }

    if (![DisputeStatus.OPEN, DisputeStatus.IN_PROGRESS, DisputeStatus.ESCALATED].includes(dispute.status)) {
      throw new Error('لا يمكن إضافة رسائل لهذه المنازعة');
    }

    // إضافة الرسالة
    await messageRepo.create({
      disputeId,
      senderId,
      senderRole,
      message,
      attachments: attachments ? JSON.stringify(attachments) : null,
      isInternal,
    });

    // تحديث الحالة إلى IN_PROGRESS إن كانت OPEN
    if (dispute.status === DisputeStatus.OPEN) {
      await disputeRepo.update(disputeId, { status: DisputeStatus.IN_PROGRESS });
    }

    // إضافة حدث للجدول الزمني
    await timelineRepo.create({
      disputeId,
      action: 'RESPONDED',
      description: isInternal ? 'تمت إضافة ملاحظة داخلية' : 'تمت إضافة رد',
      performedBy: senderId,
      performedByRole: senderRole,
    });
  },

  /**
   * تصعيد المنازعة للإدارة
   */
  async escalateDispute(disputeId: string, userId: string, reason: string): Promise<DisputeResponse> {
    const disputeRepo = getDisputeRepository();
    const timelineRepo = getDisputeTimelineRepository();

    const dispute = await disputeRepo.findById(disputeId);
    if (!dispute) {
      throw new Error('المنازعة غير موجودة');
    }

    if (![DisputeStatus.OPEN, DisputeStatus.IN_PROGRESS].includes(dispute.status)) {
      throw new Error('لا يمكن تصعيد هذه المنازعة');
    }

    const now = new Date().toISOString();
    await disputeRepo.update(disputeId, {
      status: DisputeStatus.ESCALATED,
      escalatedAt: now,
    });

    // إضافة حدث للجدول الزمني
    const performedByRole = userId === dispute.openedBy ? 'BUYER' : 'PROVIDER';
    await timelineRepo.create({
      disputeId,
      action: 'ESCALATED',
      description: `تم تصعيد المنازعة: ${reason}`,
      performedBy: userId,
      performedByRole,
    });

    const updated = await disputeRepo.findById(disputeId);
    return toDisputeResponse(updated!);
  },

  /**
   * حل المنازعة (للمدير)
   */
  async resolveDispute(
    disputeId: string,
    adminId: string,
    decision: DisputeDecision,
    reason: string,
    splitAmount?: { buyerAmount: number; providerAmount: number }
  ): Promise<DisputeResponse> {
    const disputeRepo = getDisputeRepository();
    const timelineRepo = getDisputeTimelineRepository();

    const dispute = await disputeRepo.findWithDetails(disputeId);
    if (!dispute) {
      throw new Error('المنازعة غير موجودة');
    }

    if (dispute.status !== DisputeStatus.ESCALATED) {
      throw new Error('المنازعة يجب أن تكون مُصعّدة قبل الحل');
    }

    // تنفيذ القرار على الضمان
    switch (decision) {
      case DisputeDecision.BUYER_FAVOR:
        // استرداد كامل للمشتري
        await EscrowService.refundEscrow(dispute.escrowId, reason);
        break;

      case DisputeDecision.PROVIDER_FAVOR:
        // إطلاق المبلغ للمزود
        await EscrowService.releaseEscrow(dispute.escrowId, adminId, reason);
        break;

      case DisputeDecision.SPLIT:
        // تقسيم المبلغ (استرداد جزئي + إطلاق جزئي)
        if (splitAmount) {
          await EscrowService.refundEscrow(dispute.escrowId, reason, splitAmount.buyerAmount);
          // Note: في حالة التقسيم، نحتاج منطق إضافي للإطلاق الجزئي المتبقي
        }
        break;

      case DisputeDecision.NO_ACTION:
        // لا إجراء - إغلاق الضمان
        await EscrowService.cancelEscrow(dispute.escrowId, reason);
        break;
    }

    // تحديث المنازعة
    const now = new Date().toISOString();
    await disputeRepo.update(disputeId, {
      status: DisputeStatus.RESOLVED,
      decision,
      decisionReason: reason,
      decidedBy: adminId,
      decidedAt: now,
      resolvedAt: now,
    });

    // إضافة حدث للجدول الزمني
    await timelineRepo.create({
      disputeId,
      action: 'DECIDED',
      description: `تم اتخاذ القرار: ${this.getDecisionLabel(decision)} - ${reason}`,
      performedBy: adminId,
      performedByRole: 'ADMIN',
    });

    const updated = await disputeRepo.findById(disputeId);
    return toDisputeResponse(updated!);
  },

  /**
   * إغلاق المنازعة
   */
  async closeDispute(disputeId: string, userId: string, reason: string): Promise<DisputeResponse> {
    const disputeRepo = getDisputeRepository();
    const timelineRepo = getDisputeTimelineRepository();

    const dispute = await disputeRepo.findById(disputeId);
    if (!dispute) {
      throw new Error('المنازعة غير موجودة');
    }

    if (![DisputeStatus.OPEN, DisputeStatus.IN_PROGRESS, DisputeStatus.RESOLVED].includes(dispute.status)) {
      throw new Error('لا يمكن إغلاق هذه المنازعة');
    }

    const now = new Date().toISOString();
    await disputeRepo.update(disputeId, {
      status: DisputeStatus.CLOSED,
      closedAt: now,
    });

    // إضافة حدث للجدول الزمني
    await timelineRepo.create({
      disputeId,
      action: 'CLOSED',
      description: `تم إغلاق المنازعة: ${reason}`,
      performedBy: userId,
      performedByRole: 'SYSTEM',
    });

    const updated = await disputeRepo.findById(disputeId);
    return toDisputeResponse(updated!);
  },

  /**
   * الحصول على منازعة بالمعرف
   */
  async getDisputeById(disputeId: string): Promise<DisputeWithDetailsResponse | null> {
    const disputeRepo = getDisputeRepository();
    const dispute = await disputeRepo.findWithDetails(disputeId);
    return dispute ? toDisputeWithDetailsResponse(dispute) : null;
  },

  /**
   * قائمة منازعات المستخدم
   */
  async listUserDisputes(userId: string, status?: DisputeStatus): Promise<DisputeResponse[]> {
    const disputeRepo = getDisputeRepository();
    const disputes = await disputeRepo.findByUser(userId, status);
    return disputes.map(toDisputeResponse);
  },

  /**
   * قائمة كل المنازعات (للمدير)
   */
  async listAllDisputes(
    status?: DisputeStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<{ disputes: DisputeResponse[]; total: number }> {
    const disputeRepo = getDisputeRepository();

    const result = await disputeRepo.findManyPaginated({
      filters: status ? { status } : undefined,
      pagination: { page, limit },
      sort: { field: 'created_at', direction: 'desc' },
    });

    return {
      disputes: result.data.map(toDisputeResponse),
      total: result.total,
    };
  },

  /**
   * إحصائيات المنازعات
   */
  async getDisputeStats(): Promise<DisputeStats> {
    const disputeRepo = getDisputeRepository();
    return disputeRepo.getStats();
  },

  /**
   * تسمية القرار
   */
  getDecisionLabel(decision: DisputeDecision): string {
    const labels: Record<DisputeDecision, string> = {
      [DisputeDecision.BUYER_FAVOR]: 'لصالح المشتري',
      [DisputeDecision.PROVIDER_FAVOR]: 'لصالح المزود',
      [DisputeDecision.SPLIT]: 'تقسيم',
      [DisputeDecision.NO_ACTION]: 'لا إجراء',
    };
    return labels[decision];
  },

  /**
   * تسمية النوع
   */
  getTypeLabel(type: DisputeType): string {
    const labels: Record<DisputeType, string> = {
      [DisputeType.BOOKING_ISSUE]: 'مشكلة في الحجز',
      [DisputeType.PRODUCT_ISSUE]: 'مشكلة في المنتج',
      [DisputeType.PAYMENT_ISSUE]: 'مشكلة في الدفع',
      [DisputeType.SERVICE_QUALITY]: 'جودة الخدمة',
      [DisputeType.CANCELLATION]: 'إلغاء',
      [DisputeType.REFUND_REQUEST]: 'طلب استرداد',
      [DisputeType.OTHER]: 'أخرى',
    };
    return labels[type];
  },

  /**
   * تسمية الحالة
   */
  getStatusLabel(status: DisputeStatus): string {
    const labels: Record<DisputeStatus, string> = {
      [DisputeStatus.OPEN]: 'مفتوح',
      [DisputeStatus.IN_PROGRESS]: 'قيد المعالجة',
      [DisputeStatus.ESCALATED]: 'مُصعّد للإدارة',
      [DisputeStatus.RESOLVED]: 'تم الحل',
      [DisputeStatus.CLOSED]: 'مغلق',
    };
    return labels[status];
  },
};
