'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, ArrowRight, MapPin, Star, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { marketplaceService } from '../infrastructure/marketplace-service';
import { Product } from '../types';

export default function MarketHighlights() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await marketplaceService.getProducts();
        // Take only the first 6 products for highlights
        setProducts(data.slice(0, 6));
      } catch (error) {
        console.error('Error fetching market highlights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleImageError = (productId: string) => {
    setImageErrors(prev => new Set(prev).add(productId));
  };

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-4" />
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-[200px] h-[280px] bg-gray-100 animate-pulse rounded-2xl shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold mb-1">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider">{isRTL ? 'سوق ضيف' : 'Dayf Market'}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {isRTL ? 'منتجات محلية مميزة' : 'Featured Local Products'}
            </h2>
            <p className="text-gray-600 mt-1 max-w-2xl text-sm">
              {isRTL 
                ? 'اكتشف وتسوق أفضل المنتجات السورية الأصيلة، تصلك إلى مكان إقامتك.' 
                : 'Discover and shop the best authentic Syrian products, delivered to your stay.'}
            </p>
          </div>
          <Link 
            href="/marketplace" 
            className="hidden md:flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
          >
            {isRTL ? 'تصفح السوق' : 'Browse Market'}
            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Link>
        </div>

        <div className="flex overflow-x-auto gap-6 pb-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col w-[200px] shrink-0"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                {product.image && !imageErrors.has(product.id) ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={() => handleImageError(product.id)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <Package className="w-8 h-8 text-emerald-300 mb-1" />
                    <span className="text-emerald-600 text-[10px] font-medium text-center px-2 line-clamp-1">
                      {product.name}
                    </span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  {product.location}
                </div>
              </div>
              
              <div className="p-3 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{product.name}</h3>
                
                <div className="flex items-center gap-1 mb-2 text-xs">
                  <Star className="w-3 h-3 fill-current text-amber-500" />
                  <span className="font-bold">{product.rating}</span>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                  <span className="font-bold text-emerald-600 text-sm">
                    {product.price.toLocaleString(isRTL ? 'ar-SA' : 'en-US')} ل.س
                  </span>
                  <Link 
                    href={`/marketplace/product/${product.id}`}
                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-gray-200 transition-colors"
                  >
                    {isRTL ? 'عرض' : 'View'}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link 
            href="/marketplace" 
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
          >
            {isRTL ? 'تصفح السوق' : 'Browse Market'}
            {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </Link>
        </div>
      </div>
    </section>
  );
}
