// API Route: /api/destinations/[id]
// GET - Get destination details
// PUT - Update destination

import { NextRequest, NextResponse } from 'next/server';
import { DestinationService } from '@/features/tourism';

// GET /api/destinations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if it's a slug (contains hyphen and letters) or an ID
    const isSlug = id.includes('-') && /[a-z]/.test(id);
    
    const destination = isSlug
      ? await DestinationService.getDestinationBySlug(id)
      : await DestinationService.getDestinationById(id);
    
    if (!destination) {
      return NextResponse.json(
        { error: 'الوجهة غير موجودة' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(destination);
  } catch (error) {
    console.error('Error getting destination:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الوجهة' },
      { status: 500 }
    );
  }
}

// PUT /api/destinations/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Transform arrays if provided
    const updateData = { ...body };
    if (body.images) updateData.images = body.images;
    if (body.highlights) updateData.highlights = body.highlights;
    if (body.openingHours) updateData.openingHours = body.openingHours;
    
    const destination = await DestinationService.updateDestination(id, updateData);
    
    return NextResponse.json(destination);
  } catch (error) {
    console.error('Error updating destination:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الوجهة' },
      { status: 500 }
    );
  }
}

// DELETE /api/destinations/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // TODO: Check permissions
    
    await DestinationService.deleteDestination(id);
    
    return NextResponse.json({ success: true, message: 'تم حذف الوجهة' });
  } catch (error) {
    console.error('Error deleting destination:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الوجهة' },
      { status: 500 }
    );
  }
}
