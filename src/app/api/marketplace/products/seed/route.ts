import { NextRequest, NextResponse } from 'next/server';
import { getProductRepository } from '@/features/marketplace/infrastructure/repositories';
import { getUserRepository } from '@/features/auth/infrastructure/repositories/user.repository';

interface SeedProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  location: string;
  image: string;
  rating?: number;
  reviews?: number;
}

/**
 * POST /api/marketplace/products/seed
 * Seed products for the marketplace
 */
export async function POST(request: NextRequest) {
  try {
    const productRepo = getProductRepository();
    const userRepo = getUserRepository();
    
    const body = await request.json();
    const { products, vendorId } = body;

    if (!products || !Array.isArray(products) || !vendorId) {
      return NextResponse.json(
        { error: 'Missing products array or vendorId' },
        { status: 400 }
      );
    }

    // Verify vendor exists
    const vendor = await userRepo.findById(vendorId);

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Create products
    const createdProducts = await Promise.all(
      products.map((product: SeedProduct) =>
        productRepo.create({
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          location: product.location,
          image: product.image,
          rating: product.rating || 4.5,
          reviews: product.reviews || 0,
          vendorId,
          vendorName: vendor.displayName,
          companyId: null,
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: createdProducts.length,
      products: createdProducts,
    });
  } catch (error) {
    console.error('Error seeding products:', error);
    return NextResponse.json(
      { error: 'Failed to seed products' },
      { status: 500 }
    );
  }
}
