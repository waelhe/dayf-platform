/**
 * Community Infrastructure Repositories
 * مستودعات البنية التحتية للمجتمع
 * 
 * Exports all community repository implementations.
 */

export {
  TopicRepository,
  ReplyRepository,
  getTopicRepository,
  getReplyRepository,
} from './community.repository';

// Re-export types for convenience
export type {
  Topic,
  TopicWithAuthor,
  ReplyEntity,
  ReplyWithAuthor,
  TopicFilters,
  ITopicRepository,
  IReplyRepository,
} from '../../domain/interfaces';
