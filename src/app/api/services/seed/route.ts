/**
 * Services Seeding API
 * API لزرع الخدمات الأولية في قاعدة البيانات
 * Version: Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { INITIAL_SERVICES } from '@/features/services/data/initialServices';

export async function POST(request: NextRequest) {
  try {
    // Check if services already exist
    const { count: existingCount, error: countError } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting services:', countError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing services',
      }, { status: 500 });
    }
    
    if (existingCount && existingCount > 0) {
      // Check if force seeding is requested
      const body = await request.json().catch(() => ({}));
      const force = body.force === true;
      
      if (!force) {
        return NextResponse.json({
          success: true,
          message: 'Services already exist. Use force=true to reseed.',
          count: existingCount
        });
      }
      
      // Delete existing services if force is true
      await supabaseAdmin.from('services').delete().neq('id', 'placeholder');
    }
    
    // Seed services
    const servicesToCreate = INITIAL_SERVICES.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description,
      location: service.location,
      price: service.price,
      original_price: service.originalPrice || null,
      rating: service.rating,
      reviews: service.reviews,
      views: 0,
      images: service.images,
      type: service.type,
      amenities: service.amenities || [],
      features: service.features || [],
      main_category_id: service.mainCategoryId,
      sub_category_id: service.subCategoryId || null,
      sub_sub_category_id: service.subSubCategoryId || null,
      host_id: null, // Will be linked later if user exists
      host_name: service.host?.name || null,
      host_avatar: service.host?.avatar || null,
      is_superhost: service.host?.isSuperhost || false,
      is_popular: service.isPopular || false,
      max_guests: 4,
      bedrooms: 1,
      beds: 1,
      baths: 1,
    }));
    
    // Create services in batches
    const batchSize = 10;
    let created = 0;
    
    for (let i = 0; i < servicesToCreate.length; i += batchSize) {
      const batch = servicesToCreate.slice(i, i + batchSize);
      const { error: insertError } = await supabaseAdmin
        .from('services')
        .insert(batch);
      
      if (insertError) {
        console.error('Error inserting batch:', insertError);
        // Continue with next batch
      } else {
        created += batch.length;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${created} services`,
      count: created
    });
    
  } catch (error) {
    console.error('Error seeding services:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to seed services',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { count, error: countError } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting services:', countError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check services'
      }, { status: 500 });
    }

    const { data: services, error: fetchError } = await supabase
      .from('services')
      .select('id, title, main_category_id, is_popular, rating')
      .limit(5);

    if (fetchError) {
      console.error('Error fetching services:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch services'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      count: count || 0,
      sample: services || []
    });
  } catch (error) {
    console.error('Error checking services:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check services'
    }, { status: 500 });
  }
}
