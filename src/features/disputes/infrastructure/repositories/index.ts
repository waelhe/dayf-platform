/**
 * Dispute Infrastructure Repositories - Barrel Export
 * تصدير مستودعات بنية المنازعات
 */

export {
  // Repositories
  DisputeRepository,
  DisputeMessageRepository,
  DisputeTimelineRepository,
  // Singleton Getters
  getDisputeRepository,
  getDisputeMessageRepository,
  getDisputeTimelineRepository,
} from './dispute.repository';
