/**
 * Reviews Feature - نظام المراجعات
 * 
 * تصدير جميع المكونات والأنواع والخدمات
 */

// Types
export * from './types';

// Components - use explicit re-exports to avoid name conflicts with ReviewStats type
export { RatingStars } from './components/RatingStars';
export { ReviewCard } from './components/ReviewCard';
export { ReviewStats as ReviewStatsComponent } from './components/ReviewStats';
export { ReviewList } from './components/ReviewList';
export { ReviewForm } from './components/ReviewForm';
export { default as ReviewsHighlights } from './components/ReviewsHighlights';

// Services (for server-side use only)
export * from './infrastructure/review-service';
