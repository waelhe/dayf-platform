/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CalendarPicker Component
 * 
 * Calendar grid for date selection with range support
 */

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DateRange {
  checkIn: Date | null;
  checkOut: Date | null;
}

interface CalendarPickerProps {
  dateRange: DateRange;
  onDateChange: (range: DateRange) => void;
}

export function CalendarPicker({ dateRange, onDateChange }: CalendarPickerProps) {
  const { language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDateSelected = (date: Date) => {
    if (dateRange.checkIn && date.toDateString() === dateRange.checkIn.toDateString()) return true;
    if (dateRange.checkOut && date.toDateString() === dateRange.checkOut.toDateString()) return true;
    return false;
  };

  const isDateInRange = (date: Date) => {
    if (!dateRange.checkIn || !dateRange.checkOut) return false;
    return date >= dateRange.checkIn && date <= dateRange.checkOut;
  };

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return;

    if (!dateRange.checkIn || (dateRange.checkIn && dateRange.checkOut)) {
      onDateChange({ checkIn: date, checkOut: null });
    } else if (date < dateRange.checkIn) {
      onDateChange({ checkIn: date, checkOut: dateRange.checkIn });
    } else {
      onDateChange({ ...dateRange, checkOut: date });
    }
  };

  const weekDays = language === 'ar' 
    ? ['أح', 'إث', 'ثلا', 'أرب', 'خم', 'جم', 'سب']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div>
      <h3 className="font-semibold mb-4">
        {language === 'ar' ? 'اختر التواريخ' : 'Select Dates'}
      </h3>
      
      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={language === 'ar' ? 'الشهر السابق' : 'Previous month'}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold">
          {currentMonth.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={language === 'ar' ? 'الشهر التالي' : 'Next month'}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-gray-500 py-2 font-medium">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {getDaysInMonth(currentMonth).map((date, index) => (
          <button
            key={index}
            disabled={!date || date < new Date()}
            onClick={() => date && handleDateClick(date)}
            className={`
              aspect-square rounded-full text-sm transition-all duration-200
              ${!date ? 'invisible' : ''}
              ${date && date < new Date() ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100 hover:scale-105'}
              ${date && isDateSelected(date) ? 'bg-[#0D4D3A] text-white hover:bg-[#0D4D3A] hover:scale-100' : ''}
              ${date && isDateInRange(date) && !isDateSelected(date) ? 'bg-[#0D4D3A]/10' : ''}
            `}
            aria-label={date ? date.toLocaleDateString() : ''}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}
