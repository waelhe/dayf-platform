/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * PropertyCard Component
 * بطاقة الخدمة/الإقامة
 */

'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Heart, Star, ChevronLeft, ChevronRight, Users, Bed, Bath, Home } from 'lucide-react';
import Image from 'next/image';

export interface Property {
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

interface PropertyCardProps {
  property: Property;
  onFavorite?: (id: string | number) => void;
  isFavorite?: boolean;
  onClick?: () => void;
}

export function PropertyCard({ property, onFavorite, isFavorite = false, onClick }: PropertyCardProps) {
  const { language, dir } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    setImageError(false);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    setImageError(false);
  };

  const validImages = property.images.filter(img => img && img.trim() !== '');
  const displayImage = validImages.length > 0 ? validImages[currentImageIndex % validImages.length] : null;

  // Handle image error - show placeholder
  const handleImageError = () => {
    setImageError(true);
  };

  // Reset error when image changes
  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index);
    setImageError(false);
  };

  return (
    <div 
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Image Carousel */}
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-100">
        {displayImage && !imageError ? (
          <Image
            src={displayImage}
            alt={language === 'ar' ? property.name.ar : property.name.en}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={handleImageError}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0D4D3A]/10 to-[#0D4D3A]/20">
            <Home className="w-12 h-12 text-[#0D4D3A]/40 mb-2" />
            <span className="text-[#0D4D3A]/60 text-sm">
              {language === 'ar' ? property.name.ar : property.name.en}
            </span>
          </div>
        )}

        {/* Favorite Button */}
        {onFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onFavorite(property.id);
            }}
            className={`absolute top-3 ${dir === 'rtl' ? 'left-3' : 'right-3'} p-2 rounded-full transition-all ${
              isFavorite ? 'bg-white' : 'bg-white/80 hover:bg-white'
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            />
          </button>
        )}

        {/* Superhost Badge */}
        {property.isSuperhost && (
          <div className={`absolute top-3 ${dir === 'rtl' ? 'right-3' : 'left-3'} bg-white px-2 py-1 rounded-md text-xs font-semibold`}>
            {language === 'ar' ? 'مضيف متميز' : 'Superhost'}
          </div>
        )}

        {/* Image Navigation */}
        {validImages.length > 1 && isHovered && (
          <>
            <button
              onClick={prevImage}
              className={`absolute ${dir === 'rtl' ? 'right-2' : 'left-2'} top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}
            >
              {dir === 'rtl' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <button
              onClick={nextImage}
              className={`absolute ${dir === 'rtl' ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}
            >
              {dir === 'rtl' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </>
        )}

        {/* Image Dots */}
        {validImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {validImages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleImageChange(index);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentImageIndex % validImages.length ? 'bg-white w-2' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Instant Book Badge */}
        {property.isInstantBook && (
          <div className={`absolute bottom-3 ${dir === 'rtl' ? 'left-3' : 'right-3'} bg-[#0D4D3A] px-2 py-1 rounded text-white text-xs font-semibold`}>
            {language === 'ar' ? 'حجز فوري' : 'Instant Book'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1">
        {/* Location & Rating */}
        <div className="flex justify-between items-start">
          <p className="text-sm text-gray-500 truncate flex-1">
            {language === 'ar' ? property.location.ar : property.location.en}
          </p>
          {property.rating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-4 h-4 fill-gray-800" />
              <span className="text-sm font-medium">{property.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-gray-800 line-clamp-1">
          {language === 'ar' ? property.name.ar : property.name.en}
        </h3>

        {/* Specs */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {property.guests}
          </span>
          <span className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            {property.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-4 h-4" />
            {property.bathrooms}
          </span>
        </div>

        {/* Price */}
        <div className="pt-2">
          <span className="text-lg font-bold text-[#0D4D3A]">
            {property.currency}{property.pricePerNight.toLocaleString()}
          </span>
          <span className="text-gray-500 text-sm">
            {' '}/{language === 'ar' ? 'ليلة' : 'night'}
          </span>
        </div>
      </div>
    </div>
  );
}
