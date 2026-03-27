/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SyrianGovernorates Component
 * قائمة المحافظات السورية
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

const governorates = [
  { id: 'damascus', nameAr: 'دمشق', nameEn: 'Damascus' },
  { id: 'aleppo', nameAr: 'حلب', nameEn: 'Aleppo' },
  { id: 'homs', nameAr: 'حمص', nameEn: 'Homs' },
  { id: 'latakia', nameAr: 'اللاذقية', nameEn: 'Latakia' },
  { id: 'hama', nameAr: 'حماة', nameEn: 'Hama' },
  { id: 'tartus', nameAr: 'طرطوس', nameEn: 'Tartus' },
  { id: 'idlib', nameAr: 'إدلب', nameEn: 'Idlib' },
  { id: 'daraa', nameAr: 'درعا', nameEn: 'Daraa' },
  { id: 'deir-ez-zor', nameAr: 'دير الزور', nameEn: 'Deir ez-Zor' },
  { id: 'raqqa', nameAr: 'الرقة', nameEn: 'Raqqa' },
  { id: 'al-hasakah', nameAr: 'الحسكة', nameEn: 'Al-Hasakah' },
  { id: 'sweida', nameAr: 'السويداء', nameEn: 'As-Suwayda' },
  { id: 'quneitra', nameAr: 'القنيطرة', nameEn: 'Quneitra' },
  { id: 'palmyra', nameAr: 'تدمر', nameEn: 'Palmyra' },
];

export function SyrianGovernorates() {
  const { language } = useLanguage();

  return (
    <section className="py-10 sm:py-12 px-4 sm:px-8 bg-[#F8F5F0]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <MapPin className="w-5 h-5 text-[#0D4D3A]" />
          <h3 className="font-semibold text-[#0D4D3A]">
            {language === 'ar' ? 'المحافظات السورية' : 'Syrian Governorates'}
          </h3>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {governorates.map((gov) => (
            <Link
              key={gov.id}
              href={`/destinations/${gov.id}`}
              className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-white text-gray-700 hover:text-[#0D4D3A] transition-colors text-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-[#0D4D3A]/50 flex-shrink-0" />
              <span className="font-medium">
                {language === 'ar' ? gov.nameAr : gov.nameEn}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
