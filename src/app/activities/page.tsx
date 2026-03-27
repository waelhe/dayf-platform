// صفحة قائمة الأنشطة السياحية
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Users,
  Star,
  DollarSign,
  FilterX,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { ActivityService, ACTIVITY_TYPE_LABELS, DIFFICULTY_LEVELS } from '@/features/tourism';
import type { ActivityResponse } from '@/features/tourism/infrastructure/activity-service';
import { ActivityType } from '@/core/types/enums';

const ITEMS_PER_PAGE = 12;

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  
  // الفلاتر
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    loadActivities();
  }, [page, selectedType]);
  
  const loadActivities = async () => {
    try {
      setLoading(true);
      
      const filters: any = {
        page,
        limit: ITEMS_PER_PAGE,
        status: 'ACTIVE',
      };
      
      if (selectedType !== 'all') {
        filters.type = selectedType as ActivityType;
      }
      
      if (search) {
        filters.search = search;
      }
      
      if (priceRange[0] > 0 || priceRange[1] < 1000000) {
        filters.minPrice = priceRange[0];
        filters.maxPrice = priceRange[1];
      }
      
      const result = await ActivityService.listActivities(filters);
      setActivities(result.activities);
      setTotal(result.total);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    setPage(1);
    loadActivities();
  };
  
  const clearFilters = () => {
    setSearch('');
    setSelectedType('all');
    setPriceRange([0, 1000000]);
    setSelectedDifficulty('all');
    setPage(1);
    loadActivities();
  };
  
  const hasActiveFilters = search || selectedType !== 'all' || 
    priceRange[0] > 0 || priceRange[1] < 1000000;
  
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* الهيدر */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            الأنشطة والتجارب
          </h1>
          <p className="text-blue-100 text-lg">
            اكتشف تجارب فريدة وأنشطة ممتعة في سوريا
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* البحث */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ابحث عن نشاط..."
                className="pr-10"
              />
            </div>
            
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              بحث
            </Button>
            
            {/* فلتر متقدم */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 ml-2" />
                  فلاتر
                  {hasActiveFilters && (
                    <Badge className="mr-2 h-5 w-5 p-0 flex items-center justify-center">
                      !
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>تصفية متقدمة</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  {/* نوع النشاط */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">نوع النشاط</label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue placeholder="الكل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.icon} {value.ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* نطاق السعر */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      نطاق السعر: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} ل.س
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000000}
                      step={10000}
                      className="mt-2"
                    />
                  </div>
                  
                  {/* مستوى الصعوبة */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">مستوى الصعوبة</label>
                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                      <SelectTrigger>
                        <SelectValue placeholder="الكل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.icon} {level.ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* أزرار */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        setShowFilters(false);
                        loadActivities();
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      تطبيق
                    </Button>
                    <Button variant="outline" onClick={clearFilters}>
                      <FilterX className="w-4 h-4 ml-2" />
                      مسح
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* النتائج */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">{total} نشاط</p>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <FilterX className="w-4 h-4 ml-2" />
              مسح الفلاتر
            </Button>
          )}
        </div>
        
        {/* قائمة الأنشطة */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              لا توجد أنشطة
            </h3>
            <p className="text-gray-500 mb-4">
              جرب تغيير معايير البحث
            </p>
            <Button onClick={clearFilters} variant="outline">
              مسح الفلاتر
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
        
        {/* التصفح */}
        {total > ITEMS_PER_PAGE && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              السابق
            </Button>
            <span className="flex items-center px-4">
              {page} من {Math.ceil(total / ITEMS_PER_PAGE)}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / ITEMS_PER_PAGE)}
            >
              التالي
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// بطاقة النشاط
function ActivityCard({ activity }: { activity: ActivityResponse }) {
  const typeInfo = ACTIVITY_TYPE_LABELS[activity.type] || ACTIVITY_TYPE_LABELS.OTHER;
  const difficultyInfo = DIFFICULTY_LEVELS.find(d => d.value === activity.difficultyLevel);
  const mainImage = activity.images?.[0] || '/cities/damascus.png';
  const durationHours = Math.floor(activity.duration / 60);
  const durationMinutes = activity.duration % 60;
  
  return (
    <Link href={`/activities/${activity.slug}`}>
      <Card className="group overflow-hidden border-0 shadow hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
        {/* الصورة */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={mainImage}
            alt={activity.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* شارات */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <Badge className="bg-white/90 text-gray-800">
              {typeInfo.icon} {typeInfo.ar}
            </Badge>
            {activity.isFeatured && (
              <Badge className="bg-amber-500 text-white">
                مميز
              </Badge>
            )}
          </div>
          
          {/* السعر */}
          <div className="absolute bottom-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-lg font-bold">
            {activity.discountPrice ? (
              <>
                <span className="line-through text-xs text-blue-200">
                  {activity.price.toLocaleString()} ل.س
                </span>
                <br />
                {activity.discountPrice.toLocaleString()} ل.س
              </>
            ) : (
              `${activity.price.toLocaleString()} ل.س`
            )}
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {activity.title}
          </h3>
          
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin className="w-4 h-4 ml-1" />
            {activity.location}
          </div>
          
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {activity.shortDesc || activity.description}
          </p>
          
          <div className="flex items-center justify-between text-sm">
            {/* المدة */}
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-4 h-4" />
              {durationHours > 0 && `${durationHours} س`}
              {durationMinutes > 0 && ` ${durationMinutes} د`}
            </div>
            
            {/* المشاركين */}
            <div className="flex items-center gap-1 text-gray-500">
              <Users className="w-4 h-4" />
              {activity.maxParticipants}
            </div>
            
            {/* التقييم */}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-medium">{activity.rating.toFixed(1)}</span>
            </div>
          </div>
          
          {/* مستوى الصعوبة */}
          {difficultyInfo && (
            <div className="mt-3 pt-3 border-t">
              <Badge variant="outline" className="text-xs">
                {difficultyInfo.icon} {difficultyInfo.ar}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function ActivitySkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow">
      <Skeleton className="h-48 w-full" />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <Skeleton className="h-4 w-full mb-4" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
