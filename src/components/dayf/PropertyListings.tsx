/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PropertyListings Component
 * 
 * Horizontal scrolling carousel of services from API
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { PropertyCard } from './PropertyCard';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Service {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  images: string[];
  type: string;
  bedrooms: number;
  baths: number;
  maxGuests: number;
}

interface Property {
  id: string | number;
  images: string[];
  location: { ar: string; en: string };
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  currency: string;
  propertyType: 'hotel' | 'apartment' | 'villa' | 'traditional';
  guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  isSuperhost?: boolean;
  isInstantBook?: boolean;
}

export function PropertyListings() {
  const { language } = useLanguage();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert Service to Property format for PropertyCard
  const serviceToProperty = (service: Service): Property => {
    // Handle images - ensure it's an array
    let images: string[] = ['/placeholder.jpg'];
    
    if (Array.isArray(service.images) && service.images.length > 0) {
      images = service.images.filter((img: string) => img && typeof img === 'string' && img.trim() !== '');
      if (images.length === 0) images = ['/placeholder.jpg'];
    }

    return {
      id: service.id,
      images,
      location: { ar: service.location, en: service.location },
      name: { ar: service.title, en: service.title },
      description: { ar: service.description, en: service.description },
      rating: service.rating,
      reviewCount: service.reviews,
      pricePerNight: service.price,
      currency: '$',
      propertyType: 'traditional',
      guests: service.maxGuests,
      bedrooms: service.bedrooms,
      bathrooms: service.baths,
      amenities: [],
      isSuperhost: service.rating >= 4.8,
      isInstantBook: true,
    };
  };

  const toggleFavorite = (id: string | number) => {
    const idStr = String(id);
    setFavorites((prev) =>
      prev.includes(idStr) ? prev.filter((fid) => fid !== idStr) : [...prev, idStr]
    );
  };

  const handlePropertyClick = (serviceId: string) => {
    router.push(`/services/${serviceId}`);
  };

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      checkScrollButtons();
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [services]);

  if (loading) {
    return (
      <section className="py-10 sm:py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#0D4D3A]" />
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#0D4D3A]">
              {language === 'ar' ? 'إقامات مقترحة' : 'Recommended Stays'}
            </h2>
            <p className="text-gray-500 mt-2">
              {language === 'ar' 
                ? 'اكتشف أفضل أماكن الإقامة في سوريا'
                : 'Discover the best places to stay in Syria'}
            </p>
          </div>

          {/* Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                canScrollLeft
                  ? 'border-gray-300 hover:border-[#0D4D3A] hover:text-[#0D4D3A]'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                canScrollRight
                  ? 'border-gray-300 hover:border-[#0D4D3A] hover:text-[#0D4D3A]'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrolling Container */}
      <div className="relative">
        {/* Left Gradient Fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        )}
        
        {/* Right Gradient Fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        )}

        {/* Scrollable Cards */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto px-4 sm:px-8 pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {services.map((service) => {
            const property = serviceToProperty(service);
            return (
              <div
                key={service.id}
                onClick={() => handlePropertyClick(service.id)}
                className="flex-shrink-0 w-[280px] sm:w-[300px] cursor-pointer"
              >
                <PropertyCard
                  property={property}
                  onFavorite={toggleFavorite}
                  isFavorite={favorites.includes(String(service.id))}
                />
              </div>
            );
          })}
          
          {/* View All Card */}
          <Link href="/services" className="flex-shrink-0 w-[280px] sm:w-[300px]">
            <div className="h-full min-h-[320px] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-4 hover:border-[#0D4D3A] hover:bg-[#F8F5F0] transition-colors cursor-pointer group">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#0D4D3A] group-hover:text-white transition-colors">
                <ChevronRight className="w-8 h-8 text-gray-400 group-hover:text-white" />
              </div>
              <p className="font-semibold text-gray-600 group-hover:text-[#0D4D3A]">
                {language === 'ar' ? 'عرض جميع الإقامات' : 'View All Stays'}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
