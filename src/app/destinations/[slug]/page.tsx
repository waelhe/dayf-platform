// صفحة تفاصيل الوجهة السياحية
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Star,
  Clock,
  Ticket,
  Calendar,
  Share2,
  Heart,
  ChevronRight,
  Camera,
  Info,
  AlertCircle,
  Loader2
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
import { toast } from 'sonner';
import { DestinationService, ActivityService, DESTINATION_TYPE_LABELS } from '@/features/tourism';
import type { DestinationResponse } from '@/features/tourism/infrastructure/destination-service';
import type { ActivityResponse } from '@/features/tourism/infrastructure/activity-service';

export default function DestinationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [destination, setDestination] = useState<DestinationResponse | null>(null);
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  
  useEffect(() => {
    loadDestination();
  }, [slug]);
  
  const loadDestination = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await DestinationService.getDestinationBySlug(slug);
      
      if (!data) {
        setError('الوجهة غير موجودة');
        return;
      }
      
      setDestination(data);
      
      // تحميل الأنشطة المرتبطة
      if (data.id) {
        const activitiesData = await ActivityService.listActivities({
          destinationId: data.id,
          limit: 6,
        });
        setActivities(activitiesData.activities);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };
  
  // حالة التحميل
  if (loading) {
    return <DestinationSkeleton />;
  }
  
  // حالة الخطأ
  if (error || !destination) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {error || 'الوجهة غير موجودة'}
            </h1>
            <p className="text-gray-500 mb-4">
              قد تكون الوجهة غير متاحة أو تم حذفها
            </p>
            <Button onClick={() => router.back()} variant="outline">
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const typeInfo = DESTINATION_TYPE_LABELS[destination.type] || DESTINATION_TYPE_LABELS.OTHER;
  const highlights = destination.highlights || [];
  const images = destination.images?.length > 0 ? destination.images : ['/cities/damascus.png'];
  
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* صورة الغلاف */}
      <div className="relative h-64 md:h-96 bg-gray-200">
        <img
          src={destination.coverImage || images[0]}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* معلومات العنوان */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-5xl mx-auto">
            <Badge className="bg-white/20 backdrop-blur mb-2">
              {typeInfo.icon} {typeInfo.ar}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{destination.name}</h1>
            <div className="flex items-center gap-4 text-white/90">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {destination.city}، {destination.country}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {destination.rating.toFixed(1)} ({destination.reviewCount} تقييم)
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* أزرار الإجراءات */}
        <div className="flex gap-3 mb-6">
          <Button variant="outline" size="sm" onClick={() => toast.success('تمت المشاركة')}>
            <Share2 className="w-4 h-4 ml-2" />
            مشاركة
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success('تمت الإضافة للمفضلة')}>
            <Heart className="w-4 h-4 ml-2" />
            حفظ
          </Button>
        </div>
        
        {/* معلومات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {destination.entryFee !== null && destination.entryFee > 0 && (
            <Card className="border-0 shadow">
              <CardContent className="p-4 text-center">
                <Ticket className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <div className="text-lg font-bold">{destination.entryFee.toLocaleString()} ل.س</div>
                <div className="text-sm text-gray-500">سعر الدخول</div>
              </CardContent>
            </Card>
          )}
          
          {destination.duration && (
            <Card className="border-0 shadow">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold">{destination.duration}</div>
                <div className="text-sm text-gray-500">مدة الزيارة</div>
              </CardContent>
            </Card>
          )}
          
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="text-lg font-bold">{destination.rating.toFixed(1)}</div>
              <div className="text-sm text-gray-500">التقييم</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <MapPin className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-bold">{destination.city}</div>
              <div className="text-sm text-gray-500">المدينة</div>
            </CardContent>
          </Card>
        </div>
        
        {/* التبويبات */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white shadow rounded-lg">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="photos">الصور ({images.length})</TabsTrigger>
            <TabsTrigger value="activities">الأنشطة</TabsTrigger>
          </TabsList>
          
          {/* نظرة عامة */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-3 gap-6">
              {/* الوصف */}
              <div className="md:col-span-2">
                <Card className="border-0 shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      حول {destination.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {destination.description}
                    </p>
                    
                    {/* أبرز المعالم */}
                    {highlights.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-bold mb-3">أبرز المعالم</h3>
                        <div className="flex flex-wrap gap-2">
                          {highlights.map((highlight, index) => (
                            <Badge key={index} variant="secondary">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* أفضل وقت للزيارة */}
                    {destination.bestTimeToVisit && (
                      <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
                          <Calendar className="w-4 h-4" />
                          أفضل وقت للزيارة
                        </div>
                        <p className="text-amber-700">{destination.bestTimeToVisit}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* الموقع */}
              <div>
                <Card className="border-0 shadow">
                  <CardHeader>
                    <CardTitle>الموقع</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="font-medium">{destination.city}</div>
                          {destination.address && (
                            <div className="text-sm text-gray-500">{destination.address}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* خريطة placeholder */}
                    <div className="mt-4 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">الخريطة</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* الصور */}
          <TabsContent value="photos">
            <Card className="border-0 shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={image}
                        alt={`${destination.name} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* الأنشطة */}
          <TabsContent value="activities">
            {activities.length === 0 ? (
              <Card className="border-0 shadow">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">لا توجد أنشطة مرتبطة بهذه الوجهة حالياً</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {activities.map((activity) => (
                  <Link key={activity.id} href={`/activities/${activity.slug}`}>
                    <Card className="border-0 shadow hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={activity.coverImage || activity.images?.[0] || '/cities/damascus.png'}
                            alt={activity.title}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-bold mb-1">{activity.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {activity.shortDesc || activity.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-sm">
                              <span className="text-amber-600 font-bold">
                                {activity.price.toLocaleString()} ل.س
                              </span>
                              <span className="text-gray-400">
                                {Math.floor(activity.duration / 60)} ساعة
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* المسار */}
        <div className="mt-8 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-amber-600">الرئيسية</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/destinations" className="hover:text-amber-600">الوجهات</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{destination.name}</span>
        </div>
      </div>
    </div>
  );
}

function DestinationSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Skeleton className="h-96 w-full" />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-3 mb-6">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
