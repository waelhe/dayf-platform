/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * BottomNav Component
 * شريط التنقل السفلي للجوال
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Search, Grid3X3, Heart, User, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  onWishlistClick?: () => void;
}

export function BottomNav({ onWishlistClick }: BottomNavProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();

  const navItems = [
    {
      id: 'home',
      icon: Home,
      labelAr: 'الرئيسية',
      labelEn: 'Home',
      href: '/',
    },
    {
      id: 'explore',
      icon: Search,
      labelAr: 'استكشف',
      labelEn: 'Explore',
      href: '/services',
    },
    {
      id: 'marketplace',
      icon: ShoppingBag,
      labelAr: 'السوق',
      labelEn: 'Market',
      href: '/marketplace',
    },
    {
      id: 'wishlist',
      icon: Heart,
      labelAr: 'المفضلة',
      labelEn: 'Wishlist',
      href: user ? '/profile/wishlist' : '/login',
      onClick: onWishlistClick,
    },
    {
      id: 'profile',
      icon: User,
      labelAr: 'حسابي',
      labelEn: 'Profile',
      href: user ? '/profile' : '/login',
    },
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.id === 'home') return pathname === '/';
    if (item.id === 'explore') return pathname.startsWith('/services') || pathname.startsWith('/destinations') || pathname.startsWith('/activities');
    if (item.id === 'marketplace') return pathname.startsWith('/marketplace');
    if (item.id === 'wishlist') return pathname.includes('wishlist');
    if (item.id === 'profile') return pathname.startsWith('/profile');
    return false;
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 md:hidden" 
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const active = isActive(item);
          
          if (item.onClick) {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  active ? 'text-[#0D4D3A]' : 'text-gray-400'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${active ? 'text-[#0D4D3A]' : 'text-gray-400'}`}
                />
                <span className="text-xs font-medium">
                  {language === 'ar' ? item.labelAr : item.labelEn}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                active ? 'text-[#0D4D3A]' : 'text-gray-400'
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${active ? 'text-[#0D4D3A]' : 'text-gray-400'}`}
              />
              <span className="text-xs font-medium">
                {language === 'ar' ? item.labelAr : item.labelEn}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
