/**
 * Dispute Repository Interface
 * واجهة مستودع المنازعات
 * 
 * Defines the contract for dispute data access operations.
 */

import type { IRepository, BaseEntity } from '@/core/database';
import { DisputeType, DisputeStatus, DisputeDecision } from '@/core/types/enums';

export { DisputeType, DisputeStatus, DisputeDecision };

/**
 * Dispute entity interface
 * واجهة كيان المنازعة
 */
export interface Dispute extends BaseEntity {
  /** Escrow ID */
  escrowId: string;
  
  /** Reference type (BOOKING, ORDER) */
  referenceType: string;
  
  /** Reference ID */
  referenceId: string;
  
  /** User who opened the dispute */
  openedBy: string;
  
  /** User against whom the dispute is opened */
  againstUser: string;
  
  /** Dispute type */
  type: DisputeType;
  
  /** Short reason */
  reason: string;
  
  /** Detailed description */
  description: string;
  
  /** Dispute status */
  status: DisputeStatus;
  
  /** Decision made */
  decision: DisputeDecision | null;
  
  /** Decision reason */
  decisionReason: string | null;
  
  /** Admin who made the decision */
  decidedBy: string | null;
  
  /** When decision was made */
  decidedAt: Date | string | null;
  
  /** When escalated */
  escalatedAt: Date | string | null;
  
  /** When resolved */
  resolvedAt: Date | string | null;
  
  /** When closed */
  closedAt: Date | string | null;
}

/**
 * Dispute message entity
 * كيان رسالة المنازعة
 */
export interface DisputeMessage extends BaseEntity {
  /** Dispute ID */
  disputeId: string;
  
  /** Sender user ID */
  senderId: string;
  
  /** Sender role (BUYER, PROVIDER, ADMIN) */
  senderRole: string;
  
  /** Message content */
  message: string;
  
  /** Attachments JSON */
  attachments: string | null;
  
  /** Is internal note */
  isInternal: boolean;
}

/**
 * Dispute timeline entity
 * كيان الجدول الزمني للمنازعة
 */
export interface DisputeTimeline extends BaseEntity {
  /** Dispute ID */
  disputeId: string;
  
  /** Action type */
  action: string;
  
  /** Action description */
  description: string;
  
  /** User who performed the action */
  performedBy: string;
  
  /** Role of the performer */
  performedByRole: string;
}

/**
 * Dispute with related data
 * المنازعة مع البيانات المرتبطة
 */
export interface DisputeWithDetails extends Dispute {
  messages: DisputeMessage[];
  timeline: DisputeTimeline[];
  escrow: {
    id: string;
    buyerId: string;
    providerId: string;
    amount: number;
    currency: string;
    status: string;
  };
}

/**
 * Dispute stats
 * إحصائيات المنازعات
 */
export interface DisputeStats {
  total: number;
  open: number;
  inProgress: number;
  escalated: number;
  resolved: number;
  closed: number;
  byType: Record<string, number>;
}

/**
 * Dispute Repository Interface
 * واجهة مستودع المنازعات
 */
export interface IDisputeRepository extends IRepository<Dispute> {
  /**
   * Find dispute by ID with all details
   * البحث عن منازعة بالمعرف مع كل التفاصيل
   */
  findWithDetails(disputeId: string): Promise<DisputeWithDetails | null>;

  /**
   * Find disputes by user (either opened by or against)
   * البحث عن منازعات المستخدم
   */
  findByUser(userId: string, status?: DisputeStatus): Promise<Dispute[]>;

  /**
   * Find disputes by status
   * البحث عن منازعات بحالة معينة
   */
  findByStatus(status: DisputeStatus): Promise<Dispute[]>;

  /**
   * Find disputes by escrow
   * البحث عن منازعات بواسطة الضمان
   */
  findByEscrow(escrowId: string): Promise<Dispute[]>;

  /**
   * Update dispute status
   * تحديث حالة المنازعة
   */
  updateStatus(disputeId: string, status: DisputeStatus, updates?: Partial<Dispute>): Promise<void>;

  /**
   * Get dispute statistics
   * الحصول على إحصائيات المنازعات
   */
  getStats(): Promise<DisputeStats>;
}

/**
 * Dispute Message Repository Interface
 * واجهة مستودع رسائل المنازعات
 */
export interface IDisputeMessageRepository extends IRepository<DisputeMessage> {
  /**
   * Find messages by dispute
   * البحث عن رسائل بواسطة المنازعة
   */
  findByDispute(disputeId: string): Promise<DisputeMessage[]>;

  /**
   * Create message
   * إنشاء رسالة
   */
  createMessage(message: Omit<DisputeMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<DisputeMessage>;
}

/**
 * Dispute Timeline Repository Interface
 * واجهة مستودع الجدول الزمني للمنازعات
 */
export interface IDisputeTimelineRepository extends IRepository<DisputeTimeline> {
  /**
   * Find timeline events by dispute
   * البحث عن أحداث الجدول الزمني بواسطة المنازعة
   */
  findByDispute(disputeId: string): Promise<DisputeTimeline[]>;

  /**
   * Create timeline event
   * إنشاء حدث في الجدول الزمني
   */
  createEvent(event: Omit<DisputeTimeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<DisputeTimeline>;
}
