// API Route: /api/invitations/accept
// POST - Accept company invitation

import { NextRequest, NextResponse } from 'next/server';
import { EmployeeService } from '@/features/companies';

// POST /api/invitations/accept
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // TODO: Get userId from session
    const userId = 'demo-user';
    
    if (!body.token) {
      return NextResponse.json(
        { error: 'رمز الدعوة مطلوب' },
        { status: 400 }
      );
    }
    
    const employee = await EmployeeService.acceptInvitation(userId, {
      token: body.token,
    });
    
    return NextResponse.json({
      success: true,
      message: 'تم الانضمام إلى الشركة بنجاح',
      employee,
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء قبول الدعوة' },
      { status: 500 }
    );
  }
}
