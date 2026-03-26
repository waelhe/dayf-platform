'use client';

/**
 * RatingStars - مكون عرض نجوم التقييم
 */

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = true,
  interactive = false,
  onChange,
  className,
}: RatingStarsProps) {
  const stars: React.ReactNode[] = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= maxRating; i++) {
    const isFull = i <= fullStars;
    const isHalf = i === fullStars + 1 && hasHalfStar;

    stars.push(
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && onChange?.(i)}
        className={cn(
          'relative',
          interactive && 'cursor-pointer hover:scale-110 transition-transform',
          !interactive && 'cursor-default'
        )}
      >
        {/* خلفية النجمة الفارغة */}
        <Star
          className={cn(
            sizeClasses[size],
            'text-gray-300'
          )}
          fill="currentColor"
        />
        {/* النجمة الممتلئة */}
        {(isFull || isHalf) && (
          <Star
            className={cn(
              sizeClasses[size],
              'absolute top-0 left-0 text-amber-400'
            )}
            fill="currentColor"
            style={{
              clipPath: isHalf ? 'inset(0 50% 0 0)' : undefined,
            }}
          />
        )}
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">{stars}</div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700 mr-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
