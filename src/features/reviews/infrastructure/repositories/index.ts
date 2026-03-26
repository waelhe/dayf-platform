/**
 * Review Infrastructure Repositories
 * مستودعات بنية المراجعات
 * 
 * Exports all review repository implementations.
 */

export {
  // Main Repository
  ReviewRepository,
  getReviewRepository,
  
  // Sub-Repositories
  ReviewPhotoRepository,
  getReviewPhotoRepository,
  ReviewHelpfulRepository,
  getReviewHelpfulRepository,
  ReviewReplyRepository,
  getReviewReplyRepository,
  ReviewerProfileRepository,
  getReviewerProfileRepository,
} from './review.repository';

// Re-export interfaces
export type {
  IReviewRepository,
  IReviewPhotoRepository,
  IReviewHelpfulRepository,
  IReviewReplyRepository,
  IReviewerProfileRepository,
} from '../../domain/interfaces';
