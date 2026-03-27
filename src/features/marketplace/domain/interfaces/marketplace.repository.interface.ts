/**
 * Marketplace Repository Interface
 * واجهة مستودع السوق
 *
 * Defines the contract for marketplace data access operations.
 */

import type { IRepository, BaseEntity } from '@/core/database';

// ============================================
// Product Entity Interface
// ============================================

/**
 * Product entity interface
 * واجهة كيان المنتج
 */
export interface ProductEntity extends BaseEntity {
  /** Product name */
  name: string;

  /** Product description */
  description: string;

  /** Product price */
  price: number;

  /** Product category */
  category: string;

  /** Product location */
  location: string;

  /** Product rating */
  rating: number;

  /** Number of reviews */
  reviews: number;

  /** Product image URL */
  image: string;

  /** Vendor (user) ID */
  vendorId: string;

  /** Vendor display name */
  vendorName: string | null;

  /** Company ID (if applicable) */
  companyId: string | null;
}

/**
 * Product with vendor info
 * المنتج مع معلومات البائع
 */
export interface ProductWithVendor extends ProductEntity {
  /** Vendor info */
  vendor: {
    id: string;
    displayName: string;
  } | null;
}

// ============================================
// Cart Entity Interfaces
// ============================================

/**
 * Cart entity interface
 * واجهة كيان السلة
 */
export interface CartEntity extends BaseEntity {
  /** User ID who owns the cart */
  userId: string;
}

/**
 * Cart item entity interface
 * واجهة كيان عنصر السلة
 */
export interface CartItemEntity extends BaseEntity {
  /** Cart ID this item belongs to */
  cartId: string;

  /** Product ID */
  productId: string;

  /** Quantity */
  quantity: number;
}

/**
 * Cart item with product info
 * عنصر السلة مع معلومات المنتج
 */
export interface CartItemWithProduct extends CartItemEntity {
  /** Product info */
  product: ProductEntity;
}

/**
 * Cart with items and totals
 * السلة مع العناصر والإجماليات
 */
export interface CartWithItems extends CartEntity {
  /** Cart items */
  items: CartItemWithProduct[];

  /** Calculated total */
  total: number;

  /** Total item count */
  itemCount: number;
}

// ============================================
// Wishlist Entity Interface
// ============================================

/**
 * Wishlist item entity interface
 * واجهة كيان عنصر المفضلة
 */
export interface WishlistItemEntity extends BaseEntity {
  /** User ID who owns the wishlist item */
  userId: string;

  /** Service ID (if wishlist item is a service) */
  serviceId: string | null;

  /** Product ID (if wishlist item is a product) */
  productId: string | null;
}

/**
 * Wishlist item type
 * نوع عنصر المفضلة
 */
export type WishlistItemType = 'service' | 'product';

/**
 * Wishlist item with details
 * عنصر المفضلة مع التفاصيل
 */
export interface WishlistItemWithDetails extends WishlistItemEntity {
  /** Item type */
  type: WishlistItemType;

  /** Item name */
  name: string;

  /** Item location */
  location: string | null;

  /** Item price */
  price: number;

  /** Item rating */
  rating: number | null;

  /** Item image */
  image: string | null;
}

// ============================================
// Product Filters
// ============================================

/**
 * Product filters
 * فلاتر المنتجات
 */
export interface ProductFilters {
  vendorId?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

// ============================================
// Repository Interfaces
// ============================================

/**
 * Product Repository Interface
 * واجهة مستودع المنتجات
 */
export interface IProductRepository extends IRepository<ProductEntity> {
  /**
   * Find products by vendor
   * البحث عن منتجات حسب البائع
   */
  findByVendor(vendorId: string): Promise<ProductEntity[]>;

  /**
   * Find product by ID with vendor info
   * البحث عن منتج بالمعرف مع معلومات البائع
   */
  findByIdWithVendor(id: string): Promise<ProductWithVendor | null>;

  /**
   * Find products with filters
   * البحث عن منتجات مع الفلاتر
   */
  findWithFilters(filters: ProductFilters): Promise<ProductEntity[]>;
}

/**
 * Cart Repository Interface
 * واجهة مستودع السلة
 */
export interface ICartRepository extends IRepository<CartEntity> {
  /**
   * Find cart by user ID
   * البحث عن سلة حسب معرف المستخدم
   */
  findByUserId(userId: string): Promise<CartEntity | null>;

  /**
   * Find cart with items by user ID
   * البحث عن سلة مع العناصر حسب معرف المستخدم
   */
  findWithItemsByUserId(userId: string): Promise<CartWithItems | null>;

  /**
   * Get or create cart for user
   * الحصول على أو إنشاء سلة للمستخدم
   */
  getOrCreateForUser(userId: string): Promise<CartEntity>;

  /**
   * Clear cart items
   * مسح عناصر السلة
   */
  clearCart(cartId: string): Promise<void>;
}

/**
 * Cart Item Repository Interface
 * واجهة مستودع عناصر السلة
 */
export interface ICartItemRepository extends IRepository<CartItemEntity> {
  /**
   * Find cart item by cart and product
   * البحث عن عنصر سلة حسب السلة والمنتج
   */
  findByCartAndProduct(cartId: string, productId: string): Promise<CartItemEntity | null>;

  /**
   * Find items by cart
   * البحث عن عناصر حسب السلة
   */
  findByCart(cartId: string): Promise<CartItemWithProduct[]>;

  /**
   * Update quantity
   * تحديث الكمية
   */
  updateQuantity(itemId: string, quantity: number): Promise<CartItemWithProduct | null>;
}

/**
 * Wishlist Repository Interface
 * واجهة مستودع المفضلة
 */
export interface IWishlistRepository extends IRepository<WishlistItemEntity> {
  /**
   * Find wishlist items by user
   * البحث عن عناصر المفضلة حسب المستخدم
   */
  findByUserId(userId: string): Promise<WishlistItemWithDetails[]>;

  /**
   * Check if item exists in wishlist
   * التحقق إذا كان العنصر موجوداً في المفضلة
   */
  existsByUserAndItem(userId: string, serviceId?: string | null, productId?: string | null): Promise<boolean>;

  /**
   * Find wishlist item by user and item
   * البحث عن عنصر المفضلة حسب المستخدم والعنصر
   */
  findByUserAndItem(userId: string, serviceId?: string | null, productId?: string | null): Promise<WishlistItemEntity | null>;

  /**
   * Remove item from wishlist
   * إزالة عنصر من المفضلة
   */
  removeByUserAndId(userId: string, itemId: string): Promise<boolean>;
}
