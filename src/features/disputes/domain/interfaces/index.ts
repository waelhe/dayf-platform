/**
 * Dispute Domain Interfaces - Barrel Export
 * تصدير واجهات نطاق المنازعات
 */

export {
  // Enums
  DisputeType,
  DisputeStatus,
  DisputeDecision,
  // Entities
  type Dispute,
  type DisputeMessage,
  type DisputeTimeline,
  type DisputeWithDetails,
  type DisputeStats,
  // Repository Interfaces
  type IDisputeRepository,
  type IDisputeMessageRepository,
  type IDisputeTimelineRepository,
} from './dispute.repository.interface';
