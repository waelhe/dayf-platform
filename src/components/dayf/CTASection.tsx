/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CTASection Component
 * قسم الدعوة للعمل
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

export function CTASection() {
  const { language } = useLanguage();

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-8 bg-[#F8F5F0] text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-serif text-[#0D4D3A] mb-4">
          {language === 'ar' ? 'ابدأ رحلتك السورية' : 'Begin Your Syrian Journey'}
        </h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          {language === 'ar'
            ? 'انضم إلى آلاف المسافرين الذين اكتشفوا سحر سوريا مع ضيف'
            : 'Join thousands of travelers who discovered the magic of Syria with Dayf'}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/services"
            className="px-8 py-4 bg-[#0D4D3A] text-white rounded-lg font-bold tracking-wide uppercase hover:bg-[#1A5F4A] transition-colors"
          >
            {language === 'ar' ? 'استكشف الخدمات' : 'Explore Services'}
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 border-2 border-[#775a19] text-[#775a19] rounded-lg font-bold tracking-wide uppercase hover:bg-[#775a19]/10 transition-colors"
          >
            {language === 'ar' ? 'إنشاء حساب' : 'Create Account'}
          </Link>
        </div>
      </div>
    </section>
  );
}
