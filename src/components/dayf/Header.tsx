/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Header Component
 * شريط التنقل الرئيسي
 */

'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Menu, X, Globe, User, Heart, LogOut, LayoutDashboard, Calendar } from 'lucide-react';

interface HeaderProps {
  onWishlistClick?: () => void;
}

export function Header({ onWishlistClick }: HeaderProps) {
  const { language, setLanguage, dir } = useLanguage();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
  };

  const navItems = [
    { 
      ar: 'الخدمات', 
      en: 'Services', 
      href: '/services' 
    },
    { 
      ar: 'الوجهات', 
      en: 'Destinations', 
      href: '/destinations' 
    },
    { 
      ar: 'الأنشطة', 
      en: 'Activities', 
      href: '/activities' 
    },
    { 
      ar: 'السوق', 
      en: 'Market', 
      href: '/marketplace' 
    },
    { 
      ar: 'المجتمع', 
      en: 'Community', 
      href: '/community' 
    },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#0D4D3A] flex items-center justify-center">
              <span className="text-white font-bold text-xl font-serif">ض</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#0D4D3A] font-serif tracking-tight">
                {language === 'ar' ? 'ضيف' : 'DAYF'}
              </span>
              <span className="text-[10px] text-[#775a19] tracking-widest uppercase hidden sm:block">
                {language === 'ar' ? 'السياحة السورية' : 'Syrian Tourism'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-[#0D4D3A] font-medium transition-colors"
              >
                {language === 'ar' ? item.ar : item.en}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Wishlist Button */}
            {onWishlistClick && (
              <button
                onClick={onWishlistClick}
                className="hidden sm:flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-[#775a19] font-medium transition-colors"
              >
                <Heart className="w-4 h-4" />
              </button>
            )}

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-[#775a19] font-medium transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* User Section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0D4D3A] flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.firstName || user.displayName}
                  </span>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className={`absolute ${dir === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50`}>
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" />
                      {language === 'ar' ? 'حسابي' : 'My Profile'}
                    </Link>
                    <Link
                      href="/bookings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <Calendar className="w-4 h-4" />
                      {language === 'ar' ? 'حجوزاتي' : 'My Bookings'}
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {language === 'ar' ? 'طلباتي' : 'My Orders'}
                    </Link>
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-[#0D4D3A] text-white rounded-lg font-semibold hover:bg-[#1A5F4A] transition-colors"
              >
                {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-[#0D4D3A]"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 mt-4">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  {language === 'ar' ? item.ar : item.en}
                </Link>
              ))}
              
              {onWishlistClick && (
                <button
                  onClick={() => {
                    onWishlistClick();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Heart className="w-5 h-5" />
                  {language === 'ar' ? 'المفضلة' : 'Wishlist'}
                </button>
              )}

              {!user && (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="mt-4 w-full py-3 bg-[#0D4D3A] text-white rounded-lg font-semibold text-center"
                >
                  {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
