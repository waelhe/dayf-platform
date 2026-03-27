'use client';

/**
 * ReviewForm - نموذج إضافة مراجعة جديدة
 * 
 * يدعم:
 * - التقييم متعدد المعايير
 * - تحديد مرحلة السفر (قبل/أثناء/بعد)
 * - تاريخ الزيارة
 * - إضافة صور (تطوير مستقبلي)
 */

import { useState } from 'react';
import { Star, Loader2, Check, ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { TravelPhase, ReviewType } from '../types';
import { TRAVEL_PHASES } from '../types';

interface ReviewFormProps {
  referenceId: string;
  type: ReviewType;
  bookingId?: string;
  authorId: string;
  isVerified?: boolean; // هل المراجعة ستكون موثقة؟
  onSuccess?: (reviewId: string) => void;
  onCancel?: () => void;
  className?: string;
}

interface CriteriaRating {
  cleanliness: number;
  location: number;
  value: number;
  serviceRating: number;
  amenities: number;
  communication: number;
}

const criteriaLabels: Record<keyof CriteriaRating, { name: string; icon: string }> = {
  cleanliness: { name: 'النظافة', icon: '🧹' },
  location: { name: 'الموقع', icon: '📍' },
  value: { name: 'القيمة', icon: '💰' },
  serviceRating: { name: 'الخدمة', icon: '⭐' },
  amenities: { name: 'المرافق', icon: '🏠' },
  communication: { name: 'التواصل', icon: '💬' },
};

// تحديد المعايير بناءً على النوع
function getCriteriaForType(type: ReviewType): (keyof CriteriaRating)[] {
  switch (type) {
    case 'SERVICE':
      return ['cleanliness', 'location', 'value', 'serviceRating', 'amenities', 'communication'];
    case 'ACTIVITY':
      return ['value', 'serviceRating', 'communication'];
    case 'DESTINATION':
      return ['location', 'value', 'serviceRating'];
    case 'PRODUCT':
      return ['value', 'serviceRating'];
    default:
      return ['value', 'serviceRating'];
  }
}

export function ReviewForm({
  referenceId,
  type,
  bookingId,
  authorId,
  isVerified = false,
  onSuccess,
  onCancel,
  className,
}: ReviewFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [criteria, setCriteria] = useState<CriteriaRating>({
    cleanliness: 0,
    location: 0,
    value: 0,
    serviceRating: 0,
    amenities: 0,
    communication: 0,
  });
  const [travelPhase, setTravelPhase] = useState<TravelPhase | ''>('');
  const [visitDate, setVisitDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCriteria = getCriteriaForType(type);

  // حساب التقييم العام
  const calculateOverallRating = (): number => {
    const values = activeCriteria
      .map((key) => criteria[key])
      .filter((v) => v > 0);
    
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 10) / 10;
  };

  const overallRating = calculateOverallRating();

  // تحديث تقييم معين
  const handleCriteriaChange = (key: keyof CriteriaRating, value: number) => {
    setCriteria((prev) => ({ ...prev, [key]: value }));
  };

  // التحقق من صحة النموذج
  const isValid = (): boolean => {
    if (content.length < 50) return false;
    if (overallRating === 0) return false;
    return true;
  };

  // إرسال المراجعة
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid()) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          referenceId,
          bookingId,
          authorId,
          title: title || undefined,
          content,
          travelPhase: travelPhase || undefined,
          cleanliness: criteria.cleanliness || undefined,
          location: criteria.location || undefined,
          value: criteria.value || undefined,
          serviceRating: criteria.serviceRating || undefined,
          amenities: criteria.amenities || undefined,
          communication: criteria.communication || undefined,
          visitDate: visitDate || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(data.data.id);
      } else {
        setError(data.error || 'حدث خطأ أثناء إرسال المراجعة');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  // مكون نجوم التقييم التفاعلية
  const InteractiveStars = ({
    value,
    onChange,
    size = 'lg',
  }: {
    value: number;
    onChange: (value: number) => void;
    size?: 'md' | 'lg';
  }) => {
    const sizeClass = size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="hover:scale-110 transition-transform"
          >
            <Star
              className={cn(
                sizeClass,
                star <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* شارة التوثيق */}
      {isVerified && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
          <Badge className="bg-emerald-600">
            <Check className="w-3 h-3 ml-1" />
            حجز موثق
          </Badge>
          <span className="text-sm text-emerald-700">
            مراجعتك ستظهر مع شارة التحقق
          </span>
        </div>
      )}

      {/* التقييم العام */}
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {overallRating > 0 ? overallRating.toFixed(1) : '—'}
        </div>
        <InteractiveStars value={Math.round(overallRating)} onChange={() => {}} />
        <p className="text-sm text-gray-500 mt-2">التقييم العام (محسوب تلقائياً)</p>
      </div>

      {/* معايير التقييم */}
      <div className="space-y-4">
        <h4 className="font-semibold">قيم تجربتك</h4>
        {activeCriteria.map((key) => {
          const label = criteriaLabels[key];
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{label.icon}</span>
                <Label>{label.name}</Label>
              </div>
              <InteractiveStars
                value={criteria[key]}
                onChange={(value) => handleCriteriaChange(key, value)}
                size="md"
              />
            </div>
          );
        })}
      </div>

      {/* مرحلة السفر */}
      <div>
        <Label className="mb-3 block">متى كتبت هذه المراجعة؟</Label>
        <RadioGroup
          value={travelPhase}
          onValueChange={(value) => setTravelPhase(value as TravelPhase | '')}
          className="flex flex-wrap gap-3"
        >
          {Object.entries(TRAVEL_PHASES).map(([key, phase]) => (
            <div key={key} className="flex items-center">
              <RadioGroupItem value={key} id={`phase-${key}`} className="sr-only peer" />
              <Label
                htmlFor={`phase-${key}`}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full border-2 cursor-pointer transition-all',
                  'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10',
                  'hover:border-gray-400'
                )}
              >
                <span>{phase.icon}</span>
                <span>{phase.name}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* عنوان المراجعة */}
      <div>
        <Label htmlFor="title">عنوان المراجعة (اختياري)</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ملخص قصير لتجربتك"
          maxLength={100}
        />
      </div>

      {/* محتوى المراجعة */}
      <div>
        <Label htmlFor="content">
          تفاصيل تجربتك <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="شارك تفاصيل تجربتك لتساعد المسافرين الآخرين..."
          rows={5}
          maxLength={2000}
        />
        <p className={cn(
          'text-sm mt-1',
          content.length < 50 ? 'text-red-500' : 'text-gray-500'
        )}>
          {content.length}/2000 (الحد الأدنى 50 حرف)
        </p>
      </div>

      {/* تاريخ الزيارة */}
      <div>
        <Label htmlFor="visitDate">تاريخ الزيارة (اختياري)</Label>
        <Input
          id="visitDate"
          type="month"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
        />
      </div>

      {/* خطأ */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* أزرار الإرسال */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!isValid() || submitting}
          className="flex-1"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 ml-2" />
              نشر المراجعة
            </>
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
        )}
      </div>
    </form>
  );
}
