/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * BookingModal Component
 * 
 * Main booking modal that orchestrates date selection, guest count, and confirmation
 */

'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ChevronLeft } from 'lucide-react';
import { CalendarPicker, GuestSelector, BookingSummary } from './booking';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyName: { ar: string; en: string };
  pricePerNight: number;
  currency: string;
  rating: number;
  reviewCount: number;
  maxGuests: number;
}

interface DateRange {
  checkIn: Date | null;
  checkOut: Date | null;
}

interface Guests {
  adults: number;
  children: number;
  infants: number;
}

type Step = 'dates' | 'guests' | 'confirm';

export function BookingModal({
  isOpen,
  onClose,
  propertyName,
  pricePerNight,
  currency,
  rating,
  reviewCount,
  maxGuests,
}: BookingModalProps) {
  const { language } = useLanguage();
  const [step, setStep] = useState<Step>('dates');
  const [dateRange, setDateRange] = useState<DateRange>({
    checkIn: null,
    checkOut: null,
  });
  const [guests, setGuests] = useState<Guests>({
    adults: 1,
    children: 0,
    infants: 0,
  });

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const nightsCount = dateRange.checkIn && dateRange.checkOut
    ? Math.ceil((dateRange.checkOut.getTime() - dateRange.checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const totalGuests = guests.adults + guests.children + guests.infants;

  const handleConfirm = () => {
    // Here you would typically submit the booking to an API
    alert(language === 'ar' ? 'تم إرسال طلب الحجز بنجاح!' : 'Booking request sent successfully!');
    onClose();
  };

  const goBack = () => {
    if (step === 'confirm') setStep('guests');
    else if (step === 'guests') setStep('dates');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            {step !== 'dates' && (
              <button
                onClick={goBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={language === 'ar' ? 'رجوع' : 'Go back'}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 id="booking-modal-title" className="text-xl font-bold text-[#0D4D3A]">
              {language === 'ar' ? 'احجز إقامتك' : 'Book Your Stay'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-2">
          {/* Left Panel - Property Info */}
          <div className="p-6 bg-gray-50 border-r border-gray-100">
            <h3 className="font-semibold text-lg mb-4">
              {language === 'ar' ? propertyName.ar : propertyName.en}
            </h3>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">★ {rating}</span>
              </div>
              <span className="text-gray-400">·</span>
              <span className="text-sm text-gray-500">
                {reviewCount} {language === 'ar' ? 'تقييم' : 'reviews'}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {currency}{pricePerNight} <span className="text-sm">/ {language === 'ar' ? 'ليلة' : 'night'}</span>
                </span>
              </div>
            </div>

            {/* Summary Card */}
            {nightsCount > 0 && (
              <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-semibold mb-3 text-[#0D4D3A]">
                  {language === 'ar' ? 'ملخص الحجز' : 'Booking Summary'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {formatDate(dateRange.checkIn)} → {formatDate(dateRange.checkOut)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'ar' ? 'الليالي' : 'Nights'}</span>
                    <span className="font-medium">{nightsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'ar' ? 'الضيوف' : 'Guests'}</span>
                    <span className="font-medium">{totalGuests}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Booking Steps */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {step === 'dates' && (
              <>
                <CalendarPicker 
                  dateRange={dateRange} 
                  onDateChange={setDateRange} 
                />
                <button
                  onClick={() => setStep('guests')}
                  disabled={!dateRange.checkIn || !dateRange.checkOut}
                  className="w-full mt-6 py-3 bg-[#0D4D3A] text-white rounded-lg font-semibold hover:bg-[#1A5F4A] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </button>
              </>
            )}

            {step === 'guests' && (
              <>
                <GuestSelector 
                  guests={guests} 
                  onGuestsChange={setGuests} 
                  maxGuests={maxGuests} 
                />
                <button
                  onClick={() => setStep('confirm')}
                  className="w-full mt-6 py-3 bg-[#0D4D3A] text-white rounded-lg font-semibold hover:bg-[#1A5F4A] transition-all active:scale-[0.98]"
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </button>
              </>
            )}

            {step === 'confirm' && (
              <BookingSummary
                nightsCount={nightsCount}
                pricePerNight={pricePerNight}
                currency={currency}
                checkIn={dateRange.checkIn}
                checkOut={dateRange.checkOut}
                totalGuests={totalGuests}
                onConfirm={handleConfirm}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
