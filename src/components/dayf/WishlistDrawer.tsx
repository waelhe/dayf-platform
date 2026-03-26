/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * WishlistDrawer Component
 * قائمة المفضلة المنزلقة
 */

'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, X, Trash2, Share2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface WishlistItem {
  id: string;
  type: 'service' | 'product' | 'destination';
  image: string;
  name: string;
  location: string;
  price: number;
  currency: string;
  rating: number;
}

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: WishlistItem[];
  onRemove: (id: string) => void;
  loading?: boolean;
}

export function WishlistDrawer({ isOpen, onClose, items, onRemove, loading = false }: WishlistDrawerProps) {
  const { language, dir } = useLanguage();
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const removeSelected = () => {
    selectedItems.forEach((id) => onRemove(id));
    setSelectedItems([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} h-full w-full sm:w-96 bg-white z-50 shadow-2xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : dir === 'rtl' ? '-translate-x-full' : 'translate-x-full'
        }`}
        dir={dir}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h2 className="text-lg font-bold text-[#0D4D3A]">
              {language === 'ar' ? 'المفضلة' : 'Wishlist'}
            </h2>
            {!loading && (
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-sm text-gray-600">
                {items.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Bar */}
        {selectedItems.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
            <span className="text-sm text-gray-600">
              {selectedItems.length} {language === 'ar' ? 'محدد' : 'selected'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={removeSelected}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {language === 'ar' ? 'حذف' : 'Remove'}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="overflow-y-auto h-[calc(100vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-[#0D4D3A]" />
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Heart className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === 'ar' ? 'سجل الدخول للمتابعة' : 'Login to continue'}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {language === 'ar'
                  ? 'قم بتسجيل الدخول لحفظ العناصر المفضلة'
                  : 'Login to save your favorite items'}
              </p>
              <Link
                href="/login"
                onClick={onClose}
                className="px-6 py-2 bg-[#0D4D3A] text-white rounded-lg font-semibold hover:bg-[#1A5F4A] transition-colors"
              >
                {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Heart className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === 'ar' ? 'المفضلة فارغة' : 'Your wishlist is empty'}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {language === 'ar'
                  ? 'ابحث عن الخدمات وانقر على القلب لحفظها هنا'
                  : 'Search for services and click the heart to save them here'}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[#0D4D3A] text-white rounded-lg font-semibold hover:bg-[#1A5F4A] transition-colors"
              >
                {language === 'ar' ? 'ابدأ البحث' : 'Start Searching'}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.type === 'service' ? `/services/${item.id}` : 
                        item.type === 'product' ? `/marketplace/${item.id}` :
                        `/destinations/${item.id}`}
                  onClick={onClose}
                  className={`block p-4 hover:bg-gray-50 transition-colors ${
                    selectedItems.includes(item.id) ? 'bg-[#0D4D3A]/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Image */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {item.location}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-[#0D4D3A]">
                          {item.currency}{item.price}
                          <span className="text-gray-400 font-normal text-xs">
                            /{language === 'ar' ? 'ليلة' : 'night'}
                          </span>
                        </span>
                        {item.rating > 0 && (
                          <span className="text-sm text-gray-500">★ {item.rating}</span>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove(item.id);
                      }}
                      className="p-2 hover:bg-red-50 rounded-full self-start"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
            <Link
              href="/services"
              onClick={onClose}
              className="flex items-center justify-center gap-2 py-3 w-full bg-[#0D4D3A] text-white rounded-lg font-semibold hover:bg-[#1A5F4A] transition-colors"
            >
              {language === 'ar' ? 'استكشف المزيد' : 'Explore More'}
              {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
