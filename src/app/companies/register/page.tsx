// صفحة تسجيل شركة جديدة
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Upload, 
  FileText, 
  Phone, 
  Mail, 
  Globe,
  MapPin,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// أنواع الشركات
const COMPANY_TYPES = [
  { value: 'HOTEL', label: 'فندق / إقامة', icon: '🏨' },
  { value: 'TOUR_OPERATOR', label: 'مشغل سياحي', icon: '🚌' },
  { value: 'TRANSPORT', label: 'نقل سياحي', icon: '🚗' },
  { value: 'RESTAURANT', label: 'مطعم', icon: '🍽️' },
  { value: 'SHOP', label: 'متجر', icon: '🛍️' },
  { value: 'TRAVEL_AGENCY', label: 'وكالة سفر', icon: '✈️' },
  { value: 'CAR_RENTAL', label: 'تأجير سيارات', icon: '🚙' },
  { value: 'EVENT_ORGANIZER', label: 'منظم فعاليات', icon: '🎉' },
  { value: 'OTHER', label: 'أخرى', icon: '📦' },
];

// المدن السورية
const SYRIAN_CITIES = [
  'دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس', 'دير الزور',
  'الرقة', 'الحسكة', 'درعا', 'السويداء', 'القنيطرة', 'إدلب'
];

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    country: 'سوريا',
    city: '',
    address: '',
    commercialReg: '',
    taxNumber: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // تحديث حقل
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // التحقق من الخطوة الأولى
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'اسم الشركة مطلوب';
    } else if (formData.name.length < 3) {
      newErrors.name = 'اسم الشركة يجب أن يكون 3 أحرف على الأقل';
    }
    
    if (!formData.type) {
      newErrors.type = 'نوع الشركة مطلوب';
    }
    
    if (!formData.city) {
      newErrors.city = 'المدينة مطلوبة';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // التحقق من الخطوة الثانية
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }
    
    if (formData.phone && !/^[0-9]{9,10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'رقم الهاتف غير صالح';
    }
    
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'الموقع يجب أن يبدأ بـ http:// أو https://';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // الانتقال للخطوة التالية
  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };
  
  // العودة للخطوة السابقة
  const prevStep = () => {
    setStep(Math.max(1, step - 1));
  };
  
  // إرسال النموذج
  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'حدث خطأ أثناء إنشاء الشركة');
      }
      
      toast.success('تم إنشاء الشركة بنجاح!', {
        description: 'شركتك قيد المراجعة وسيتم إشعارك عند التحقق منها',
      });
      
      router.push(`/companies/${data.slug}`);
    } catch (error: any) {
      toast.error('خطأ في إنشاء الشركة', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* العنوان */}
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">تسجيل شركة جديدة</h1>
          <p className="text-gray-600 mt-2">انضم إلى منصة ضيف واعرض خدماتك للسياح</p>
        </div>
        
        {/* مؤشر الخطوات */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  s <= step 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 rounded ${s < step ? 'bg-amber-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        
        {/* الخطوة 1: المعلومات الأساسية */}
        {step === 1 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
              <CardDescription>أدخل المعلومات الأساسية لشركتك</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* اسم الشركة */}
              <div className="space-y-2">
                <Label htmlFor="name">اسم الشركة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="مثال: فندق الشام الفاخر"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>
              
              {/* نوع الشركة */}
              <div className="space-y-2">
                <Label htmlFor="type">نوع النشاط *</Label>
                <Select value={formData.type} onValueChange={(v) => updateField('type', v)}>
                  <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="اختر نوع النشاط" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.type}
                  </p>
                )}
              </div>
              
              {/* الموقع */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة *</Label>
                  <Select value={formData.city} onValueChange={(v) => updateField('city', v)}>
                    <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      {SYRIAN_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && (
                    <p className="text-sm text-red-500">{errors.city}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">الدولة</Label>
                  <Input id="country" value={formData.country} disabled />
                </div>
              </div>
              
              {/* العنوان */}
              <div className="space-y-2">
                <Label htmlFor="address">العنوان التفصيلي</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="الحي، الشارع، رقم المبنى"
                />
              </div>
              
              {/* الوصف */}
              <div className="space-y-2">
                <Label htmlFor="description">وصف الشركة</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="اكتب وصفاً مختصراً عن شركتك وخدماتها..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* الخطوة 2: معلومات التواصل */}
        {step === 2 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>معلومات التواصل</CardTitle>
              <CardDescription>كيف يمكن للعملاء التواصل معك؟</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* البريد الإلكتروني */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline ml-1" />
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="info@company.com"
                  className={errors.email ? 'border-red-500' : ''}
                  dir="ltr"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              
              {/* الهاتف */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="w-4 h-4 inline ml-1" />
                  رقم الهاتف
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="09xxxxxxxx"
                  className={errors.phone ? 'border-red-500' : ''}
                  dir="ltr"
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
              
              {/* الموقع الإلكتروني */}
              <div className="space-y-2">
                <Label htmlFor="website">
                  <Globe className="w-4 h-4 inline ml-1" />
                  الموقع الإلكتروني
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://www.company.com"
                  className={errors.website ? 'border-red-500' : ''}
                  dir="ltr"
                />
                {errors.website && (
                  <p className="text-sm text-red-500">{errors.website}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* الخطوة 3: الوثائق القانونية */}
        {step === 3 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>الوثائق القانونية</CardTitle>
              <CardDescription>أدخل معلومات التسجيل القانوني (اختياري)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  الوثائق القانونية تساعد في تسريع عملية التحقق من شركتك
                </AlertDescription>
              </Alert>
              
              {/* رقم السجل التجاري */}
              <div className="space-y-2">
                <Label htmlFor="commercialReg">
                  <FileText className="w-4 h-4 inline ml-1" />
                  رقم السجل التجاري
                </Label>
                <Input
                  id="commercialReg"
                  value={formData.commercialReg}
                  onChange={(e) => updateField('commercialReg', e.target.value)}
                  placeholder="أدخل رقم السجل التجاري"
                />
              </div>
              
              {/* الرقم الضريبي */}
              <div className="space-y-2">
                <Label htmlFor="taxNumber">
                  <CreditCard className="w-4 h-4 inline ml-1" />
                  الرقم الضريبي
                </Label>
                <Input
                  id="taxNumber"
                  value={formData.taxNumber}
                  onChange={(e) => updateField('taxNumber', e.target.value)}
                  placeholder="أدخل الرقم الضريبي"
                />
              </div>
              
              {/* رفع الوثائق - placeholder */}
              <div className="space-y-2">
                <Label>رفع الوثائق</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">اسحب الملفات هنا أو انقر للرفع</p>
                  <p className="text-sm text-gray-400 mt-1">PDF, JPG, PNG (حد أقصى 5MB)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* أزرار التنقل */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <Button variant="outline" onClick={prevStep} disabled={isSubmitting}>
              السابق
            </Button>
          ) : (
            <div />
          )}
          
          {step < 3 ? (
            <Button onClick={nextStep} className="bg-amber-600 hover:bg-amber-700">
              التالي
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال للمراجعة'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
