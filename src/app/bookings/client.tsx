/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bookings Page Client Component
 *
 * صفحة حجوزاتي للمستخدم - متصلة بالبيانات الحقيقية
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header, Footer, BottomNav } from '@/components/dayf';
import { BookingStatus } from '@/core/types/enums';

// Booking data type - matches API response
interface Booking {
  id: string;
  serviceId: string;
  serviceTitle: string;
  serviceImage: string;
  serviceLocation: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

const statusConfig = {
  PENDING: {
    label: 'قيد الانتظار',
    icon: Clock,
    classes: 'bg-amber-50 text-amber-600 border-amber-200',
    iconClasses: 'text-amber-500'
  },
  CONFIRMED: {
    label: 'مؤكد',
    icon: CheckCircle2,
    classes: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    iconClasses: 'text-emerald-500'
  },
  CANCELLED: {
    label: 'ملغي',
    icon: XCircle,
    classes: 'bg-red-50 text-red-600 border-red-200',
    iconClasses: 'text-red-500'
  },
  COMPLETED: {
    label: 'مكتمل',
    icon: CheckCircle2,
    classes: 'bg-blue-50 text-blue-600 border-blue-200',
    iconClasses: 'text-blue-500'
  }
};

// Demo user ID - in production this would come from auth session
const DEMO_USER_ID = 'demo-user';

export default function BookingsClient() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/user/${DEMO_USER_ID}`);

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('فشل في تحميل الحجوزات. يرجى المحاولة مرة أخرى.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysCount = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredBookings = bookings.filter(booking => {
    const checkInDate = new Date(booking.checkIn);
    const now = new Date();

    if (activeTab === 'upcoming') {
      return checkInDate >= now && booking.status !== 'CANCELLED';
    } else if (activeTab === 'past') {
      return checkInDate < now || booking.status === 'COMPLETED';
    }
    return true;
  });

  // Parse images JSON string
  const getServiceImage = (images: string) => {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '/placeholder.jpg';
    } catch {
      return images || '/placeholder.jpg';
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F8F5F0]">
      <Header />

      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">حجوزاتي</h1>
          <p className="text-gray-600">تتبع وإدارة حجوزاتك السياحية</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'upcoming', label: 'القادمة' },
            { id: 'past', label: 'السابقة' },
            { id: 'all', label: 'الكل' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <p className="text-red-700 font-medium">{error}</p>
              <button
                onClick={fetchBookings}
                className="text-red-600 underline text-sm mt-1"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBookings.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد حجوزات</h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'upcoming'
                ? 'لم تقم بأي حجوزات قادمة بعد'
                : activeTab === 'past'
                ? 'لا توجد حجوزات سابقة'
                : 'لم تقم بأي حجوزات بعد'}
            </p>
            <Button
              onClick={() => router.push('/services')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8"
            >
              <Plus className="w-5 h-5 mr-2" />
              استكشف الخدمات
            </Button>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map(booking => {
              const status = statusConfig[booking.status];
              const StatusIcon = status.icon;

              return (
                <Link
                  key={booking.id}
                  href={`/services/${booking.serviceId}`}
                  className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-64 h-48 md:h-auto relative flex-shrink-0">
                      <img
                        src={getServiceImage(booking.serviceImage)}
                        alt={booking.serviceTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border ${status.classes}`}>
                        <StatusIcon className={`w-4 h-4 ${status.iconClasses}`} />
                        {status.label}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-3">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {booking.serviceTitle}
                          </h3>

                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{booking.serviceLocation}</span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-emerald-500" />
                              <span>{formatDate(booking.checkIn)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-emerald-500" />
                              <span>{booking.guests} ضيوف</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-3">
                          <div className="text-sm text-gray-500">
                            {getDaysCount(booking.checkIn, booking.checkOut)} ليالي
                          </div>
                          <div className="text-2xl font-bold text-emerald-600">
                            ${booking.totalPrice}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
      <BottomNav />
    </main>
  );
}
