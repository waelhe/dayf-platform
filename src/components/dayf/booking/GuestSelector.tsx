/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * GuestSelector Component
 * 
 * Guest count selection with adults, children, and infants
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Minus, Plus } from 'lucide-react';

interface Guests {
  adults: number;
  children: number;
  infants: number;
}

interface GuestSelectorProps {
  guests: Guests;
  onGuestsChange: (guests: Guests) => void;
  maxGuests: number;
}

export function GuestSelector({ guests, onGuestsChange, maxGuests }: GuestSelectorProps) {
  const { language } = useLanguage();

  const totalGuests = guests.adults + guests.children + guests.infants;

  const updateGuests = (type: keyof Guests, value: number) => {
    onGuestsChange({ ...guests, [type]: value });
  };

  const guestTypes = [
    {
      type: 'adults' as const,
      label: language === 'ar' ? 'البالغين' : 'Adults',
      description: language === 'ar' ? '13 سنة فما فوق' : 'Age 13+',
      min: 1,
      max: maxGuests,
    },
    {
      type: 'children' as const,
      label: language === 'ar' ? 'الأطفال' : 'Children',
      description: language === 'ar' ? '2-12 سنة' : 'Ages 2-12',
      min: 0,
      max: maxGuests - guests.adults - guests.infants,
    },
    {
      type: 'infants' as const,
      label: language === 'ar' ? 'الرضع' : 'Infants',
      description: language === 'ar' ? 'أقل من سنتين' : 'Under 2',
      min: 0,
      max: 5,
    },
  ];

  return (
    <div>
      <h3 className="font-semibold mb-4">
        {language === 'ar' ? 'حدد عدد الضيوف' : 'Select Guests'}
      </h3>

      <div className="space-y-4">
        {guestTypes.map(({ type, label, description, min, max }) => (
          <div 
            key={type} 
            className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const currentValue = guests[type];
                  if (currentValue > min) {
                    updateGuests(type, currentValue - 1);
                  }
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#0D4D3A] hover:text-[#0D4D3A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={guests[type] <= min}
                aria-label={`${language === 'ar' ? 'تقليل' : 'Decrease'} ${label}`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-medium">{guests[type]}</span>
              <button
                onClick={() => {
                  const currentValue = guests[type];
                  const effectiveMax = type === 'infants' ? 5 : maxGuests - (type === 'adults' ? 0 : guests.adults);
                  if (type === 'infants' || totalGuests < maxGuests) {
                    if (currentValue < effectiveMax) {
                      updateGuests(type, currentValue + 1);
                    }
                  }
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#0D4D3A] hover:text-[#0D4D3A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={type === 'infants' ? guests.infants >= 5 : totalGuests >= maxGuests}
                aria-label={`${language === 'ar' ? 'زيادة' : 'Increase'} ${label}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalGuests >= maxGuests && (
        <p className="mt-3 text-sm text-amber-600 text-center">
          {language === 'ar' 
            ? `الحد الأقصى ${maxGuests} ضيوف` 
            : `Maximum ${maxGuests} guests`}
        </p>
      )}
    </div>
  );
}
