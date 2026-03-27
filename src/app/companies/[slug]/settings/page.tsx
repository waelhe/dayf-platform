// صفحة إعدادات الشركة
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  Save, 
  Upload, 
  Trash2,
  AlertCircle,
  Loader2
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CompanyService } from '@/features/companies';
import type { CompanyResponse, UpdateCompanyInput } from '@/features/companies/types';

const SYRIAN_CITIES = [
  'دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس', 'دير الزور',
  'الرقة', 'الحسكة', 'درعا', 'السويداء', 'القنيطرة', 'إدلب'
];

export default function CompanySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<UpdateCompanyInput>({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    city: '',
    address: '',
    commercialReg: '',
    taxNumber: '',
  });
  
  useEffect(() => {
    loadCompany();
  }, [slug]);
  
  const loadCompany = async () => {
    try {
      setLoading(true);
      const data = await CompanyService.getCompanyBySlug(slug);
      if (data) {
        setCompany(data);
        setFormData({
          name: data.name,
          description: data.description || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          city: data.city || '',
          address: data.address || '',
          commercialReg: '',
          taxNumber: '',
        });
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل الشركة');
    } finally {
      setLoading(false);
    }
  };
  
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSave = async () => {
    if (!company) return;
    
    setSaving(true);
    try {
      const updated = await CompanyService.updateCompany(company.id, formData);
      toast.success('تم حفظ التغييرات بنجاح');
      
      // إذا تغير الاسم، قد يتغير الـ slug
      if (updated.slug !== company.slug) {
        router.push(`/companies/${updated.slug}/settings`);
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }
  
  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <p>الشركة غير موجودة</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">إعدادات الشركة</h1>
        
        {/* تحذير إعادة التحقق */}
        {company.isVerified && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <AlertTitle className="text-amber-800">تنبيه</AlertTitle>
            <AlertDescription className="text-amber-700">
              تغيير الاسم أو السجل التجاري أو الرقم الضريبي سيتطلب إعادة التحقق من الشركة
            </AlertDescription>
          </Alert>
        )}
        
        {/* معلومات أساسية */}
        <Card className="border-0 shadow mb-6">
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
            <CardDescription>المعلومات الأساسية لشركتك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم الشركة</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* معلومات التواصل */}
        <Card className="border-0 shadow mb-6">
          <CardHeader>
            <CardTitle>معلومات التواصل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">الموقع الإلكتروني</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => updateField('website', e.target.value)}
                dir="ltr"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* العنوان */}
        <Card className="border-0 shadow mb-6">
          <CardHeader>
            <CardTitle>العنوان</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">المدينة</Label>
                <Select value={formData.city} onValueChange={(v) => updateField('city', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYRIAN_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>الدولة</Label>
                <Input value="سوريا" disabled />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">العنوان التفصيلي</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* الوثائق القانونية */}
        <Card className="border-0 shadow mb-6">
          <CardHeader>
            <CardTitle>الوثائق القانونية</CardTitle>
            <CardDescription>معلومات التسجيل القانوني</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commercialReg">رقم السجل التجاري</Label>
                <Input
                  id="commercialReg"
                  value={formData.commercialReg}
                  onChange={(e) => updateField('commercialReg', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxNumber">الرقم الضريبي</Label>
                <Input
                  id="taxNumber"
                  value={formData.taxNumber}
                  onChange={(e) => updateField('taxNumber', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* الشعار والصورة */}
        <Card className="border-0 shadow mb-6">
          <CardHeader>
            <CardTitle>الصور</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>الشعار</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">انقر للرفع</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>صورة الغلاف</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">انقر للرفع</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* حذف الشركة */}
        <Card className="border-0 shadow border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">منطقة الخطر</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              حذف الشركة سيؤدي إلى إزالة جميع البيانات المرتبطة بها
            </p>
            <Button variant="destructive">
              <Trash2 className="w-4 h-4 ml-2" />
              حذف الشركة
            </Button>
          </CardContent>
        </Card>
        
        {/* زر الحفظ */}
        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
