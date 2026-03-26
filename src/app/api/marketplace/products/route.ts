import { NextRequest, NextResponse } from 'next/server';
import { getProductRepository } from '@/features/marketplace/infrastructure/repositories';

/**
 * GET /api/marketplace/products
 * Get all products or filter by vendorId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    const productRepository = getProductRepository();

    let products;
    if (vendorId) {
      products = await productRepository.findByVendor(vendorId);
    } else {
      products = await productRepository.findMany({
        sort: { field: 'created_at', direction: 'desc' },
      });
    }

    // Transform products to include vendor field for frontend compatibility
    const transformedProducts = products.map(product => ({
      ...product,
      vendor: product.vendorName || product.vendorId,
    }));

    return NextResponse.json({
      products: transformedProducts,
      total: products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, category, location, image, vendorId } = body;

    if (!name || !description || !price || !category || !location || !image || !vendorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const productRepository = getProductRepository();

    const product = await productRepository.create({
      name,
      description,
      price: parseFloat(price),
      category,
      location,
      image,
      vendorId,
      rating: 0,
      reviews: 0,
      vendorName: null,
      companyId: null,
    });

    // Fetch the product with vendor info
    const productWithVendor = await productRepository.findByIdWithVendor(product.id);

    return NextResponse.json({ product: productWithVendor || product });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
