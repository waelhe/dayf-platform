/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Booking Management Component
 * 
 * مكون إدارة الحجوزات للمزودين
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, CheckCircle2, XCircle, Clock, User, Mail, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { BookingStatus } from '@/core/types/enums';

// Types for booking data from API
interface BookingData {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  userId: string;
  userEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

interface BookingManagementProps {
  providerId: string;
}

export default function BookingManagement({ providerId }: BookingManagementProps) {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/provider/${providerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching provider bookings:', err);
      setError('فشل في تحميل الحجوزات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleUpdateStatus = async (bookingId: string, newStatus: 'CONFIRMED' | 'CANCELLED') => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      toast.success(newStatus === 'CONFIRMED' ? 'تم تأكيد الحجز بنجاح' : 'تم إلغاء الحجز');
    } catch (err) {
      console.error('Error updating booking status:', err);
      toast.error('فشل في تحديث حالة الحجز.');
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusClasses = (status: BookingStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-600';
      case 'CANCELLED':
        return 'bg-red-50 text-red-600';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-600';
      default:
        return 'bg-amber-50 text-amber-600';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ar-SA');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">إدارة الحجوزات</h3>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            لا توجد حجوزات حالياً.
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getStatusClasses(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{booking.serviceTitle}</h4>
                        <p className="text-xs text-gray-500">معرف الحجز: {booking.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(booking.checkIn)} إلى {formatDate(booking.checkOut)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{booking.guests} ضيوف</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{booking.userEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                        <span>إجمالي المبلغ: ${booking.totalPrice}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-3 min-w-[150px]">
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                          className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                        >
                          تأكيد الحجز
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                          className="w-full py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                        >
                          إلغاء الحجز
                        </button>
                      </>
                    )}
                    {booking.status === 'CONFIRMED' && (
                      <div className="text-center py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold">
                        مؤكد
                      </div>
                    )}
                    {booking.status === 'CANCELLED' && (
                      <div className="text-center py-2 bg-red-50 text-red-700 rounded-xl font-bold">
                        ملغي
                      </div>
                    )}
                    {booking.status === 'COMPLETED' && (
                      <div className="text-center py-2 bg-blue-50 text-blue-700 rounded-xl font-bold">
                        مكتمل
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
