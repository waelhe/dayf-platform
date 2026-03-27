/**
 * GET /api/disputes - قائمة المنازعات
 * POST /api/disputes - إنشاء منازعة جديدة
 */

import { NextRequest, NextResponse } from 'next/server';
import { DisputeService, CreateDisputeInput } from '@/features/disputes/infrastructure/dispute-service';
import { DisputeStatus, DisputeType } from '@/core/types/enums';

async function getCurrentUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const sessionToken = request.cookies.get('session_token')?.value;
  if (!sessionToken) return null;
  return null; // TODO: التحقق من الجلسة الفعلية
}

/**
 * GET /api/disputes
 * قائمة منازعات المستخدم
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as DisputeStatus | null;

    // المدير يرى كل المنازعات
    if (user.role === 'ADMIN') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const result = await DisputeService.listAllDisputes(status ?? undefined, page, limit);
      return NextResponse.json(result);
    }

    // المستخدم العادي يرى منازعاته فقط
    const disputes = await DisputeService.listUserDisputes(user.id, status ?? undefined);
    return NextResponse.json({ disputes });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المنازعات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/disputes
 * إنشاء منازعة جديدة
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // التحقق من البيانات المطلوبة
    const requiredFields = ['escrowId', 'referenceType', 'referenceId', 'againstUser', 'type', 'reason', 'description'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `الحقل ${field} مطلوب` },
          { status: 400 }
        );
      }
    }

    // التحقق من صحة نوع المنازعة
    const validTypes = ['BOOKING_ISSUE', 'PRODUCT_ISSUE', 'PAYMENT_ISSUE', 'SERVICE_QUALITY', 'CANCELLATION', 'REFUND_REQUEST', 'OTHER'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'نوع المنازعة غير صالح' },
        { status: 400 }
      );
    }

    // إنشاء المنازعة
    const disputeInput: CreateDisputeInput = {
      escrowId: body.escrowId,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      openedBy: user.id,
      againstUser: body.againstUser,
      type: body.type as DisputeType,
      reason: body.reason,
      description: body.description,
      attachments: body.attachments,
    };

    const dispute = await DisputeService.createDispute(disputeInput);

    return NextResponse.json({ dispute }, { status: 201 });
  } catch (error) {
    console.error('Error creating dispute:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء المنازعة';
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
