import { NextRequest, NextResponse } from 'next/server';
import { servicesService } from '@/features/services/infrastructure/services-service';

// Services API - Updated with new fields support
// GET /api/services - Get all services or by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const hostId = searchParams.get('host');
    const query = searchParams.get('q');
    const popular = searchParams.get('popular');
    const limit = parseInt(searchParams.get('limit') || '20');

    let services;

    if (query) {
      services = await servicesService.search(query);
    } else if (categoryId) {
      services = await servicesService.getByCategory(categoryId);
    } else if (hostId) {
      services = await servicesService.getByHost(hostId);
    } else if (popular === 'true') {
      services = await servicesService.getPopular(limit);
    } else {
      services = await servicesService.getAll();
    }

    return NextResponse.json({
      services,
      total: services.length,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST /api/services - Create new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'location', 'price', 'images', 'type', 'mainCategoryId', 'hostId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const service = await servicesService.create({
      title: body.title,
      description: body.description || '',
      location: body.location,
      price: Number(body.price),
      rating: body.rating || 0,
      reviews: body.reviews || 0,
      views: 0,
      images: body.images,
      type: body.type,
      amenities: body.amenities || [],
      features: body.features || [],
      mainCategoryId: body.mainCategoryId,
      subCategoryId: body.subCategoryId,
      hostId: body.hostId,
      maxGuests: body.maxGuests || 4,
      bedrooms: body.bedrooms || 1,
      beds: body.beds || 1,
      baths: body.baths || 1,
      isSuperhost: false,
      isPopular: false,
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
