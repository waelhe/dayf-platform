/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Footer Component
 * تذييل الصفحة
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  const { language, dir } = useLanguage();

  const quickLinks = [
    { ar: 'الخدمات', en: 'Services', href: '/services' },
    { ar: 'الوجهات', en: 'Destinations', href: '/destinations' },
    { ar: 'الأنشطة', en: 'Activities', href: '/activities' },
    { ar: 'السوق', en: 'Market', href: '/marketplace' },
    { ar: 'المجتمع', en: 'Community', href: '/community' },
  ];

  const supportLinks = [
    { ar: 'مركز المساعدة', en: 'Help Center', href: '/help' },
    { ar: 'تواصل معنا', en: 'Contact Us', href: '/contact' },
    { ar: 'الأسئلة الشائعة', en: 'FAQ', href: '/faq' },
  ];

  const legalLinks = [
    { ar: 'شروط الخدمة', en: 'Terms of Service', href: '/terms' },
    { ar: 'سياسة الخصوصية', en: 'Privacy Policy', href: '/privacy' },
    { ar: 'سياسة الإلغاء', en: 'Cancellation Policy', href: '/cancellation' },
  ];

  return (
    <footer className="bg-[#0D4D3A] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <span className="text-[#0D4D3A] font-bold text-xl font-serif">ض</span>
              </div>
              <span className="text-xl font-bold font-serif">
                {language === 'ar' ? 'ضيف' : 'DAYF'}
              </span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              {language === 'ar'
                ? 'منصة سياحية سورية متكاملة لاستكشاف سوريا وجمالها'
                : 'A comprehensive Syrian tourism platform to explore the beauty of Syria'}
            </p>
            <div className="flex gap-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-[#D4B896]">
              {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-white/70 hover:text-white transition-colors">
                    {language === 'ar' ? item.ar : item.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-[#D4B896]">
              {language === 'ar' ? 'الدعم' : 'Support'}
            </h4>
            <ul className="space-y-3 text-sm">
              {supportLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-white/70 hover:text-white transition-colors">
                    {language === 'ar' ? item.ar : item.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-[#D4B896]">
              {language === 'ar' ? 'تواصل معنا' : 'Contact'}
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-white/70">
                <Phone className="w-4 h-4" />
                <span dir="ltr">+963 11 123 4567</span>
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <Mail className="w-4 h-4" />
                <a href="mailto:info@dayf.sy" className="hover:text-white transition-colors">
                  info@dayf.sy
                </a>
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <MapPin className="w-4 h-4" />
                <span>{language === 'ar' ? 'دمشق، سوريا' : 'Damascus, Syria'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-xs">
            © 2024 {language === 'ar' ? 'ضيف للسياحة السورية' : 'Dayf Syrian Tourism'}.
          </p>
          <div className="flex items-center gap-6 text-xs">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-white/50 hover:text-white transition-colors">
                {language === 'ar' ? item.ar : item.en}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
