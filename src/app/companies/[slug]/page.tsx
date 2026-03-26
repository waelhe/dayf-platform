// صفحة ملف الشركة
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Star,
  Users,
  Package,
  Calendar,
  BadgeCheck,
  Share2,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyService } from '@/features/companies';
import type { CompanyResponse } from '@/features/companies/types';

// أنواع الشركات بالعربية
const COMPANY_TYPE_LABELS: Record<string, string> = {
  HOTEL: 'فندق / إقامة',
  TOUR_OPERATOR: 'مشغل سياحي',
  TRANSPORT: 'نقل سياحي',
  RESTAURANT: 'مطعم',
  SHOP: 'متجر',
  TRAVEL_AGENCY: 'وكالة سفر',
  CAR_RENTAL: 'تأجير سيارات',
  EVENT_ORGANIZER: 'منظم فعاليات',
  OTHER: 'أخرى',
};

// ألوان أنواع الشركات
const COMPANY_TYPE_COLORS: Record<string, string> = {
  HOTEL: 'bg-blue-100 text-blue-800',
  TOUR_OPERATOR: 'bg-green-100 text-green-800',
  TRANSPORT: 'bg-yellow-100 text-yellow-800',
  RESTAURANT: 'bg-orange-100 text-orange-800',
  SHOP: 'bg-purple-100 text-purple-800',
  TRAVEL_AGENCY: 'bg-teal-100 text-teal-800',
  CAR_RENTAL: 'bg-red-100 text-red-800',
  EVENT_ORGANIZER: 'bg-pink-100 text-pink-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export default function CompanyProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadCompany();
  }, [slug]);
  
  const loadCompany = async () => {
    try {
      setLoading(true);
      const data = await CompanyService.getCompanyBySlug(slug);
      if (!data) {
        setError('الشركة غير موجودة');
      } else {
        setCompany(data);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل الشركة');
    } finally {
      setLoading(false);
    }
  };
  
  // حالة التحميل
  if (loading) {
    return <CompanyProfileSkeleton />;
  }
  
  // حالة الخطأ
  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {error || 'الشركة غير موجودة'}
            </h1>
            <p className="text-gray-500 mb-4">
              قد تكون الشركة غير موجودة أو تم حذفها
            </p>
            <Button onClick={() => window.history.back()} variant="outline">
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* صورة الغلاف */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-amber-600 to-amber-400 relative">
        {company.coverImage && (
          <img 
            src={company.coverImage} 
            alt={company.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
        {/* بطاقة المعلومات الأساسية */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* الشعار */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white border-4 border-white shadow-lg overflow-hidden">
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-amber-100 flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-amber-600" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* المعلومات */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {company.name}
                  </h1>
                  {company.isVerified && (
                    <Badge className="bg-green-100 text-green-800 gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      موثق
                    </Badge>
                  )}
                  <Badge className={COMPANY_TYPE_COLORS[company.type] || 'bg-gray-100'}>
                    {COMPANY_TYPE_LABELS[company.type] || company.type}
                  </Badge>
                </div>
                
                {company.description && (
                  <p className="text-gray-600 mb-4">{company.description}</p>
                )}
                
                {/* معلومات الموقع والتواصل */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {company.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {company.city}، {company.country || 'سوريا'}
                    </span>
                  )}
                  {company.phone && (
                    <a href={`tel:${company.phone}`} className="flex items-center gap-1 hover:text-amber-600">
                      <Phone className="w-4 h-4" />
                      {company.phone}
                    </a>
                  )}
                  {company.email && (
                    <a href={`mailto:${company.email}`} className="flex items-center gap-1 hover:text-amber-600">
                      <Mail className="w-4 h-4" />
                      {company.email}
                    </a>
                  )}
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-amber-600">
                      <Globe className="w-4 h-4" />
                      الموقع الإلكتروني
                    </a>
                  )}
                </div>
              </div>
              
              {/* أزرار الإجراءات */}
              <div className="flex flex-col gap-2">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <MessageCircle className="w-4 h-4 ml-2" />
                  تواصل معنا
                </Button>
                <Button variant="outline">
                  <Share2 className="w-4 h-4 ml-2" />
                  مشاركة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {company.rating > 0 ? company.rating.toFixed(1) : '-'}
              </div>
              <div className="text-sm text-gray-500">
                {company.reviewCount} تقييم
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <Package className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {company.totalProducts}
              </div>
              <div className="text-sm text-gray-500">منتج</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {company.totalServices}
              </div>
              <div className="text-sm text-gray-500">خدمة</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {company.totalBookings}
              </div>
              <div className="text-sm text-gray-500">حجز</div>
            </CardContent>
          </Card>
        </div>
        
        {/* التبويبات */}
        <Tabs defaultValue="services" className="mb-8">
          <TabsList className="bg-white border">
            <TabsTrigger value="services">الخدمات</TabsTrigger>
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="reviews">التقييمات</TabsTrigger>
            <TabsTrigger value="about">عن الشركة</TabsTrigger>
          </TabsList>
          
          <TabsContent value="services" className="mt-4">
            <Card className="border-0 shadow">
              <CardContent className="p-6">
                {company.totalServices > 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">سيتم عرض خدمات الشركة هنا</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد خدمات حالياً</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="products" className="mt-4">
            <Card className="border-0 shadow">
              <CardContent className="p-6">
                {company.totalProducts > 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">سيتم عرض منتجات الشركة هنا</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد منتجات حالياً</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-4">
            <Card className="border-0 shadow">
              <CardContent className="p-6">
                {company.reviewCount > 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">سيتم عرض التقييمات هنا</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد تقييمات حالياً</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="about" className="mt-4">
            <Card className="border-0 shadow">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">عن الشركة</h3>
                {company.description ? (
                  <p className="text-gray-600 leading-relaxed">{company.description}</p>
                ) : (
                  <p className="text-gray-500">لا يوجد وصف متاح</p>
                )}
                
                {company.address && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-2">العنوان</h4>
                    <p className="text-gray-600">{company.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// مكون التحميل
function CompanyProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="h-48 md:h-64 bg-gray-200" />
      <div className="max-w-6xl mx-auto px-4 -mt-16">
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex gap-6">
              <Skeleton className="w-32 h-32 rounded-xl" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
