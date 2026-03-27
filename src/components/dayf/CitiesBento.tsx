/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CitiesBento Component
 * شبكة المدن السورية
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const cities = [
  {
    id: 'damascus',
    nameAr: 'دمشق',
    nameEn: 'Damascus',
    subtitleAr: 'أقدم عاصمة مأهولة في العالم',
    subtitleEn: 'The Oldest Inhabited Capital',
    image: '/cities/damascus-hero.jpg',
    span: 'col-span-2 row-span-2',
  },
  {
    id: 'palmyra',
    nameAr: 'تدمر',
    nameEn: 'Palmyra',
    subtitleAr: 'لؤلؤة الصحراء',
    subtitleEn: 'Desert Pearl',
    image: '/cities/palmyra.png',
    span: 'col-span-1 row-span-1',
  },
  {
    id: 'aleppo',
    nameAr: 'حلب',
    nameEn: 'Aleppo',
    subtitleAr: 'روح الشمال',
    subtitleEn: 'Soul of the North',
    image: '/cities/aleppo.jpg',
    span: 'col-span-1 row-span-1',
  },
  {
    id: 'latakia',
    nameAr: 'اللاذقية',
    nameEn: 'Latakia',
    subtitleAr: 'عروس الساحل',
    subtitleEn: 'Bride of the Coast',
    image: '/cities/latakia.png',
    span: 'col-span-2 row-span-1',
  },
];

export function CitiesBento() {
  const { language, dir } = useLanguage();

  return (
    <section className="py-10 sm:py-16 px-4 sm:px-8 bg-[#F8F5F0]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#0D4D3A] tracking-tight">
              {language === 'ar' ? 'مدن خالدة' : 'Timeless Cities'}
            </h2>
            <p className="text-gray-500 mt-2 max-w-md">
              {language === 'ar'
                ? 'من أزقة دمشق المعطرة بالياسمين إلى شواطئ اللاذقية'
                : 'From jasmine-scented alleys of Damascus to the beaches of Latakia'}
            </p>
          </div>
          <Link
            href="/destinations"
            className="flex items-center gap-2 text-[#775a19] font-semibold hover:gap-4 transition-all"
          >
            {language === 'ar' ? 'عرض الكل' : 'View All'}
            {dir === 'rtl' ? (
              <ArrowLeft className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </Link>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] sm:auto-rows-[280px] gap-4">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/destinations/${city.id}`}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer ${city.span}`}
            >
              {/* Image */}
              <Image
                src={city.image}
                alt={language === 'ar' ? city.nameAr : city.nameEn}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D4D3A]/80 via-[#0D4D3A]/20 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
                <span className="text-[#D4B896] text-xs uppercase tracking-widest mb-1">
                  {language === 'ar' ? city.subtitleAr : city.subtitleEn}
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif text-white">
                  {language === 'ar' ? city.nameAr : city.nameEn}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
