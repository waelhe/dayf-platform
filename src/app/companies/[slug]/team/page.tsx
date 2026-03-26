// صفحة إدارة الفريق
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Users, 
  UserPlus, 
  MoreHorizontal,
  Mail,
  Shield,
  Clock,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { CompanyService, EmployeeService } from '@/features/companies';
import type { CompanyResponse, EmployeeResponse, InvitationResponse, EmployeeRoleType } from '@/features/companies/types';
import { EmployeeRole } from '@/features/companies/types';

// تسمية الأدوار
const ROLE_LABELS: Record<EmployeeRoleType, string> = {
  OWNER: 'المالك',
  MANAGER: 'مدير',
  STAFF: 'موظف',
  VIEWER: 'مشاهد',
};

// ألوان الأدوار
const ROLE_COLORS: Record<EmployeeRoleType, string> = {
  OWNER: 'bg-amber-100 text-amber-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  STAFF: 'bg-green-100 text-green-800',
  VIEWER: 'bg-gray-100 text-gray-800',
};

export default function TeamManagementPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [company, setCompany] = useState<CompanyResponse | null>(null);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [invitations, setInvitations] = useState<InvitationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // نموذج الدعوة
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<{ email: string; role: EmployeeRoleType }>({ email: '', role: EmployeeRole.STAFF });
  const [sendingInvite, setSendingInvite] = useState(false);
  
  useEffect(() => {
    loadData();
  }, [slug]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // تحميل الشركة
      const companyData = await CompanyService.getCompanyBySlug(slug);
      if (!companyData) {
        toast.error('الشركة غير موجودة');
        return;
      }
      setCompany(companyData);
      
      // تحميل الموظفين والدعوات
      const [employeesData, invitationsData] = await Promise.all([
        EmployeeService.listEmployees(companyData.id),
        EmployeeService.listPendingInvitations(companyData.id),
      ]);
      
      setEmployees(employeesData);
      setInvitations(invitationsData);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInvite = async () => {
    if (!company) return;
    
    if (!inviteForm.email) {
      toast.error('البريد الإلكتروني مطلوب');
      return;
    }
    
    setSendingInvite(true);
    try {
      // TODO: Get current user ID from session
      const currentUserId = 'demo-user';
      
      const invitation = await EmployeeService.inviteEmployee(
        company.id,
        currentUserId,
        inviteForm
      );
      
      setInvitations(prev => [...prev, invitation]);
      setInviteDialogOpen(false);
      setInviteForm({ email: '', role: EmployeeRole.STAFF });
      
      toast.success('تم إرسال الدعوة بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إرسال الدعوة');
    } finally {
      setSendingInvite(false);
    }
  };
  
  const handleCancelInvitation = async (invitationId: string) => {
    if (!company) return;
    
    try {
      await EmployeeService.cancelInvitation(company.id, invitationId);
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
      toast.success('تم إلغاء الدعوة');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };
  
  const handleRemoveEmployee = async (employeeId: string) => {
    if (!company) return;
    
    try {
      // TODO: Get current user ID from session
      const currentUserId = 'demo-user';
      
      await EmployeeService.removeEmployee(company.id, employeeId, currentUserId);
      setEmployees(prev => prev.filter(e => e.id !== employeeId));
      toast.success('تم إزالة الموظف');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* العنوان */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الفريق</h1>
            <p className="text-gray-500 mt-1">{company?.name}</p>
          </div>
          
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <UserPlus className="w-4 h-4 ml-2" />
                دعوة موظف
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>دعوة موظف جديد</DialogTitle>
                <DialogDescription>
                  أدخل البريد الإلكتروني للموظف الذي تريد دعوته
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="employee@example.com"
                    dir="ltr"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">الدور</Label>
                  <Select 
                    value={inviteForm.role} 
                    onValueChange={(v) => setInviteForm(prev => ({ ...prev, role: v as EmployeeRoleType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EmployeeRole.MANAGER}>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {ROLE_LABELS.MANAGER}
                        </div>
                      </SelectItem>
                      <SelectItem value={EmployeeRole.STAFF}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {ROLE_LABELS.STAFF}
                        </div>
                      </SelectItem>
                      <SelectItem value={EmployeeRole.VIEWER}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {ROLE_LABELS.VIEWER}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button 
                  onClick={handleInvite}
                  disabled={sendingInvite}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {sendingInvite ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    'إرسال الدعوة'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* الدعوات المعلقة */}
        {invitations.length > 0 && (
          <Card className="border-0 shadow mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                الدعوات المعلقة
              </CardTitle>
              <CardDescription>
                دعوات في انتظار القبول
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div 
                    key={invitation.id}
                    className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-gray-500">
                          {ROLE_LABELS[invitation.role]}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={ROLE_COLORS[invitation.role]}>
                        {ROLE_LABELS[invitation.role]}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelInvitation(invitation.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* قائمة الموظفين */}
        <Card className="border-0 shadow">
          <CardHeader>
            <CardTitle>أعضاء الفريق</CardTitle>
            <CardDescription>
              {employees.length} عضو في الفريق
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employees.map((employee) => (
                <div 
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={employee.user.avatar || ''} />
                      <AvatarFallback className="bg-amber-100 text-amber-700">
                        {getInitials(employee.user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <p className="font-medium text-gray-900">
                        {employee.user.displayName}
                      </p>
                      <p className="text-sm text-gray-500" dir="ltr">
                        {employee.user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={ROLE_COLORS[employee.role]}>
                      {ROLE_LABELS[employee.role]}
                    </Badge>
                    
                    {employee.role !== EmployeeRole.OWNER && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleRemoveEmployee(employee.id)}
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            إزالة
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* معلومات الأدوار */}
        <Card className="border-0 shadow mt-6">
          <CardHeader>
            <CardTitle>صلاحيات الأدوار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={ROLE_COLORS.OWNER}>المالك</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  صلاحيات كاملة على الشركة وإدارة الفريق
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={ROLE_COLORS.MANAGER}>المدير</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  إدارة الخدمات والمنتجات والحجوزات ودعوة الموظفين
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={ROLE_COLORS.STAFF}>الموظف</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  إدارة الحجوزات والرد على العملاء
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={ROLE_COLORS.VIEWER}>المشاهد</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  عرض الحجوزات والإحصائيات فقط
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
