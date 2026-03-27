/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ServiceSection Component
 * قسم عرض الخدمات
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Loader2, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

interface Service {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  images: string[];
  type: string;
  isPopular?: boolean;
  hostName?: string;
  hostAvatar?: string;
  isSuperhost?: boolean;
}

interface ServiceSectionProps {
  title: string;
  subtitle?: string;
  category?: string;
  filterPopular?: boolean;
  limit?: number;
  viewAllPath?: string;
}

export default function ServiceSection({ 
  title, 
  subtitle, 
  category, 
  filterPopular = false,
  limit = 8,
  viewAllPath 
}: ServiceSectionProps) {
  const { language } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchServices();
  }, [category, limit, filterPopular]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      let url = '/api/services?';
      const params = new URLSearchParams();
      
      if (category) {
        params.set('category', category);
      }
      if (filterPopular) {
        params.set('popular', 'true');
      }
      params.set('limit', String(limit));
      
      url += params.toString();
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Fetched ${data.services?.length || 0} services for category ${category}`);
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.8 
        : scrollLeft + clientWidth * 0.8;
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Calculate discount percentage
  const getDiscountPercentage = (originalPrice: number, price: number) => {
    if (originalPrice && originalPrice > price) {
      return Math.round((1 - price / originalPrice) * 100);
    }
    return null;
  };

  if (!loading && services.length === 0) return null;

  return (
    <section className="py-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex justify-between items-end mb-6">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-gray-500 mt-1 max-w-2xl">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {viewAllPath && (
              <Link href={viewAllPath} className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                {language === 'ar' ? <ArrowLeft className="w-5 h-5 text-gray-900" /> : <ArrowRight className="w-5 h-5 text-gray-900" />}
              </Link>
            )}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => scroll('right')}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm bg-white"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <button 
                onClick={() => scroll('left')}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm bg-white"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-4 md:gap-6 overflow-hidden pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[280px] md:min-w-[300px] h-[320px] bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {services.map((service, index) => {
              const discount = service.originalPrice 
                ? getDiscountPercentage(service.originalPrice, service.price) 
                : null;
              
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="snap-start flex-shrink-0 w-[280px] md:w-[300px]"
                >
                  <Link href={`/services/${service.id}`} className="block group">
                    {/* Image */}
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                      <img
                        src={service.images?.[0] || '/placeholder.jpg'}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Discount Badge */}
                      {discount && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          -{discount}%
                        </div>
                      )}
                      
                      {/* Superhost Badge */}
                      {service.isSuperhost && (
                        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3 text-emerald-600" />
                          <span>{language === 'ar' ? 'مضيف متميز' : 'Superhost'}</span>
                        </div>
                      )}
                      
                      {/* Favorite Button */}
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(service.id);
                        }}
                        className="absolute top-3 left-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                      >
                        <svg 
                          className={`w-5 h-5 ${favorites.includes(service.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                      
                      {/* Rating Badge */}
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                        <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-sm font-bold">{service.rating}</span>
                        {service.reviews > 0 && (
                          <span className="text-xs text-gray-500">({service.reviews})</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div>
                      {/* Host Info */}
                      {service.hostName && (
                        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mb-1">
                          {service.hostAvatar && (
                            <img 
                              src={service.hostAvatar} 
                              alt={service.hostName}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          )}
                          <span>{service.hostName}</span>
                          {service.isSuperhost && (
                            <BadgeCheck className="w-3 h-3 text-emerald-600" />
                          )}
                        </p>
                      )}
                      
                      <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-[#0D4D3A] transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{service.location}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold text-gray-900">${service.price}</span>
                        {service.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">${service.originalPrice}</span>
                        )}
                        <span className="text-sm text-gray-500">/ {language === 'ar' ? 'ليلة' : 'night'}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
