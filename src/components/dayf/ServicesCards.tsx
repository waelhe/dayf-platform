/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ServicesCards Component
 * بطاقات الخدمات الرئيسية
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Heart, Plane, GraduationCap, Building2, Utensils, Palmtree, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const services = [
  {
    id: 'stays',
    icon: Building2,
    bgColor: 'bg-[#F8F5E8]',
    iconColor: 'text-[#A0845C]',
    titleAr: 'الإقامات والفنادق',
    titleEn: 'Stays & Hotels',
    descAr: 'ابحث عن أفضل أماكن الإقامة في جميع أنحاء سوريا',
    descEn: 'Find the best places to stay across Syria',
    href: '/services?category=stays',
  },
  {
    id: 'tours',
    icon: Plane,
    iconBg: 'bg-[#E8F5F8]',
    iconColor: 'text-[#2C5F4F]',
    titleAr: 'الجولات السياحية',
    titleEn: 'Tours & Trips',
    descAr: 'اكتشف جولات سياحية منظمة مع مرشدين محترفين',
    descEn: 'Discover organized tours with professional guides',
    href: '/services?category=tours',
  },
  {
    id: 'medical',
    icon: Heart,
    bgColor: 'bg-[#F8E8E8]',
    iconColor: 'text-[#8B2C2C]',
    titleAr: 'السياحة العلاجية',
    titleEn: 'Medical Tourism',
    descAr: 'استكشف أفضل المراكز الطبية والعيادات في سوريا',
    descEn: 'Explore top medical centers and clinics in Syria',
    href: '/services?category=medical',
  },
  {
    id: 'food',
    icon: Utensils,
    bgColor: 'bg-[#F0F5F8]',
    iconColor: 'text-[#4A5568]',
    titleAr: 'المطاعم والمأكولات',
    titleEn: 'Food & Dining',
    descAr: 'تذوق أشهى المأكولات السورية التقليدية',
    descEn: 'Taste the most delicious traditional Syrian cuisine',
    href: '/services?category=food',
  },
  {
    id: 'education',
    icon: GraduationCap,
    bgColor: 'bg-[#E8F5E8]',
    iconColor: 'text-[#2E7D32]',
    titleAr: 'التعليم والدراسة',
    titleEn: 'Education',
    descAr: 'اكتشف فرص التعليم في الجامعات السورية',
    descEn: 'Discover education opportunities in Syrian universities',
    href: '/services?category=education',
  },
  {
    id: 'wellness',
    icon: Palmtree,
    bgColor: 'bg-[#F5E8F5]',
    iconColor: 'text-[#7B1FA2]',
    titleAr: 'الاستجمام والنادي',
    titleEn: 'Wellness & Spa',
    descAr: 'استرخِ في أفضل منتجعات الاستجمام',
    descEn: 'Relax at the best wellness resorts',
    href: '/services?category=wellness',
  },
];

export function ServicesCards() {
  const { language, dir } = useLanguage();

  return (
    <section className="py-10 sm:py-16 px-4 sm:px-8 bg-[#F8F5F0]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-serif text-[#0D4D3A] mb-2">
            {language === 'ar' ? 'خدماتنا' : 'Our Services'}
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            {language === 'ar'
              ? 'نقدم لك مجموعة متكاملة من الخدمات السياحية المصممة خصيصاً لاحتياجاتك'
              : 'We offer a comprehensive range of tourism services tailored to your needs'}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Link
              key={service.id}
              href={service.href}
              className={`${service.bgColor} rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center ${service.iconColor} flex-shrink-0`}>
                  <service.icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {language === 'ar' ? service.titleAr : service.titleEn}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {language === 'ar' ? service.descAr : service.descEn}
                  </p>
                </div>

                {/* Arrow */}
                {dir === 'rtl' ? (
                  <ArrowLeft className="w-5 h-5 text-[#0D4D3A] group-hover:-translate-x-1 transition-transform flex-shrink-0" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-[#0D4D3A] group-hover:translate-x-1 transition-transform flex-shrink-0" />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
