'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Mail, Camera, Save, Loader2, Heart, MapPin, Star, Trash2, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Service } from '@/features/services/types';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  language: string;
}

interface ProfileProps {
  userId?: string;
  language?: string;
}

export default function Profile({ userId, language = 'ar' }: ProfileProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [favorites, setFavorites] = useState<Service[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'favorites'>('info');

  useEffect(() => {
    // Fetch user profile
    const fetchProfile = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setDisplayName(data.displayName || '');
          setPhotoURL(data.photoURL || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userId) return;
      setLoadingFavorites(true);
      try {
        const response = await fetch(`/api/favorites?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.favorites || []);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoadingFavorites(false);
      }
    };

    if (activeTab === 'favorites') {
      fetchFavorites();
    }
  }, [userId, activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, photoURL }),
      });

      if (response.ok) {
        setUser(prev => prev ? { ...prev, displayName, photoURL } : null);
        setIsEditing(false);
        toast.success(language === 'ar' ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(language === 'ar' ? 'فشل في تحديث الملف الشخصي' : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const removeFavorite = async (serviceId: string) => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/favorites?userId=${userId}&serviceId=${serviceId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setFavorites(prev => prev.filter(s => s.id !== serviceId));
        toast.success(language === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from favorites');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 max-w-md mx-auto">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please Sign In'}
          </h2>
          <p className="text-gray-600 mb-8">
            {language === 'ar' ? 'يجب عليك تسجيل الدخول للوصول إلى ملفك الشخصي.' : 'You need to sign in to access your profile.'}
          </p>
          <Link href="/" className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
            {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="h-32 bg-emerald-600 relative">
            <div className="absolute -bottom-12 right-8">
              <div className="relative">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-24 h-24 rounded-2xl border-4 border-white shadow-md object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-3xl">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1.5 rounded-lg shadow-lg border-2 border-white">
                  <Award className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
          <div className="pt-16 pb-8 px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                    {user.role}
                  </span>
                </div>
                <p className="text-gray-500 mt-1">{user.email}</p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
              >
                {isEditing ? (language === 'ar' ? 'إلغاء' : 'Cancel') : (language === 'ar' ? 'تعديل الملف' : 'Edit Profile')}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${
              activeTab === 'info' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Info'}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-6 py-3 rounded-xl font-bold transition-colors ${
              activeTab === 'favorites' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {language === 'ar' ? 'المفضلة' : 'Favorites'}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'info' ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
            >
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {language === 'ar' ? 'الاسم' : 'Name'}
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {language === 'ar' ? 'رابط الصورة' : 'Photo URL'}
                    </label>
                    <input
                      type="url"
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                    {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <User className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">{language === 'ar' ? 'الاسم' : 'Name'}</p>
                      <p className="font-bold text-gray-900">{user.displayName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <Mail className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                      <p className="font-bold text-gray-900">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
            >
              {loadingFavorites ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {language === 'ar' ? 'لا توجد عناصر في المفضلة' : 'No favorites yet'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {favorites.map((service) => (
                    <div key={service.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <img
                        src={service.images?.[0] || '/placeholder.jpg'}
                        alt={service.title}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{service.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          {service.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                          {service.rating}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/services/${service.id}`}
                          className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"
                        >
                          <MapPin className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => removeFavorite(service.id!)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
