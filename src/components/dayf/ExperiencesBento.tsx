/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ExperiencesBento Component
 * شبكة التجارب السياحية
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Stethoscope, Sparkles, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Experience {
  id: string;
  image: string | null;
  icon?: LucideIcon;
  bgColor?: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  span: string;
  hasIcon: boolean;
  isOverlay?: boolean;
  href: string;
}

const experiences: Experience[] = [
  {
    id: 'wellness',
    image: '/cities/damascus-hero.jpg',
    titleAr: 'الحمّامات التقليدية',
    titleEn: 'Traditional Hammams',
    descAr: 'استرخِ في الحمامات الدمشقية التقليدية مع علاجات العافية',
    descEn: 'Relax in traditional Damascus baths with wellness treatments',
    span: 'md:col-span-2 md:row-span-2',
    hasIcon: false,
    href: '/services?category=wellness',
  },
  {
    id: 'medical',
    image: null,
    icon: Stethoscope,
    bgColor: 'bg-[#eae8e4]',
    titleAr: 'السياحة العلاجية',
    titleEn: 'Medical Tourism',
    descAr: 'وصول لأطباء معتمدين دولياً وتشخيص حديث',
    descEn: 'Internationally certified specialists and modern diagnostics',
    span: 'md:col-span-1 md:row-span-1',
    hasIcon: true,
    href: '/services?category=medical',
  },
  {
    id: 'spa',
    image: '/cities/latakia.png',
    titleAr: 'منتجعات الاستجمام',
    titleEn: 'Spa Resorts',
    descAr: '',
    descEn: '',
    span: 'md:col-span-1 md:row-span-1',
    hasIcon: false,
    isOverlay: true,
    href: '/services?category=spa',
  },
];

export function ExperiencesBento() {
  const { language, dir } = useLanguage();

  return (
    <section className="py-10 sm:py-16 px-4 sm:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#0D4D3A] mb-3">
              {language === 'ar' ? 'العافية والاستجمام' : 'Wellness & Spa'}
            </h2>
            <p className="text-gray-500 max-w-2xl">
              {language === 'ar'
                ? 'استرخِ واستمتع بأفضل تجارب العافية والاستجمام في سوريا'
                : 'Relax and enjoy the best wellness and spa experiences in Syria'}
            </p>
          </div>
          <Link
            href="/services?category=wellness"
            className="text-[#775a19] font-semibold hover:underline"
          >
            {language === 'ar' ? 'عرض الكل' : 'View All'}
          </Link>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[200px] sm:auto-rows-[280px] md:auto-rows-[220px] gap-4 md:h-[500px]">
          {experiences.map((exp) => {
            const IconComponent = exp.icon;
            
            return (
              <Link
                key={exp.id}
                href={exp.href}
                className={`group relative overflow-hidden rounded-2xl ${exp.span}`}
              >
                {exp.hasIcon && IconComponent ? (
                  // Card with icon
                  <div className={`${exp.bgColor} h-full p-6 sm:p-8 flex flex-col justify-center border-s-4 border-[#0D4D3A] hover:shadow-lg transition-shadow`}>
                    <IconComponent className="w-12 h-12 text-[#0D4D3A] mb-4" />
                    <h3 className="text-xl sm:text-2xl font-serif text-[#0D4D3A] mb-3">
                      {language === 'ar' ? exp.titleAr : exp.titleEn}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {language === 'ar' ? exp.descAr : exp.descEn}
                    </p>
                  </div>
                ) : exp.isOverlay ? (
                  // Card with overlay
                  <div className="relative h-full">
                    <Image
                      src={exp.image!}
                      alt={language === 'ar' ? exp.titleAr : exp.titleEn}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-[#0D4D3A]/30 backdrop-blur-[2px] flex items-center justify-center group-hover:bg-[#0D4D3A]/40 transition-colors">
                      <h3 className="text-2xl font-serif text-white border-b-2 border-[#D4B896] pb-2">
                        {language === 'ar' ? exp.titleAr : exp.titleEn}
                      </h3>
                    </div>
                  </div>
                ) : (
                  // Large image card
                  <div className="relative h-full">
                    <Image
                      src={exp.image!}
                      alt={language === 'ar' ? exp.titleAr : exp.titleEn}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 66vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D4D3A]/80 via-transparent to-transparent" />
                    <div className={`absolute bottom-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} p-6 sm:p-8 text-white`}>
                      <h3 className="text-2xl sm:text-3xl font-serif mb-2">
                        {language === 'ar' ? exp.titleAr : exp.titleEn}
                      </h3>
                      <p className="text-white/80 text-sm max-w-md">
                        {language === 'ar' ? exp.descAr : exp.descEn}
                      </p>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
