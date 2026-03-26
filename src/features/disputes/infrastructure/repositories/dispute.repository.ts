/**
 * Dispute Repository Implementation
 * تنفيذ مستودع المنازعات
 * 
 * Implements IDisputeRepository using Supabase as the data source.
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES } from '@/lib/supabase';
import type { 
  Dispute, 
  DisputeMessage, 
  DisputeTimeline,
  DisputeWithDetails,
  DisputeStats,
  IDisputeRepository, 
  IDisputeMessageRepository,
  IDisputeTimelineRepository 
} from '../../domain/interfaces';
import { DisputeStatus, DisputeType, DisputeDecision } from '@/core/types/enums';
import { DatabaseError } from '@/core/database';

// ============================================
// Supabase Types (snake_case)
// ============================================

/**
 * Supabase Dispute row type
 * صف المنازعة في Supabase
 */
interface SupabaseDispute {
  id: string;
  escrow_id: string;
  reference_type: string;
  reference_id: string;
  opened_by: string;
  against_user: string;
  type: string;
  reason: string;
  description: string;
  status: string;
  decision: string | null;
  decision_reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  escalated_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Dispute Message row type
 * صف رسالة المنازعة في Supabase
 */
interface SupabaseDisputeMessage {
  id: string;
  dispute_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  attachments: string | null;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Dispute Timeline row type
 * صف الجدول الزمني للمنازعة في Supabase
 */
interface SupabaseDisputeTimeline {
  id: string;
  dispute_id: string;
  action: string;
  description: string;
  performed_by: string;
  performed_by_role: string;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Escrow row type (for joins)
 * صف الضمان في Supabase
 */
interface SupabaseEscrowMinimal {
  id: string;
  buyer_id: string;
  provider_id: string;
  amount: number;
  currency: string;
  status: string;
}

// ============================================
// Dispute Repository
// ============================================

/**
 * Dispute Repository
 * مستودع المنازعات
 */
export class DisputeRepository extends BaseRepository<Dispute> implements IDisputeRepository {
  constructor() {
    super(TABLES.DISPUTES, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): Dispute {
    const dbRow = row as unknown as SupabaseDispute;
    
    return {
      id: dbRow.id,
      escrowId: dbRow.escrow_id,
      referenceType: dbRow.reference_type,
      referenceId: dbRow.reference_id,
      openedBy: dbRow.opened_by,
      againstUser: dbRow.against_user,
      type: dbRow.type as DisputeType,
      reason: dbRow.reason,
      description: dbRow.description,
      status: dbRow.status as DisputeStatus,
      decision: dbRow.decision as DisputeDecision | null,
      decisionReason: dbRow.decision_reason,
      decidedBy: dbRow.decided_by,
      decidedAt: dbRow.decided_at,
      escalatedAt: dbRow.escalated_at,
      resolvedAt: dbRow.resolved_at,
      closedAt: dbRow.closed_at,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<Dispute>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.escrowId !== undefined) row.escrow_id = entity.escrowId;
    if (entity.referenceType !== undefined) row.reference_type = entity.referenceType;
    if (entity.referenceId !== undefined) row.reference_id = entity.referenceId;
    if (entity.openedBy !== undefined) row.opened_by = entity.openedBy;
    if (entity.againstUser !== undefined) row.against_user = entity.againstUser;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.reason !== undefined) row.reason = entity.reason;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.decision !== undefined) row.decision = entity.decision;
    if (entity.decisionReason !== undefined) row.decision_reason = entity.decisionReason;
    if (entity.decidedBy !== undefined) row.decided_by = entity.decidedBy;
    if (entity.decidedAt !== undefined) row.decided_at = entity.decidedAt;
    if (entity.escalatedAt !== undefined) row.escalated_at = entity.escalatedAt;
    if (entity.resolvedAt !== undefined) row.resolved_at = entity.resolvedAt;
    if (entity.closedAt !== undefined) row.closed_at = entity.closedAt;

    return row;
  }

  // ============================================
  // Dispute-Specific Repository Methods
  // ============================================

  /**
   * Find dispute by ID with all details
   * البحث عن منازعة بالمعرف مع كل التفاصيل
   */
  async findWithDetails(disputeId: string): Promise<DisputeWithDetails | null> {
    try {
      const client = this.getClient();
      
      // Get dispute
      const dispute = await this.findById(disputeId);
      if (!dispute) return null;

      // Get messages
      const { data: messages, error: msgError } = await client
        .from(TABLES.DISPUTE_MESSAGES)
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: true });

      if (msgError) {
        throw DatabaseError.fromError(msgError, { table: TABLES.DISPUTE_MESSAGES, disputeId });
      }

      // Get timeline
      const { data: timeline, error: timelineError } = await client
        .from(TABLES.DISPUTE_TIMELINE)
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: true });

      if (timelineError) {
        throw DatabaseError.fromError(timelineError, { table: TABLES.DISPUTE_TIMELINE, disputeId });
      }

