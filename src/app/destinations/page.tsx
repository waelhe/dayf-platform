// صفحة قائمة الوجهات السياحية
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, 
  Search, 
  Filter, 
  Star, 
  Eye,
  Clock,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DestinationService, DESTINATION_TYPE_LABELS } from '@/features/tourism';
import type { DestinationResponse } from '@/features/tourism/infrastructure/destination-service';
import { DestinationType } from '@/core/types/enums';

// المدن السورية
const SYRIAN_CITIES = [
  'الكل',
  'دمشق',
  'حلب',
  'حمص',
  'حماة',
  'اللاذقية',
  'طرطوس',
  'تدمر',
  'معلولا',
  'السويداء',
];

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<DestinationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [selectedType, setSelectedType] = useState<string>('الكل');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  
  useEffect(() => {
    loadDestinations();
  }, [selectedCity, selectedType, page]);
  
  const loadDestinations = async () => {
    try {
      setLoading(true);
      
      const filters: any = {
        page,
        limit: 12,
        isVerified: true,
      };
      
      if (selectedCity !== 'الكل') {
        filters.city = selectedCity;
      }
      
      if (selectedType !== 'الكل') {
        filters.type = selectedType as DestinationType;
      }
      
      if (search) {
        filters.search = search;
      }
      
      const result = await DestinationService.listDestinations(filters);
      setDestinations(result.destinations);
      setTotal(result.total);
    } catch (error) {
      console.error('Error loading destinations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    setPage(1);
    loadDestinations();
  };
  
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* الهيدر */}
      <div className="bg-gradient-to-l from-amber-600 to-amber-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            اكتشف سوريا
          </h1>
          <p className="text-amber-100 text-lg">
            استكشف أجمل الوجهات السياحية في بلاد الشام
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* البحث والفلترة */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* البحث */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ابحث عن وجهة..."
                className="pr-10"
              />
            </div>
            
            {/* فلتر المدينة */}
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full md:w-40">
                <MapPin className="w-4 h-4 ml-2" />
                <SelectValue placeholder="المدينة" />
              </SelectTrigger>
              <SelectContent>
                {SYRIAN_CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* فلتر النوع */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-44">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="الكل">الكل</SelectItem>
                {Object.entries(DESTINATION_TYPE_LABELS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.icon} {value.ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleSearch}
              className="bg-amber-600 hover:bg-amber-700"
            >
              بحث
            </Button>
          </div>
        </div>
        
        {/* النتائج */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            {total} وجهة
          </p>
        </div>
        
        {/* قائمة الوجهات */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <DestinationSkeleton key={i} />
            ))}
          </div>
        ) : destinations.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              لا توجد وجهات
            </h3>
            <p className="text-gray-500">
              جرب تغيير معايير البحث
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </div>
        )}
        
        {/* التصفح */}
        {total > 12 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              السابق
            </Button>
            <span className="flex items-center px-4">
              {page} من {Math.ceil(total / 12)}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 12)}
            >
              التالي
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// بطاقة الوجهة
function DestinationCard({ destination }: { destination: DestinationResponse }) {
  const typeInfo = DESTINATION_TYPE_LABELS[destination.type] || DESTINATION_TYPE_LABELS.OTHER;
  const mainImage = destination.images?.[0] || '/cities/damascus.png';
  
  return (
    <Link href={`/destinations/${destination.slug}`}>
      <Card className="group overflow-hidden border-0 shadow hover:shadow-lg transition-all duration-300 cursor-pointer">
        {/* الصورة */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={mainImage}
            alt={destination.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* شارة النوع */}
          <Badge className="absolute top-3 right-3 bg-white/90 text-gray-800">
            {typeInfo.icon} {typeInfo.ar}
          </Badge>
          
          {/* سعر الدخول */}
          {destination.entryFee && destination.entryFee > 0 && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded text-sm">
              <Ticket className="w-4 h-4 inline ml-1" />
              {destination.entryFee.toLocaleString()} ل.س
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
            {destination.name}
          </h3>
          
          <div className="flex items-center text-gray-500 text-sm mb-2">
            <MapPin className="w-4 h-4 ml-1" />
            {destination.city}، {destination.country}
          </div>
          
          {destination.shortDesc && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {destination.shortDesc}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm">
            {/* التقييم */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-medium">{destination.rating.toFixed(1)}</span>
              <span className="text-gray-400">({destination.reviewCount})</span>
            </div>
            
            {/* المشاهدات */}
            <div className="flex items-center gap-1 text-gray-400">
              <Eye className="w-4 h-4" />
              {destination.viewCount}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// هيكل التحميل
function DestinationSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow">
      <Skeleton className="h-48 w-full" />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}
