/**
 * Marketplace Types
 * Adapted for Prisma ORM
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
  vendorId: string;
  vendor?: {
    id: string;
    displayName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

// API Response Types
export interface ProductsResponse {
  products: Product[];
  total: number;
}

export interface ProductResponse {
  product: Product | null;
}

// Product creation/update types
export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  location: string;
  image: string;
  vendorId: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}
