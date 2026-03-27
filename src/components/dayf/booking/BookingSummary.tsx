/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * BookingSummary Component
 * 
 * Price breakdown and booking confirmation
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Clock, CheckCircle } from 'lucide-react';

interface BookingSummaryProps {
  nightsCount: number;
  pricePerNight: number;
  currency: string;
  checkIn: Date | null;
  checkOut: Date | null;
  totalGuests: number;
  onConfirm: () => void;
}

export function BookingSummary({
  nightsCount,
  pricePerNight,
  currency,
  checkIn,
  checkOut,
  totalGuests,
  onConfirm,
}: BookingSummaryProps) {
  const { language } = useLanguage();

  const subtotal = nightsCount * pricePerNight;
  const cleaningFee = Math.round(subtotal * 0.05);
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + cleaningFee + serviceFee;

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const trustBadges = [
    {
      icon: Shield,
      text: language === 'ar' ? 'حجز آمن' : 'Secure booking',
    },
    {
      icon: Clock,
      text: language === 'ar' ? 'إلغاء مجاني' : 'Free cancellation',
    },
  ];

  return (
    <div>
      <h3 className="font-semibold mb-4">
        {language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'}
      </h3>

      {/* Date and Guest Summary */}
      <div className="p-4 bg-gray-50 rounded-xl mb-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-[#0D4D3A]" />
          <span className="text-sm font-medium">
            {formatDate(checkIn)} → {formatDate(checkOut)}
          </span>
        </div>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>{nightsCount} {language === 'ar' ? 'ليالي' : 'nights'}</span>
          <span>•</span>
          <span>{totalGuests} {language === 'ar' ? 'ضيوف' : 'guests'}</span>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {currency}{pricePerNight} × {nightsCount} {language === 'ar' ? 'ليالي' : 'nights'}
          </span>
          <span>{currency}{subtotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{language === 'ar' ? 'رسوم التنظيف' : 'Cleaning fee'}</span>
          <span>{currency}{cleaningFee}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{language === 'ar' ? 'رسوم الخدمة' : 'Service fee'}</span>
          <span>{currency}{serviceFee}</span>
        </div>
        <div className="flex justify-between font-bold pt-3 border-t border-gray-200">
          <span>{language === 'ar' ? 'المجموع' : 'Total'}</span>
          <span className="text-[#0D4D3A] text-lg">{currency}{total}</span>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {trustBadges.map((badge, index) => (
          <div 
            key={index} 
            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
          >
            <badge.icon className="w-5 h-5 text-[#0D4D3A]" />
            <span className="text-sm">{badge.text}</span>
          </div>
        ))}
      </div>

      {/* Confirm Button */}
      <button 
        onClick={onConfirm}
        className="w-full py-4 bg-gradient-to-r from-[#775a19] to-[#957a3a] text-white rounded-lg font-bold text-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
      >
        {language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'}
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        {language === 'ar' 
          ? 'لن يتم خصم أي مبالغ حتى تأكيد المضيف' 
          : "You won't be charged until the host confirms"}
      </p>
    </div>
  );
}
