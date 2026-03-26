/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ReviewsHighlights Component
 * آراء المسافرين المميزة في الصفحة الرئيسية
 */

'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, MessageSquare, Loader2, ThumbsUp, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Review {
  id: string;
  rating: number;
  content: string;
  title?: string;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
  author?: {
    displayName?: string;
    avatar?: string;
  };
  reference?: {
    id: string;
    name: string;
    type: string;
  };
}

export default function ReviewsHighlights() {
  const { language, dir } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews?limit=6&sortBy=helpful');
      const data = await response.json();
      if (data.success) {
        setReviews(data.data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0D4D3A]" />
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-2 text-[#0D4D3A] font-bold mb-1">
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider">
                {language === 'ar' ? 'آراء المسافرين' : 'Traveler Reviews'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {language === 'ar' ? 'ماذا يقول مسافرونا' : 'What Our Travelers Say'}
            </h2>
            <p className="text-gray-600 mt-1 max-w-2xl text-sm">
              {language === 'ar'
                ? 'تجارب حقيقية من مسافرين اكتشفوا سوريا مع ضيف'
                : 'Real experiences from travelers who discovered Syria with Dayf'}
            </p>
          </div>
          <Link
            href="/services"
            className="hidden md:flex items-center gap-2 text-[#0D4D3A] hover:text-[#1A5F4A] font-semibold transition-colors"
          >
            {language === 'ar' ? 'عرض الكل' : 'View All'}
            {dir === 'rtl' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </Link>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-shadow"
            >
              {/* Rating & Verified */}
              <div className="flex items-center justify-between mb-3">
                {renderStars(review.rating)}
                {review.isVerified && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <BadgeCheck className="w-4 h-4" />
                    {language === 'ar' ? 'موثق' : 'Verified'}
                  </span>
                )}
              </div>

              {/* Title */}
              {review.title && (
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">
                  {review.title}
                </h3>
              )}

              {/* Content */}
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                {review.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0D4D3A] flex items-center justify-center overflow-hidden">
                    {review.author?.avatar ? (
                      <img
                        src={review.author.avatar}
                        alt={review.author.displayName || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {review.author?.displayName?.charAt(0) || 'م'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {review.author?.displayName || 'مسافر'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                  </div>
                </div>

                {/* Helpful Count */}
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{review.helpfulCount}</span>
                </div>
              </div>

              {/* Reference */}
              {review.reference && (
                <Link
                  href={`/services/${review.reference.id}`}
                  className="block mt-3 pt-3 border-t border-gray-50 text-sm text-[#775a19] hover:text-[#0D4D3A] transition-colors font-medium"
                >
                  {review.reference.name}
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-[#0D4D3A] font-semibold"
          >
            {language === 'ar' ? 'عرض الكل' : 'View All'}
            {dir === 'rtl' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </Link>
        </div>
      </div>
    </section>
  );
}
