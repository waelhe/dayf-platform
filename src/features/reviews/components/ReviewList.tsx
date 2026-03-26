'use client';

/**
 * ReviewList - قائمة المراجعات مع الفلترة والترتيب
 */

import { useState, useEffect } from 'react';
import { ChevronDown, Filter, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReviewCard } from './ReviewCard';
import { ReviewStats } from './ReviewStats';
import type { ReviewWithRelations, ReviewStats as ReviewStatsType, ReviewType } from '../types';

interface ReviewListProps {
  referenceId: string;
  type: ReviewType;
  currentUserId?: string;
  className?: string;
}

interface ReviewListResponse {
  reviews: ReviewWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface StatsResponse {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  criteriaAverages: {
    cleanliness: number | null;
    location: number | null;
    value: number | null;
    serviceRating: number | null;
    amenities: number | null;
    communication: number | null;
  } | Record<string, number | null>;
  verifiedCount: number;
  photosCount: number;
  recentReviews: number;
}

const sortOptions = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'helpful', label: 'الأكثر فائدة' },
  { value: 'highest', label: 'الأعلى تقييماً' },
  { value: 'lowest', label: 'الأقل تقييماً' },
];

const filterOptions = [
  { value: 'all', label: 'جميع المراجعات' },
  { value: 'verified', label: 'مراجعات موثقة فقط' },
  { value: '5', label: '5 نجوم' },
  { value: '4', label: '4 نجوم' },
  { value: '3', label: '3 نجوم' },
  { value: '2', label: '2 نجوم' },
  { value: '1', label: '1 نجوم' },
];

export function ReviewList({
  referenceId,
  type,
  currentUserId,
  className,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewWithRelations[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [filter, setFilter] = useState('all');

  // جلب الإحصائيات
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `/api/reviews/stats/${referenceId}?type=${type}`
        );
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [referenceId, type]);

  // جلب المراجعات
  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          referenceId,
          type,
          sortBy,
          page: page.toString(),
          limit: '10',
        });

        if (filter === 'verified') {
          params.set('isVerified', 'true');
        } else if (filter !== 'all') {
          params.set('rating', filter);
        }

        if (currentUserId) {
          params.set('currentUserId', currentUserId);
        }

        const response = await fetch(`/api/reviews?${params.toString()}`);
        const data: { success: boolean; data: ReviewListResponse } = await response.json();
        
        if (data.success) {
          setReviews(data.data.reviews);
          setTotalPages(data.data.pagination.totalPages);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [referenceId, type, sortBy, filter, page, currentUserId]);

  // التعامل مع التصويت المفيد
  const handleHelpful = async (reviewId: string, isHelpful: boolean) => {
    if (!currentUserId) return;

    try {
      const method = isHelpful ? 'POST' : 'DELETE';
      const body = isHelpful 
        ? JSON.stringify({ userId: currentUserId, isHelpful: true })
        : null;
      
      const url = `/api/reviews/${reviewId}/helpful${!isHelpful ? `?userId=${currentUserId}` : ''}`;
      
      const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      });

      const data = await response.json();
      
      if (data.success) {
        // تحديث المراجعة محلياً
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  helpfulCount: data.data.helpfulCount,
                  userHelpful: data.data.userHelpful,
                }
              : r
          )
        );
      }
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* إحصائيات التقييم */}
      {stats && <ReviewStats stats={{
        ...stats,
        referenceId,
        type,
        criteriaAverages: stats.criteriaAverages as {
          cleanliness: number | null;
          location: number | null;
          value: number | null;
          serviceRating: number | null;
          amenities: number | null;
          communication: number | null;
        }
      }} />}

      {/* فلترة وترتيب */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="ترتيب حسب" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="فلترة" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* قائمة المراجعات */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">لا توجد مراجعات</p>
        </div>
      ) : (
        <div className="divide-y">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              onHelpful={handleHelpful}
            />
          ))}
        </div>
      )}

      {/* التصفح بين الصفحات */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            السابق
          </Button>
          <span className="flex items-center px-3 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
