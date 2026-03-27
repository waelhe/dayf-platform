// API Route: /api/destinations
// GET - List destinations
// POST - Create destination

import { NextRequest, NextResponse } from 'next/server';
import { DestinationService } from '@/features/tourism';
import { DestinationType } from '@/core/types/enums';

// GET /api/destinations - List destinations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters = {
      type: searchParams.get('type') as DestinationType | undefined,
      city: searchParams.get('city') || undefined,
      search: searchParams.get('search') || undefined,
      isVerified: searchParams.get('verified') === 'true' ? true : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    };
    
    const result = await DestinationService.listDestinations(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing destinations:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الوجهات' },
      { status: 500 }
    );
  }
}

// POST /api/destinations - Create destination
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type || !body.description || !body.city) {
      return NextResponse.json(
        { error: 'الاسم والنوع والوصف والمدينة مطلوبة' },
        { status: 400 }
      );
    }
    
    // Validate images
    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        { error: 'يجب إضافة صورة واحدة على الأقل' },
        { status: 400 }
      );
    }
    
    // Create destination
    const destination = await DestinationService.createDestination({
      name: body.name,
      type: body.type as DestinationType,
      description: body.description,
      shortDesc: body.shortDesc,
      city: body.city,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      images: body.images,
      coverImage: body.coverImage,
      highlights: body.highlights,
      bestTimeToVisit: body.bestTimeToVisit,
      entryFee: body.entryFee,
      openingHours: body.openingHours,
      duration: body.duration,
    });
    
    return NextResponse.json(destination, { status: 201 });
  } catch (error) {
    console.error('Error creating destination:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الوجهة' },
      { status: 500 }
    );
  }
}
