'use client';

/**
 * ReviewCard - بطاقة عرض المراجعة
 * 
 * يدعم:
 * - شارة "حجز موثق" للمراجعات الموثقة
 * - عرض مرحلة السفر (قبل/أثناء/بعد)
 * - مستوى المراجع
 * - التفاعلات (مفيد، رد)
 */

import { useState } from 'react';
import { ThumbsUp, MessageCircle, Check, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RatingStars } from './RatingStars';
import type { ReviewWithRelations } from '../types';
import { REVIEWER_LEVELS, RATING_CRITERIA, TRAVEL_PHASES, type TravelPhase } from '../types';

interface ReviewCardProps {
  review: ReviewWithRelations;
  currentUserId?: string;
  onHelpful?: (reviewId: string, isHelpful: boolean) => void;
  onReply?: (reviewId: string) => void;
  className?: string;
  showSource?: boolean; // عرض مصدر المراجعة
}

export function ReviewCard({
  review,
  currentUserId,
  onHelpful,
  onReply,
  className,
  showSource = false,
}: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = review.content.length > 300;
  const displayContent = shouldTruncate && !isExpanded
    ? review.content.slice(0, 300) + '...'
    : review.content;

  // الحصول على معلومات المستوى
  const levelInfo = review.author.level
    ? REVIEWER_LEVELS[review.author.level]
    : null;

  // الحصول على معلومات مرحلة السفر
  const phaseInfo = review.travelPhase
    ? TRAVEL_PHASES[review.travelPhase as TravelPhase]
    : null;

  // تنسيق التاريخ
  const formattedDate = new Date(review.createdAt).toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={cn('border-b pb-6 last:border-0', className)}>
      {/* رأس المراجعة */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src={review.author.avatar || undefined} alt={review.author.name} />
          <AvatarFallback>{review.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{review.author.name}</span>
            {levelInfo && (
              <Badge variant="secondary" className="text-xs">
                {levelInfo.badge} {levelInfo.name}
              </Badge>
            )}
            {/* شارة الحجز الموثق */}
            {review.isVerified && (
              <Badge variant="default" className="text-xs bg-emerald-600 hover:bg-emerald-700">
                <Check className="w-3 h-3 ml-1" />
                حجز موثق
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 flex-wrap">
            <span>{formattedDate}</span>
            {review.visitDate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  زيارة: {new Date(review.visitDate).toLocaleDateString('ar-SY', { month: 'long', year: 'numeric' })}
                </span>
              </>
            )}
            {/* عرض مرحلة السفر */}
            {phaseInfo && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {phaseInfo.icon} {phaseInfo.name}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RatingStars rating={review.rating} size="sm" showValue={false} />
          <span className="font-bold text-lg">{review.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* عنوان المراجعة */}
      {review.title && (
        <h4 className="font-semibold mb-2">{review.title}</h4>
      )}

      {/* محتوى المراجعة */}
      <p className="text-gray-700 leading-relaxed mb-3">{displayContent}</p>
      
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary hover:underline text-sm mb-3"
        >
          {isExpanded ? 'عرض أقل' : 'قراءة المزيد'}
        </button>
      )}

      {/* معايير التقييم */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
        {Object.entries(RATING_CRITERIA).map(([key, criteria]) => {
          const value = review[key as keyof typeof review] as number | null;
          if (value === null) return null;
          
          return (
            <div key={key} className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">{criteria.icon}</span>
              <span className="text-gray-600">{criteria.name}</span>
              <RatingStars rating={value} size="sm" showValue={false} />
            </div>
          );
        })}
      </div>

      {/* صور المراجعة */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {review.photos.map((photo) => (
            <div
              key={photo.id}
              className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100"
            >
              <img
                src={photo.url}
                alt={photo.caption || 'صورة المراجعة'}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* رد المزود */}
      {review.replies && review.replies.length > 0 && (
        <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-blue-700">
              {review.replies[0].authorRole === 'PROVIDER' ? 'رد المزود' : 'رد الإدارة'}
            </Badge>
            <span className="font-semibold text-blue-900">{review.replies[0].authorName}</span>
          </div>
          <p className="text-gray-700 text-sm">{review.replies[0].content}</p>
          <span className="text-xs text-gray-500 mt-2 block">
            {new Date(review.replies[0].createdAt).toLocaleDateString('ar-SY')}
          </span>
        </div>
      )}

      {/* أزرار التفاعل */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onHelpful?.(review.id, !review.userHelpful)}
          className={cn(
            'text-gray-600',
            review.userHelpful && 'text-primary font-semibold'
          )}
        >
          <ThumbsUp className={cn('w-4 h-4 ml-1', review.userHelpful && 'fill-current')} />
          مفيد ({review.helpfulCount})
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReply?.(review.id)}
          className="text-gray-600"
        >
          <MessageCircle className="w-4 h-4 ml-1" />
          رد
        </Button>
      </div>
    </div>
  );
}