      // Get escrow
      const { data: escrow, error: escrowError } = await client
        .from(TABLES.ESCROWS)
        .select('id, buyer_id, provider_id, amount, currency, status')
        .eq('id', dispute.escrowId)
        .single();

      if (escrowError) {
        throw DatabaseError.fromError(escrowError, { table: TABLES.ESCROWS, escrowId: dispute.escrowId });
      }

      return {
        ...dispute,
        messages: (messages || []).map(msg => this.toMessageEntity(msg)),
        timeline: (timeline || []).map(t => this.toTimelineEntity(t)),
        escrow: {
          id: escrow.id,
          buyerId: escrow.buyer_id,
          providerId: escrow.provider_id,
          amount: escrow.amount,
          currency: escrow.currency,
          status: escrow.status,
        },
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, disputeId });
    }
  }

  /**
   * Find disputes by user (either opened by or against)
   * البحث عن منازعات المستخدم
   */
  async findByUser(userId: string, status?: DisputeStatus): Promise<Dispute[]> {
    try {
      const client = this.getClient();
      let query = client
        .from(this.tableName)
        .select('*')
        .or(`opened_by.eq.${userId},against_user.eq.${userId}`);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, userId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId });
    }
  }

  /**
   * Find disputes by status
   * البحث عن منازعات بحالة معينة
   */
  async findByStatus(status: DisputeStatus): Promise<Dispute[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, status });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, status });
    }
  }

  /**
   * Find disputes by escrow
   * البحث عن منازعات بواسطة الضمان
   */
  async findByEscrow(escrowId: string): Promise<Dispute[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('escrow_id', escrowId)
        .order('created_at', { ascending: false });

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
   * Update dispute status
   * تحديث حالة المنازعة
   */
  async updateStatus(disputeId: string, status: DisputeStatus, updates?: Partial<Dispute>): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const updateData: Record<string, unknown> = {
        status,
        updated_at: now,
      };

      // Handle additional updates
      if (updates?.escalatedAt !== undefined) updateData.escalated_at = updates.escalatedAt;
      if (updates?.resolvedAt !== undefined) updateData.resolved_at = updates.resolvedAt;
      if (updates?.closedAt !== undefined) updateData.closed_at = updates.closedAt;
      if (updates?.decision !== undefined) updateData.decision = updates.decision;
      if (updates?.decisionReason !== undefined) updateData.decision_reason = updates.decisionReason;
      if (updates?.decidedBy !== undefined) updateData.decided_by = updates.decidedBy;
      if (updates?.decidedAt !== undefined) updateData.decided_at = updates.decidedAt;

      const { error } = await client
        .from(this.tableName)
        .update(updateData)
        .eq('id', disputeId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, disputeId, operation: 'updateStatus' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, disputeId, operation: 'updateStatus' });
    }
  }

  /**
   * Get dispute statistics
   * الحصول على إحصائيات المنازعات
   */
  async getStats(): Promise<DisputeStats> {
    try {
      const client = this.getClient();

      // Get counts by status
      const [
        totalResult,
        openResult,
        inProgressResult,
        escalatedResult,
        resolvedResult,
        closedResult,
        byTypeResult
      ] = await Promise.all([
        client.from(this.tableName).select('*', { count: 'exact', head: true }),
        client.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', DisputeStatus.OPEN),
        client.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', DisputeStatus.IN_PROGRESS),
        client.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', DisputeStatus.ESCALATED),
        client.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', DisputeStatus.RESOLVED),
        client.from(this.tableName).select('*', { count: 'exact', head: true }).eq('status', DisputeStatus.CLOSED),
        client.from(this.tableName).select('type'),
      ]);

      // Count by type
      const byTypeMap: Record<string, number> = {};
      if (byTypeResult.data) {
        for (const row of byTypeResult.data) {
          const type = row.type as string;
          byTypeMap[type] = (byTypeMap[type] || 0) + 1;
        }
      }

      return {
        total: totalResult.count || 0,
        open: openResult.count || 0,
        inProgress: inProgressResult.count || 0,
        escalated: escalatedResult.count || 0,
        resolved: resolvedResult.count || 0,
        closed: closedResult.count || 0,
        byType: byTypeMap,
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, operation: 'getStats' });
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private toMessageEntity(row: Record<string, unknown>): DisputeMessage {
    const dbRow = row as unknown as SupabaseDisputeMessage;
    return {
      id: dbRow.id,
      disputeId: dbRow.dispute_id,
      senderId: dbRow.sender_id,
      senderRole: dbRow.sender_role,
      message: dbRow.message,
      attachments: dbRow.attachments,
      isInternal: dbRow.is_internal,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  private toTimelineEntity(row: Record<string, unknown>): DisputeTimeline {
    const dbRow = row as unknown as SupabaseDisputeTimeline;
    return {
      id: dbRow.id,
      disputeId: dbRow.dispute_id,
      action: dbRow.action,
      description: dbRow.description,
      performedBy: dbRow.performed_by,
      performedByRole: dbRow.performed_by_role,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }
}

// ============================================
// Dispute Message Repository
// ============================================

/**
 * Dispute Message Repository
 * مستودع رسائل المنازعات
 */
export class DisputeMessageRepository extends BaseRepository<DisputeMessage> implements IDisputeMessageRepository {
  constructor() {
    super(TABLES.DISPUTE_MESSAGES, getSupabaseProvider());
  }

  protected override toEntity(row: Record<string, unknown>): DisputeMessage {
    const dbRow = row as unknown as SupabaseDisputeMessage;
    return {
      id: dbRow.id,
      disputeId: dbRow.dispute_id,
      senderId: dbRow.sender_id,
      senderRole: dbRow.sender_role,
      message: dbRow.message,
      attachments: dbRow.attachments,
      isInternal: dbRow.is_internal,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<DisputeMessage>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.disputeId !== undefined) row.dispute_id = entity.disputeId;
    if (entity.senderId !== undefined) row.sender_id = entity.senderId;
    if (entity.senderRole !== undefined) row.sender_role = entity.senderRole;
    if (entity.message !== undefined) row.message = entity.message;
    if (entity.attachments !== undefined) row.attachments = entity.attachments;
    if (entity.isInternal !== undefined) row.is_internal = entity.isInternal;

    return row;
  }

  /**
   * Find messages by dispute
   * البحث عن رسائل بواسطة المنازعة
   */
  async findByDispute(disputeId: string): Promise<DisputeMessage[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: true });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, disputeId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, disputeId });
    }
  }

  /**
   * Create message
   * إنشاء رسالة
   */
  async createMessage(message: Omit<DisputeMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<DisputeMessage> {
    const result = await this.create({
      ...message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return result;
  }
}

// ============================================
// Dispute Timeline Repository
// ============================================

/**
 * Dispute Timeline Repository
 * مستودع الجدول الزمني للمنازعات
 */
export class DisputeTimelineRepository extends BaseRepository<DisputeTimeline> implements IDisputeTimelineRepository {
  constructor() {
    super(TABLES.DISPUTE_TIMELINE, getSupabaseProvider());
  }

  protected override toEntity(row: Record<string, unknown>): DisputeTimeline {
    const dbRow = row as unknown as SupabaseDisputeTimeline;
    return {
      id: dbRow.id,
      disputeId: dbRow.dispute_id,
      action: dbRow.action,
      description: dbRow.description,
      performedBy: dbRow.performed_by,
      performedByRole: dbRow.performed_by_role,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<DisputeTimeline>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.disputeId !== undefined) row.dispute_id = entity.disputeId;
    if (entity.action !== undefined) row.action = entity.action;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.performedBy !== undefined) row.performed_by = entity.performedBy;
    if (entity.performedByRole !== undefined) row.performed_by_role = entity.performedByRole;

    return row;
  }

  /**
   * Find timeline events by dispute
   * البحث عن أحداث الجدول الزمني بواسطة المنازعة
   */
  async findByDispute(disputeId: string): Promise<DisputeTimeline[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('dispute_id', disputeId)
        .order('created_at', { ascending: true });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, disputeId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, disputeId });
    }
  }

  /**
   * Create timeline event
   * إنشاء حدث في الجدول الزمني
   */
  async createEvent(event: Omit<DisputeTimeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<DisputeTimeline> {
    const result = await this.create({
      ...event,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return result;
  }
}

// ============================================
// Singleton Instances
// ============================================

let disputeRepositoryInstance: DisputeRepository | null = null;
let disputeMessageRepositoryInstance: DisputeMessageRepository | null = null;
let disputeTimelineRepositoryInstance: DisputeTimelineRepository | null = null;

/**
 * Get the DisputeRepository singleton instance
 * الحصول على مثيل مستودع المنازعات
 */
export function getDisputeRepository(): DisputeRepository {
  if (!disputeRepositoryInstance) {
    disputeRepositoryInstance = new DisputeRepository();
  }
  return disputeRepositoryInstance;
}

/**
 * Get the DisputeMessageRepository singleton instance
 * الحصول على مثيل مستودع رسائل المنازعات
 */
export function getDisputeMessageRepository(): DisputeMessageRepository {
  if (!disputeMessageRepositoryInstance) {
    disputeMessageRepositoryInstance = new DisputeMessageRepository();
  }
  return disputeMessageRepositoryInstance;
}

/**
 * Get the DisputeTimelineRepository singleton instance
 * الحصول على مثيل مستودع الجدول الزمني للمنازعات
 */
export function getDisputeTimelineRepository(): DisputeTimelineRepository {
  if (!disputeTimelineRepositoryInstance) {
    disputeTimelineRepositoryInstance = new DisputeTimelineRepository();
  }
  return disputeTimelineRepositoryInstance;
}
