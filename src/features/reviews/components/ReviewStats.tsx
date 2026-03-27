'use client';

/**
 * ReviewStats - إحصائيات التقييمات
 */

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { RatingStars } from './RatingStars';
import type { ReviewStats as ReviewStatsType, RATING_CRITERIA } from '../types';

interface ReviewStatsProps {
  stats: ReviewStatsType;
  className?: string;
}

export function ReviewStats({ stats, className }: ReviewStatsProps) {
  const totalReviews = stats.totalReviews;
  const averageRating = stats.averageRating;

  if (totalReviews === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">لا توجد مراجعات بعد</p>
        <p className="text-sm text-gray-400">كن أول من يكتب مراجعة!</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* التقييم العام */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
          <RatingStars rating={averageRating} size="md" showValue={false} className="justify-center mt-1" />
          <p className="text-sm text-gray-500 mt-1">{totalReviews} مراجعة</p>
        </div>

        {/* توزيع التقييمات */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating.toString()] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-2">
                <span className="w-4 text-sm text-gray-600">{rating}</span>
                <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
                <Progress
                  value={percentage}
                  className="flex-1 h-2 bg-gray-200"
                />
                <span className="w-8 text-sm text-gray-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* متوسطات المعايير */}
      {stats.criteriaAverages && (
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3">تفاصيل التقييم</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(stats.criteriaAverages).map(([key, value]) => {
              if (value === null) return null;
              
              const criteriaLabels: Record<string, { name: string; icon: string }> = {
                cleanliness: { name: 'النظافة', icon: '🧹' },
                location: { name: 'الموقع', icon: '📍' },
                value: { name: 'القيمة', icon: '💰' },
                serviceRating: { name: 'الخدمة', icon: '⭐' },
                amenities: { name: 'المرافق', icon: '🏠' },
                communication: { name: 'التواصل', icon: '💬' },
              };
              
              const label = criteriaLabels[key];
              if (!label) return null;

              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-lg">{label.icon}</span>
                  <span className="text-sm text-gray-600">{label.name}</span>
                  <RatingStars rating={value} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* معلومات إضافية */}
      <div className="flex gap-4 text-sm text-gray-500">
        {stats.verifiedCount > 0 && (
          <span>✓ {stats.verifiedCount} مراجعة موثقة</span>
        )}
        {stats.photosCount > 0 && (
          <span>📷 {stats.photosCount} صورة</span>
        )}
      </div>
    </div>
  );
}
