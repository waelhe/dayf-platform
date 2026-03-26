/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Hero Component
 * القسم الرئيسي مع البحث
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Calendar, Search, Users } from 'lucide-react';
import Image from 'next/image';

interface HeroProps {
  onSearch?: (query: string, filters?: Record<string, string>) => void;
}

const heroSlides = [
  {
    id: 'damascus',
    image: '/cities/damascus-hero.jpg',
    titleAr: 'دمشق',
    titleEn: 'Damascus',
    subtitleAr: 'أقدم عاصمة مأهولة في العالم',
    subtitleEn: 'The Oldest Inhabited Capital',
  },
  {
    id: 'aleppo',
    image: '/cities/aleppo.jpg',
    titleAr: 'حلب',
    titleEn: 'Aleppo',
    subtitleAr: 'روح الشمال وقلب الصناعة',
    subtitleEn: 'Soul of the North & Heart of Industry',
  },
  {
    id: 'palmyra',
    image: '/cities/palmyra.png',
    titleAr: 'تدمر',
    titleEn: 'Palmyra',
    subtitleAr: 'لؤلؤة الصحراء وعروس الشام',
    subtitleEn: 'Desert Pearl & Bride of the Levant',
  },
  {
    id: 'latakia',
    image: '/cities/latakia.png',
    titleAr: 'اللاذقية',
    titleEn: 'Latakia',
    subtitleAr: 'عروس الساحل المتوسط',
    subtitleEn: 'Bride of the Mediterranean Coast',
  },
];

export function Hero({ onSearch }: HeroProps) {
  const { language, dir } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuests, setShowGuests] = useState(false);
  const [guests, setGuests] = useState(1);

  const nextSlide = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      setIsTransitioning(false);
    }, 500);
  }, []);

  const goToSlide = (index: number) => {
    if (index !== currentSlide) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsTransitioning(false);
      }, 500);
    }
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery, { guests: guests.toString() });
    }
  };

  const slide = heroSlides[currentSlide];

  return (
    <section className="relative min-h-[600px] sm:min-h-[700px] flex items-end overflow-hidden">
      {/* Background Images */}
      {heroSlides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={s.image}
            alt={language === 'ar' ? s.titleAr : s.titleEn}
            fill
            className="object-cover"
            priority={index === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D4D3A] via-[#0D4D3A]/60 to-[#0D4D3A]/20" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-16 pt-24">
        <div className="max-w-3xl">
          {/* Dynamic City Name */}
          <div
            className={`mb-2 transition-all duration-500 ${
              isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}
          >
            <span className="inline-block px-4 py-1.5 bg-[#775a19]/80 backdrop-blur-sm text-white text-sm font-medium rounded-full">
              {language === 'ar' ? slide.titleAr : slide.titleEn}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-white leading-tight mb-4">
            {language === 'ar' ? (
              <>
                مرحباً بك في
                <br />
                <span className="text-[#D4B896]">سوريا</span>
              </>
            ) : (
              <>
                Welcome to
                <br />
                <span className="text-[#D4B896]">Syria</span>
              </>
            )}
          </h1>

          {/* Dynamic Subtitle */}
          <p
            className={`text-white/80 text-lg sm:text-xl max-w-xl mb-8 transition-all duration-500 ${
              isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}
          >
            {language === 'ar' ? slide.subtitleAr : slide.subtitleEn}
          </p>

          {/* Search Bar */}
          <div className="bg-white/10 backdrop-blur-xl p-2 rounded-xl border border-white/10 max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search Input */}
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg">
                <MapPin className="w-5 h-5 text-white/70 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={language === 'ar' ? 'إلى أين تريد الذهاب؟' : 'Where do you want to go?'}
                  className="w-full bg-transparent text-white placeholder-white/50 outline-none"
                  dir={dir}
                />
              </div>

              {/* Guests Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowGuests(!showGuests)}
                  className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg min-w-[140px]"
                >
                  <Users className="w-5 h-5 text-white/70" />
                  <span className="text-white">
                    {guests} {language === 'ar' ? 'ضيف' : 'guests'}
                  </span>
                </button>
                
                {showGuests && (
                  <div className={`absolute top-full mt-2 ${dir === 'rtl' ? 'right-0' : 'left-0'} bg-white rounded-lg shadow-lg p-4 z-20 min-w-[200px]`}>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">
                        {language === 'ar' ? 'عدد الضيوف' : 'Number of guests'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold">{guests}</span>
                        <button
                          onClick={() => setGuests(Math.min(10, guests + 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button 
                onClick={handleSearch}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#775a19] hover:bg-[#957a3a] text-white font-bold rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
                <span>{language === 'ar' ? 'استكشف' : 'EXPLORE'}</span>
              </button>
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="flex items-center gap-2 mt-8">
            {heroSlides.map((s, index) => (
              <button
                key={s.id}
                onClick={() => goToSlide(index)}
                className={`group relative h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 bg-[#D4B896]'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              >
                <span className="sr-only">
                  {language === 'ar' ? s.titleAr : s.titleEn}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-[#D4B896] transition-all duration-100"
          style={{
            width: `${((currentSlide + 1) / heroSlides.length) * 100}%`,
          }}
        />
      </div>
    </section>
  );
}
