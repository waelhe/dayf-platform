'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Heart, ChevronRight, ChevronLeft, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Service } from '../types';

interface ServiceCardProps {
  service: Service;
  activeColorClass?: string;
  activeTextClass?: string;
  activeBgLightClass?: string;
  className?: string;
  userId?: string;
}

export default function ServiceCard({ 
  service, 
  activeColorClass = 'bg-emerald-600', 
  activeTextClass = 'text-emerald-600', 
  activeBgLightClass = 'bg-emerald-50',
  className = 'w-[280px] md:w-[320px]',
  userId,
}: ServiceCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (service.images && service.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % service.images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (service.images && service.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + service.images.length) % service.images.length);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.error('يرجى تسجيل الدخول لإضافة المفضلة');
      return;
    }

    if (!service.id) return;

    setIsFavoriteLoading(true);
    try {
      const response = await fetch('/api/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          serviceId: service.id,
          favoriteId,
        }),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        toast.success(isFavorite ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة إلى المفضلة');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(service.price);

  // Format original price if exists
  const formattedOriginalPrice = service.originalPrice 
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(service.originalPrice)
    : null;

  // Calculate discount percentage
  const discountPercentage = service.originalPrice && service.originalPrice > service.price
    ? Math.round((1 - service.price / service.originalPrice) * 100)
    : null;

  const currentImage = service.images && service.images.length > 0 
    ? service.images[currentImageIndex] 
    : 'https://images.unsplash.com/photo-1585076641394-6302f23b7b65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex flex-col shrink-0 cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
        {/* Image Carousel */}
        <Link href={`/services/${service.id}`} className="block w-full h-full">
          <img 
            src={currentImage} 
            alt={service.title || 'Service'} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </Link>

        {/* Discount Badge */}
        {discountPercentage && (
          <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPercentage}%
          </div>
        )}

        {/* Superhost Badge */}
        {service.isSuperhost && (
          <div className="absolute bottom-2 right-2 z-10 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <BadgeCheck className="w-3 h-3 text-emerald-600" />
            <span>مضيف متميز</span>
          </div>
        )}

        {/* Carousel Controls */}
        {isHovered && service.images && service.images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute top-1/2 right-2 -translate-y-1/2 p-1 bg-white/90 backdrop-blur-sm rounded-full text-gray-900 hover:bg-white hover:scale-110 transition-all z-10 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute top-1/2 left-2 -translate-y-1/2 p-1 bg-white/90 backdrop-blur-sm rounded-full text-gray-900 hover:bg-white hover:scale-110 transition-all z-10 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Carousel Dots */}
        {service.images && service.images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
            {service.images.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 w-1 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/60'}`}
              />
            ))}
          </div>
        )}

        {/* Favorite Button */}
        <button 
          onClick={toggleFavorite}
          disabled={isFavoriteLoading}
          className="absolute top-2 left-2 z-10 p-1 group/heart"
        >
          <Heart 
            className={`w-5 h-5 transition-all ${
              isFavorite 
                ? 'fill-red-500 stroke-red-500 scale-110' 
                : 'text-white stroke-[2px] drop-shadow-md group-hover/heart:scale-110'
            }`} 
          />
        </button>
      </div>
      
      <div className="flex flex-col gap-0.5">
        {/* Host Info */}
        {service.hostName && (
          <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
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

        <div className="flex justify-between items-start">
          <Link href={`/services/${service.id}`} className="flex-1 min-w-0">
            <h3 className="text-[14px] font-bold text-gray-900 truncate">
              {service.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3 h-3 fill-current text-gray-900" />
            <span className="text-xs font-medium text-gray-900">{service.rating}</span>
            {service.reviews > 0 && (
              <span className="text-xs text-gray-500">({service.reviews})</span>
            )}
          </div>
        </div>
        
        <p className="text-[13px] text-gray-500 truncate">
          {service.location}
        </p>
        
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[14px] font-bold text-gray-900">{formattedPrice}</span>
          {formattedOriginalPrice && (
            <span className="text-[12px] text-gray-400 line-through">{formattedOriginalPrice}</span>
          )}
          <span className="text-[13px] text-gray-600">/ لليلة</span>
        </div>
      </div>
    </motion.div>
  );
}
