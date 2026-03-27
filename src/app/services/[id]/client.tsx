'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, MapPin, Heart, Share2, ChevronLeft, ChevronRight, 
  Loader2, Users, Bed, Bath, Calendar, MessageCircle,
  Check, X, Minus, Plus, AlertCircle, MessageSquare, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Service } from '@/features/services/types';
import { ReviewList, ReviewForm } from '@/features/reviews';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Review type constant (matches Prisma enum)
const REVIEW_TYPE_SERVICE = 'SERVICE';

const DEMO_USER_ID = 'demo-user';

export default function ServiceDetailsClient() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [booking, setBooking] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    try {
      const response = await fetch(`/api/services/${serviceId}`);
      if (response.ok) {
        const data = await response.json();
        setService(data);
      } else {
        toast.error('الخدمة غير موجودة');
        router.push('/services');
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error('حدث خطأ في تحميل الخدمة');
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (service?.images && service.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % service.images.length);
    }
  };

  const prevImage = () => {
    if (service?.images && service.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + service.images.length) % service.images.length);
    }
  };

  const toggleFavorite = async () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'تمت الإزالة من المفضلة' : 'تمت الإضافة إلى المفضلة');
  };

  // Calculate nights
  const calculateNights = () => {
    if (!booking.checkIn || !booking.checkOut) return 0;
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const nights = calculateNights();
  const subtotal = service ? service.price * nights : 0;
  const serviceFee = Math.round(subtotal * 0.1); // 10% service fee
  const total = subtotal + serviceFee;

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get max check-in date (3 months from now)
  const getMaxDate = () => {
    const max = new Date();
    max.setMonth(max.getMonth() + 3);
    return max.toISOString().split('T')[0];
  };

  // Handle check-in change
  const handleCheckInChange = (date: string) => {
    setBooking(prev => {
      const newBooking = { ...prev, checkIn: date };
      // Auto-set check-out to next day
      if (date && (!prev.checkOut || new Date(prev.checkOut) <= new Date(date))) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        newBooking.checkOut = nextDay.toISOString().split('T')[0];
      }
      return newBooking;
    });
  };

  // Handle guest count change
  const updateGuests = (delta: number) => {
    setBooking(prev => ({
      ...prev,
      guests: Math.max(1, Math.min(prev.guests + delta, service?.maxGuests || 10))
    }));
  };

  // Submit booking
  const handleBooking = async () => {
    if (!booking.checkIn || !booking.checkOut) {
      toast.error('يرجى اختيار تواريخ الحجز');
      return;
    }

    if (!service) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: DEMO_USER_ID,
          hostId: service.hostId,
          serviceId: service.id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: booking.guests,
          totalPrice: total,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('تم إنشاء الحجز بنجاح!');
        router.push('/bookings');
      } else {
        const error = await response.json();
        toast.error(error.error || 'فشل في إنشاء الحجز');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('حدث خطأ في إنشاء الحجز');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">الخدمة غير موجودة</h2>
          <Link href="/services" className="text-emerald-600 hover:underline">
            العودة للخدمات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Image Gallery */}
      <div className="relative h-[50vh] md:h-[60vh] bg-black">
        {service.images && service.images.length > 0 && (
          <>
            <img
              src={service.images[currentImageIndex]}
              alt={service.title}
              className="w-full h-full object-cover"
            />
            {service.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {service.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
        
        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={toggleFavorite}
            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
          </button>
          <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors">
            <Share2 className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              {/* Title & Rating */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-emerald-600 text-sm font-medium">{service.type}</span>
                  <h1 className="text-2xl font-bold text-gray-900 mt-1">{service.title}</h1>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                  <Star className="w-5 h-5 text-amber-400 fill-current" />
                  <span className="font-bold">{service.rating}</span>
                  <span className="text-gray-500 text-sm">({service.reviews} تقييم)</span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <MapPin className="w-5 h-5" />
                <span>{service.location}</span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="font-bold text-gray-900 mb-2">الوصف</h2>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>

              {/* Room Details */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Users className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-600">{service.maxGuests} ضيوف</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Bed className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-600">{service.bedrooms} غرف</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Bed className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-600">{service.beds} أسرة</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Bath className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <p className="text-sm text-gray-600">{service.baths} حمام</p>
                </div>
              </div>

              {/* Amenities */}
              {service.amenities && service.amenities.length > 0 && (
                <div className="mb-6">
                  <h2 className="font-bold text-gray-900 mb-3">المرافق</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {service.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-600">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {service.features && service.features.length > 0 && (
                <div>
                  <h2 className="font-bold text-gray-900 mb-3">المميزات</h2>
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feature, idx) => (
                      <span key={idx} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Reviews Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  المراجعات والتقييمات
                </h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      اكتب مراجعة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>اكتب مراجعتك</DialogTitle>
                    </DialogHeader>
                    <ReviewForm
                      referenceId={serviceId}
                      type={REVIEW_TYPE_SERVICE}
                      authorId={DEMO_USER_ID}
                      onSuccess={(reviewId) => {
                        toast.success('تم نشر مراجعتك بنجاح!');
                        // Refresh the page to show new review
                        window.location.reload();
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              
              <ReviewList
                referenceId={serviceId}
                type={REVIEW_TYPE_SERVICE}
                currentUserId={DEMO_USER_ID}
              />
            </motion.div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-2xl font-bold text-gray-900">${service.price}</span>
                  <span className="text-gray-500"> / لليلة</span>
                </div>
              </div>

              {/* Date Pickers */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
                <div className="grid grid-cols-2 divide-x divide-gray-200">
                  <div className="p-3">
                    <label className="block text-xs text-gray-500 mb-1">تسجيل الوصول</label>
                    <input
                      type="date"
                      value={booking.checkIn}
                      onChange={(e) => handleCheckInChange(e.target.value)}
                      min={getMinDate()}
                      max={getMaxDate()}
                      className="w-full text-sm font-medium bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className="p-3">
                    <label className="block text-xs text-gray-500 mb-1">تسجيل المغادرة</label>
                    <input
                      type="date"
                      value={booking.checkOut}
                      onChange={(e) => setBooking(prev => ({ ...prev, checkOut: e.target.value }))}
                      min={booking.checkIn || getMinDate()}
                      max={getMaxDate()}
                      className="w-full text-sm font-medium bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
                
                {/* Guests Selector */}
                <div className="border-t border-gray-200 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">الضيوف</p>
                    <p className="font-medium">{booking.guests} {booking.guests === 1 ? 'ضيف' : 'ضيوف'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateGuests(-1)}
                      disabled={booking.guests <= 1}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{booking.guests}</span>
                    <button
                      onClick={() => updateGuests(1)}
                      disabled={booking.guests >= (service.maxGuests || 10)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Booking Button */}
              <button
                onClick={handleBooking}
                disabled={isSubmitting || !booking.checkIn || !booking.checkOut}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الحجز...
                  </>
                ) : (
                  'احجز الآن'
                )}
              </button>

              <p className="text-center text-gray-500 text-sm mt-3">لن يتم تحصيل أي مبلغ حالياً</p>

              {/* Escrow Protection Badge */}
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm">حماية ضيف المالية</h4>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      يُحتفظ بمبلغك في حساب وسيط آمن (Escrow) ولا يُسلّم للمضيف إلا بعد انتهاء إقامتك بنجاح.
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              {nights > 0 && (
                <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">${service.price} x {nights} {nights === 1 ? 'ليلة' : 'ليالي'}</span>
                    <span className="font-medium">${subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">رسوم الخدمة (10%)</span>
                    <span className="font-medium">${serviceFee}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="font-bold">المجموع</span>
                    <span className="font-bold text-lg">${total}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
