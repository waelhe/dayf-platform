'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, MapPin, Star, Loader2, Grid, List } from 'lucide-react';
import { motion } from 'framer-motion';
import ServiceCard from '@/features/services/components/ServiceCard';
import { Service } from '@/features/services/types';
import { MAIN_CATEGORIES } from '@/features/services/data/categories';

export default function ServicesPageClient() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchServices();
  }, [selectedCategory, searchQuery]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      let url = '/api/services';
      const params = new URLSearchParams();
      
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-emerald-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">استكشف الخدمات</h1>
          <p className="text-emerald-100">اعثر على أفضل الخدمات في سوريا</p>
          
          {/* Search */}
          <div className="mt-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن خدمة..."
                className="w-full pr-12 pl-4 py-3 bg-white rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-4">
              <h3 className="font-bold text-gray-900 mb-4">التصنيفات</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-right px-4 py-2 rounded-xl transition-colors ${
                    selectedCategory === 'all' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  الكل
                </button>
                {MAIN_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-right px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                        selectedCategory === cat.id 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {loading ? '...' : `${services.length} خدمة متاحة`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Services Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد نتائج</h3>
                <p className="text-gray-600">جرب تغيير معايير البحث</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
              }>
                {services.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/services/${service.id}`}>
                      <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow ${
                        viewMode === 'list' ? 'flex gap-4 p-4' : ''
                      }`}>
                        {viewMode === 'grid' ? (
                          <>
                            <div className="relative aspect-square">
                              <img
                                src={service.images?.[0] || '/placeholder.jpg'}
                                alt={service.title}
                                className="w-full h-full object-cover"
                              />
                              {service.rating >= 4.8 && (
                                <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-gray-900">
                                  مفضل
                                </span>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-gray-900 mb-1">{service.title}</h3>
                              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                                <MapPin className="w-4 h-4" />
                                {service.location}
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-emerald-600">${service.price}</span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                                  <span className="text-sm">{service.rating}</span>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <img
                              src={service.images?.[0] || '/placeholder.jpg'}
                              alt={service.title}
                              className="w-32 h-32 object-cover rounded-xl"
                            />
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900">{service.title}</h3>
                              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <MapPin className="w-4 h-4" />
                                {service.location}
                              </div>
                              <p className="text-gray-600 text-sm mt-2 line-clamp-2">{service.description}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="font-bold text-emerald-600">${service.price}</span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-400 fill-current" />
                                  <span>{service.rating}</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
