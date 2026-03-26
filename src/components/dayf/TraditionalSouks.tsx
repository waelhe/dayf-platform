/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TraditionalSouks Component
 * قسم الأسواق التقليدية
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function TraditionalSouks() {
  const { language, dir } = useLanguage();

  return (
    <section className="py-10 sm:py-16 px-4 sm:px-8 bg-[#0D4D3A] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="relative w-full aspect-[4/5] max-w-md mx-auto">
              <Image
                src="/cities/aleppo.jpg"
                alt={language === 'ar' ? 'الحرف السورية' : 'Syrian Crafts'}
                fill
                className="object-cover shadow-[40px_-40px_0px_0px_rgba(119,90,25,0.3)]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white leading-tight">
              {language === 'ar' ? (
                <>
                  روح
                  <br />
                  <span className="text-[#D4B896]">الحرفية</span>
                </>
              ) : (
                <>
                  The Soul of
                  <br />
                  <span className="text-[#D4B896]">Craftsmanship</span>
                </>
              )}
            </h2>

            <div className="space-y-4 text-white/80 text-lg leading-relaxed">
              <p>
                {language === 'ar'
                  ? 'اكتشف منتجات الحرف اليدوية السورية الأصيلة من التطعيم الدمشقي والبروكار والنحاس المطرقة.'
                  : 'Discover authentic Syrian handcrafted products from Damascene wood inlay, brocade, and hand-hammered copper.'}
              </p>
              <p>
                {language === 'ar'
                  ? 'تسوق مباشرة من الحرفيين المحليين واحصل على منتجات فريدة توصل إلى بابك.'
                  : 'Shop directly from local artisans and get unique products delivered to your door.'}
              </p>
            </div>

            <Link
              href="/marketplace"
              className="inline-flex items-center gap-3 text-[#D4B896] font-bold tracking-widest uppercase group transition-all hover:gap-4"
            >
              {language === 'ar' ? 'تسوق الآن' : 'Shop Now'}
              {dir === 'rtl' ? (
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
              ) : (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              )}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
