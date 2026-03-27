// صفحة تفاصيل النشاط السياحي
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Users,
  Star,
  Calendar,
  Share2,
  Heart,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { ActivityService, ACTIVITY_TYPE_LABELS, DIFFICULTY_LEVELS } from '@/features/tourism';
import type { ActivityResponse } from '@/features/tourism/infrastructure/activity-service';

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [participants, setParticipants] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    loadActivity();
  }, [slug]);
  
  const loadActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ActivityService.getActivityBySlug(slug);
      
      if (!data) {
        setError('النشاط غير موجود');
        return;
      }
      
      setActivity(data);
      setParticipants(data.minParticipants || 1);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBook = async () => {
    if (!activity) return;
    
    setIsSaving(true);
    
    try {
      // TODO: إنشاء حجز فعلي
      toast.success('تم إرسال طلب الحجز', {
        description: 'سيتم التواصل معك قريباً',
      });
    } catch (err: any) {
      toast.error('حدث خطأ', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };
  
  // حالة التحميل
  if (loading) {
    return <ActivitySkeleton />;
  }
  
  // حالة الخطأ
  if (error || !activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {error || 'النشاط غير موجود'}
            </h1>
            <p className="text-gray-500 mb-4">
              قد يكون النشاط غير متاح أو تم حذفه
            </p>
            <Button onClick={() => router.back()} variant="outline">
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const typeInfo = ACTIVITY_TYPE_LABELS[activity.type] || ACTIVITY_TYPE_LABELS.OTHER;
  const difficultyInfo = DIFFICULTY_LEVELS.find(d => d.value === activity.difficultyLevel);
  const images = activity.images?.length > 0 ? activity.images : ['/cities/damascus.png'];
  const included = activity.included || [];
  const excluded = activity.excluded || [];
  const requirements = activity.requirements || [];
  
  // حساب المدة
  const durationHours = Math.floor(activity.duration / 60);
  const durationMinutes = activity.duration % 60;
  const durationText = `${durationHours > 0 ? `${durationHours} ساعة` : ''} ${durationMinutes > 0 ? `${durationMinutes} دقيقة` : ''}`;
  
  // حساب السعر
  const pricePerPerson = activity.discountPrice || activity.price;
  const totalPrice = activity.pricePerPerson ? pricePerPerson * participants : pricePerPerson;
  
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* صورة الغلاف */}
      <div className="relative h-64 md:h-96 bg-gray-200">
        <img
          src={activity.coverImage || images[0]}
          alt={activity.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* معلومات العنوان */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-2 mb-2">
              <Badge className="bg-white/20 backdrop-blur">
                {typeInfo.icon} {typeInfo.ar}
              </Badge>
              {activity.isFeatured && (
                <Badge className="bg-amber-500">مميز</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{activity.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {activity.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {durationText}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {activity.rating.toFixed(1)} ({activity.reviewCount} تقييم)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* المحتوى الرئيسي */}
          <div className="lg:col-span-2 space-y-6">
            {/* معلومات سريعة */}
            <Card className="border-0 shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Clock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <div className="font-bold">{durationText}</div>
                    <div className="text-sm text-gray-500">المدة</div>
                  </div>
                  
                  <div className="text-center">
                    <Users className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <div className="font-bold">{activity.minParticipants}-{activity.maxParticipants}</div>
                    <div className="text-sm text-gray-500">المشاركين</div>
                  </div>
                  
                  {difficultyInfo && (
                    <div className="text-center">
                      <span className="text-2xl">{difficultyInfo.icon}</span>
                      <div className="font-bold">{difficultyInfo.ar}</div>
                      <div className="text-sm text-gray-500">الصعوبة</div>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <Star className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                    <div className="font-bold">{activity.rating.toFixed(1)}</div>
                    <div className="text-sm text-gray-500">التقييم</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* التبويبات */}
            <Tabs defaultValue="description">
              <TabsList className="bg-white shadow rounded-lg">
                <TabsTrigger value="description">الوصف</TabsTrigger>
                <TabsTrigger value="included">التضمينات</TabsTrigger>
                <TabsTrigger value="photos">الصور</TabsTrigger>
                <TabsTrigger value="reviews">التقييمات</TabsTrigger>
              </TabsList>
              
              {/* الوصف */}
              <TabsContent value="description">
                <Card className="border-0 shadow">
                  <CardContent className="p-6">
                    <div className="prose max-w-none">
                      <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                        {activity.description}
                      </p>
                    </div>
                    
                    {/* المتطلبات */}
                    {requirements.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-bold mb-3">المتطلبات</h3>
                        <ul className="space-y-2">
                          {requirements.map((req, index) => (
                            <li key={index} className="flex items-center gap-2 text-gray-600">
                              <Check className="w-4 h-4 text-green-500" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* سياسة الإلغاء */}
                    {activity.cancellationPolicy && (
                      <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                        <h4 className="font-medium text-amber-800 mb-1">سياسة الإلغاء</h4>
                        <p className="text-amber-700 text-sm">{activity.cancellationPolicy}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* التضمينات */}
              <TabsContent value="included">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* متضمن */}
                  <Card className="border-0 shadow">
                    <CardHeader>
                      <CardTitle className="text-green-600 flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        متضمن في السعر
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {included.length > 0 ? (
                        <ul className="space-y-2">
                          {included.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">لا توجد معلومات</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* غير متضمن */}
                  <Card className="border-0 shadow">
                    <CardHeader>
                      <CardTitle className="text-red-600 flex items-center gap-2">
                        <X className="w-5 h-5" />
                        غير متضمن
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {excluded.length > 0 ? (
                        <ul className="space-y-2">
                          {excluded.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <X className="w-4 h-4 text-red-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">لا توجد معلومات</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* الصور */}
              <TabsContent value="photos">
                <Card className="border-0 shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden">
                          <img
                            src={image}
                            alt={`${activity.title} - ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* التقييمات */}
              <TabsContent value="reviews">
                <Card className="border-0 shadow">
                  <CardContent className="p-6 text-center">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      لا توجد تقييمات بعد. كن أول من يقيّم هذا النشاط!
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* الشريط الجانبي - الحجز */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow sticky top-4">
              <CardContent className="p-6">
                {/* السعر */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-600">
                      {pricePerPerson.toLocaleString()}
                    </span>
                    <span className="text-gray-500">ل.س</span>
                    {activity.pricePerPerson && (
                      <span className="text-sm text-gray-400">/ للشخص</span>
                    )}
                  </div>
                  {activity.discountPrice && (
                    <div className="text-sm text-gray-400 line-through">
                      {activity.price.toLocaleString()} ل.س
                    </div>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                {/* اختيار التاريخ */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">التاريخ</label>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
                
                {/* عدد المشاركين */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">عدد المشاركين</label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setParticipants(p => Math.max(activity.minParticipants, p - 1))}
                      disabled={participants <= activity.minParticipants}
                    >
                      -
                    </Button>
                    <span className="text-xl font-bold w-12 text-center">{participants}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setParticipants(p => Math.min(activity.maxParticipants, p + 1))}
                      disabled={participants >= activity.maxParticipants}
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    الحد الأدنى: {activity.minParticipants} | الحد الأقصى: {activity.maxParticipants}
                  </p>
                </div>
                
                <Separator className="my-4" />
                
                {/* ملخص السعر */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {pricePerPerson.toLocaleString()} ل.س × {participants}
                    </span>
                    <span>{(pricePerPerson * participants).toLocaleString()} ل.س</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>المجموع</span>
                    <span className="text-blue-600">{totalPrice.toLocaleString()} ل.س</span>
                  </div>
                </div>
                
                {/* زر الحجز */}
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  onClick={handleBook}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الحجز...
                    </>
                  ) : (
                    'احجز الآن'
                  )}
                </Button>
                
                {/* التواصل */}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    <Phone className="w-4 h-4 ml-2" />
                    اتصل
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    <MessageCircle className="w-4 h-4 ml-2" />
                    واتساب
                  </Button>
                </div>
                
                {/* أزرار المشاركة */}
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => toast.success('تمت المشاركة')}
                  >
                    <Share2 className="w-4 h-4 ml-2" />
                    مشاركة
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => toast.success('تم الحفظ')}
                  >
                    <Heart className="w-4 h-4 ml-2" />
                    حفظ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* المسار */}
        <div className="mt-8 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">الرئيسية</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/activities" className="hover:text-blue-600">الأنشطة</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{activity.title}</span>
        </div>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Skeleton className="h-96 w-full" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
          <div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    </div>
  );
}
