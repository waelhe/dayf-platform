/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Loading Components
 * 
 * Reusable loading states for the application
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 
      className={`animate-spin text-[#0D4D3A] ${sizeClasses[size]} ${className}`} 
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  const { language } = useLanguage();
  
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 font-medium">
          {message || (language === 'ar' ? 'جاري التحميل...' : 'Loading...')}
        </p>
      </div>
    </div>
  );
}

interface LoadingCardProps {
  count?: number;
}

export function LoadingCard({ count = 1 }: LoadingCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      ))}
    </>
  );
}

interface LoadingBentoProps {
  rows?: number;
}

export function LoadingBento({ rows = 3 }: LoadingBentoProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, j) => (
            <div 
              key={j} 
              className={`${j === 0 ? 'col-span-2 row-span-2' : ''} bg-gray-200 rounded-2xl animate-pulse`}
              style={{ minHeight: j === 0 ? '300px' : '140px' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function LoadingHero() {
  return (
    <div className="relative min-h-[70vh] bg-gray-100 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 bg-gray-300/50 rounded-lg w-2/3 mb-4" />
          <div className="h-6 bg-gray-300/50 rounded-lg w-1/2 mb-8" />
          <div className="flex gap-4">
            <div className="h-12 bg-gray-300/50 rounded-lg w-40" />
            <div className="h-12 bg-gray-300/50 rounded-lg w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
