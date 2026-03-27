/**
 * Marketplace Repository Implementation
 * تنفيذ مستودع السوق
 *
 * Implements ProductRepository, CartRepository, CartItemRepository, and WishlistRepository
 * using Supabase as the data source.
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES } from '@/lib/supabase';
import { DatabaseError } from '@/core/database';
import type {
  ProductEntity,
  ProductWithVendor,
  CartEntity,
  CartItemEntity,
  CartItemWithProduct,
  CartWithItems,
  WishlistItemEntity,
  WishlistItemWithDetails,
  ProductFilters,
  IProductRepository,
  ICartRepository,
  ICartItemRepository,
  IWishlistRepository,
} from '../../domain/interfaces';

// ============================================
// Supabase Types (Local Definitions)
// ============================================

/**
 * Product row in Supabase (snake_case)
 * صف المنتج في Supabase
 */
interface SupabaseProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
  vendor_id: string;
  vendor_name: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Cart row in Supabase (snake_case)
 * صف السلة في Supabase
 */
interface SupabaseCart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Cart item row in Supabase (snake_case)
 * صف عنصر السلة في Supabase
 */
interface SupabaseCartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

/**
 * Wishlist item row in Supabase (snake_case)
 * صف عنصر المفضلة في Supabase
 */
interface SupabaseWishlistItem {
  id: string;
  user_id: string;
  service_id: string | null;
  product_id: string | null;
  created_at: string;
}

/**
 * User row for vendor info
 * صف المستخدم لمعلومات البائع
 */
interface SupabaseUser {
  id: string;
  display_name: string;
}

// ============================================
// Product Repository
// ============================================

/**
 * Product Repository
 * مستودع المنتجات
 */
export class ProductRepository extends BaseRepository<ProductEntity> implements IProductRepository {
  constructor() {
    super(TABLES.PRODUCTS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): ProductEntity {
    const dbRow = row as unknown as SupabaseProduct;

    return {
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description,
      price: dbRow.price,
      category: dbRow.category,
      location: dbRow.location,
      rating: dbRow.rating,
      reviews: dbRow.reviews,
      image: dbRow.image,
      vendorId: dbRow.vendor_id,
      vendorName: dbRow.vendor_name,
      companyId: dbRow.company_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<ProductEntity>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.name !== undefined) row.name = entity.name;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.price !== undefined) row.price = entity.price;
    if (entity.category !== undefined) row.category = entity.category;
    if (entity.location !== undefined) row.location = entity.location;
    if (entity.rating !== undefined) row.rating = entity.rating;
    if (entity.reviews !== undefined) row.reviews = entity.reviews;
    if (entity.image !== undefined) row.image = entity.image;
    if (entity.vendorId !== undefined) row.vendor_id = entity.vendorId;
    if (entity.vendorName !== undefined) row.vendor_name = entity.vendorName;
    if (entity.companyId !== undefined) row.company_id = entity.companyId;

    return row;
  }

  // ============================================
  // Product-Specific Repository Methods
  // ============================================

  /**
   * Find products by vendor
   * البحث عن منتجات حسب البائع
   */
  async findByVendor(vendorId: string): Promise<ProductEntity[]> {
    return this.findMany({
      filters: { vendor_id: vendorId },
      sort: { field: 'created_at', direction: 'desc' },
    });
  }

  /**
   * Find product by ID with vendor info
   * البحث عن منتج بالمعرف مع معلومات البائع
   */
  async findByIdWithVendor(id: string): Promise<ProductWithVendor | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select(`
          *,
          vendor:users!vendor_id (
            id,
            display_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, id });
      }

      return data ? this.toProductWithVendor(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, id });
    }
  }

  /**
   * Find products with filters
   * البحث عن منتجات مع الفلاتر
   */
  async findWithFilters(filters: ProductFilters): Promise<ProductEntity[]> {
    try {
      const client = this.getClient();
      let query = client
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.vendorId) {
        query = query.eq('vendor_id', filters.vendorId);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.minRating !== undefined) {
        query = query.gte('rating', filters.minRating);
      }

      const { data, error } = await query;

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, filters });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, filters });
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private toProductWithVendor(row: Record<string, unknown>): ProductWithVendor {
    const dbRow = row as SupabaseProduct & { vendor: SupabaseUser | null };

    return {
      id: dbRow.id,
      name: dbRow.name,
      description: dbRow.description,
      price: dbRow.price,
      category: dbRow.category,
      location: dbRow.location,
      rating: dbRow.rating,
      reviews: dbRow.reviews,
      image: dbRow.image,
      vendorId: dbRow.vendor_id,
      vendorName: dbRow.vendor_name,
      companyId: dbRow.company_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
      vendor: dbRow.vendor ? {
        id: dbRow.vendor.id,
        displayName: dbRow.vendor.display_name,
      } : null,
    };
  }
}

// ============================================
// Cart Repository
// ============================================

/**
 * Cart Repository
 * مستودع السلة
 */
export class CartRepository extends BaseRepository<CartEntity> implements ICartRepository {
  constructor() {
    super(TABLES.CARTS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): CartEntity {
    const dbRow = row as unknown as SupabaseCart;

    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<CartEntity>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.userId !== undefined) row.user_id = entity.userId;

    return row;
  }

  // ============================================
  // Cart-Specific Repository Methods
  // ============================================

  /**
   * Find cart by user ID
   * البحث عن سلة حسب معرف المستخدم
   */
  async findByUserId(userId: string): Promise<CartEntity | null> {
    return this.findOne({ user_id: userId });
  }

  /**
   * Find cart with items by user ID
   * البحث عن سلة مع العناصر حسب معرف المستخدم
   */
  async findWithItemsByUserId(userId: string): Promise<CartWithItems | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select(`
          *,
          items:cart_items (
            id,
            cart_id,
            product_id,
            quantity,
            created_at,
            updated_at,
            product:products (
              id,
              name,
              description,
              price,
              category,
              location,
              rating,
              reviews,
              image,
              vendor_id,
              vendor_name,
              company_id,
              created_at,
              updated_at
            )
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw DatabaseError.fromError(error, { table: this.tableName, userId });
      }

      if (!data) return null;

      return this.toCartWithItems(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId });
    }
  }

  /**
   * Get or create cart for user
   * الحصول على أو إنشاء سلة للمستخدم
   */
  async getOrCreateForUser(userId: string): Promise<CartEntity> {
    let cart = await this.findByUserId(userId);

    if (!cart) {
      cart = await this.create({ userId });
    }

    return cart;
  }

  /**
   * Clear cart items
   * مسح عناصر السلة
   */
  async clearCart(cartId: string): Promise<void> {
    try {
      const client = this.getClient();
      const { error } = await client
        .from(TABLES.CART_ITEMS)
        .delete()
        .eq('cart_id', cartId);

      if (error) {
        throw DatabaseError.fromError(error, { table: TABLES.CART_ITEMS, cartId });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: TABLES.CART_ITEMS, cartId });
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private toCartWithItems(row: Record<string, unknown>): CartWithItems {
    const dbRow = row as SupabaseCart & {
      items: (SupabaseCartItem & {
        product: SupabaseProduct;
      })[];
    };

    const items: CartItemWithProduct[] = (dbRow.items || []).map(item => ({
      id: item.id,
      cartId: item.cart_id,
      productId: item.product_id,
      quantity: item.quantity,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      product: {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        price: item.product.price,
        category: item.product.category,
        location: item.product.location,
        rating: item.product.rating,
        reviews: item.product.reviews,
        image: item.product.image,
        vendorId: item.product.vendor_id,
        vendorName: item.product.vendor_name,
        companyId: item.product.company_id,
        createdAt: item.product.created_at,
        updatedAt: item.product.updated_at,
      },
    }));

    const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
      items,
      total,
      itemCount,
    };
  }
}

// ============================================
// Cart Item Repository
// ============================================

/**
 * Cart Item Repository
 * مستودع عناصر السلة
 */
export class CartItemRepository extends BaseRepository<CartItemEntity> implements ICartItemRepository {
  constructor() {
    super(TABLES.CART_ITEMS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): CartItemEntity {
    const dbRow = row as unknown as SupabaseCartItem;

    return {
      id: dbRow.id,
      cartId: dbRow.cart_id,
      productId: dbRow.product_id,
      quantity: dbRow.quantity,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<CartItemEntity>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.cartId !== undefined) row.cart_id = entity.cartId;
    if (entity.productId !== undefined) row.product_id = entity.productId;
    if (entity.quantity !== undefined) row.quantity = entity.quantity;

    return row;
  }

  // ============================================
  // Cart Item-Specific Repository Methods
  // ============================================

  /**
   * Find cart item by cart and product
   * البحث عن عنصر سلة حسب السلة والمنتج
   */
  async findByCartAndProduct(cartId: string, productId: string): Promise<CartItemEntity | null> {
    return this.findOne({
      cart_id: cartId,
      product_id: productId,
    });
  }

  /**
   * Find items by cart
   * البحث عن عناصر حسب السلة
   */
  async findByCart(cartId: string): Promise<CartItemWithProduct[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select(`
          *,
          product:products (
            id,
            name,
            description,
            price,
            category,
            location,
            rating,
            reviews,
            image,
            vendor_id,
            vendor_name,
            company_id,
            created_at,
            updated_at
          )
        `)
        .eq('cart_id', cartId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, cartId });
      }

      return (data || []).map(row => this.toCartItemWithProduct(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, cartId });
    }
  }

  /**
   * Update quantity
   * تحديث الكمية
   */
  async updateQuantity(itemId: string, quantity: number): Promise<CartItemWithProduct | null> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .select(`
          *,
          product:products (
            id,
            name,
            description,
            price,
            category,
            location,
            rating,
            reviews,
            image,
            vendor_id,
            vendor_name,
            company_id,
            created_at,
            updated_at
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw DatabaseError.fromError(error, { table: this.tableName, itemId, quantity });
      }

      return data ? this.toCartItemWithProduct(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, itemId, quantity });
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private toCartItemWithProduct(row: Record<string, unknown>): CartItemWithProduct {
    const dbRow = row as SupabaseCartItem & {
      product: SupabaseProduct;
    };

    return {
      id: dbRow.id,
      cartId: dbRow.cart_id,
      productId: dbRow.product_id,
      quantity: dbRow.quantity,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
      product: {
        id: dbRow.product.id,
        name: dbRow.product.name,
        description: dbRow.product.description,
        price: dbRow.product.price,
        category: dbRow.product.category,
        location: dbRow.product.location,
        rating: dbRow.product.rating,
        reviews: dbRow.product.reviews,
        image: dbRow.product.image,
        vendorId: dbRow.product.vendor_id,
        vendorName: dbRow.product.vendor_name,
        companyId: dbRow.product.company_id,
        createdAt: dbRow.product.created_at,
        updatedAt: dbRow.product.updated_at,
      },
    };
  }
}

// ============================================
// Wishlist Repository
// ============================================

/**
 * Wishlist Repository
 * مستودع المفضلة
 */
export class WishlistRepository extends BaseRepository<WishlistItemEntity> implements IWishlistRepository {
  constructor() {
    super(TABLES.WISHLIST_ITEMS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): WishlistItemEntity {
    const dbRow = row as unknown as SupabaseWishlistItem;

    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      serviceId: dbRow.service_id,
      productId: dbRow.product_id,
      createdAt: dbRow.created_at,
    };
  }

  protected override toRow(entity: Partial<WishlistItemEntity>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.userId !== undefined) row.user_id = entity.userId;
    if (entity.serviceId !== undefined) row.service_id = entity.serviceId;
    if (entity.productId !== undefined) row.product_id = entity.productId;

    return row;
  }

  // ============================================
  // Wishlist-Specific Repository Methods
  // ============================================

  /**
   * Find wishlist items by user
   * البحث عن عناصر المفضلة حسب المستخدم
   */
  async findByUserId(userId: string): Promise<WishlistItemWithDetails[]> {
    try {
      const client = this.getClient();

      // Use raw SQL to join with services and products
      const { data, error } = await client.rpc('get_wishlist_with_details', { p_user_id: userId });

      // If RPC doesn't exist, fallback to manual join
      if (error && error.code === 'PGRST202') {
        return this.findByUserIdFallback(userId);
      }

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, userId });
      }

      return (data || []).map((row: Record<string, unknown>) => this.toWishlistItemWithDetails(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      // Try fallback
      return this.findByUserIdFallback(userId);
    }
  }

  /**
   * Fallback method to get wishlist items with details
   * طريقة بديلة للحصول على عناصر المفضلة مع التفاصيل
   */
  private async findByUserIdFallback(userId: string): Promise<WishlistItemWithDetails[]> {
    try {
      const client = this.getClient();

      // Get wishlist items
      const { data: wishlistItems, error: wishlistError } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (wishlistError) {
        throw DatabaseError.fromError(wishlistError, { table: this.tableName, userId });
      }

      if (!wishlistItems || wishlistItems.length === 0) {
        return [];
      }

      // Get product IDs and service IDs
      const productIds = wishlistItems
        .filter(item => item.product_id)
        .map(item => item.product_id);

      const serviceIds = wishlistItems
        .filter(item => item.service_id)
        .map(item => item.service_id);

      // Fetch products and services
      const [productsResult, servicesResult] = await Promise.all([
        productIds.length > 0
          ? client.from(TABLES.PRODUCTS).select('*').in('id', productIds)
          : { data: [], error: null },
        serviceIds.length > 0
          ? client.from('services').select('*').in('id', serviceIds)
          : { data: [], error: null },
      ]);

      // Create maps for quick lookup
      const productsMap = new Map((productsResult.data || []).map((p: SupabaseProduct) => [p.id, p]));
      const servicesMap = new Map((servicesResult.data || []).map((s: Record<string, unknown>) => [s.id, s]));

      // Combine wishlist items with details
      return wishlistItems.map(item => {
        let details: WishlistItemWithDetails;

        if (item.product_id) {
          const product = productsMap.get(item.product_id) as SupabaseProduct | undefined;
          details = {
            id: item.id,
            userId: item.user_id,
            serviceId: null,
            productId: item.product_id,
            createdAt: item.created_at,
            type: 'product',
            name: product?.name || 'Unknown Product',
            location: product?.location || null,
            price: product?.price || 0,
            rating: product?.rating || null,
            image: product?.image || null,
          };
        } else if (item.service_id) {
          const service = servicesMap.get(item.service_id) as Record<string, unknown> | undefined;
          details = {
            id: item.id,
            userId: item.user_id,
            serviceId: item.service_id,
            productId: null,
            createdAt: item.created_at,
            type: 'service',
            name: (service?.title as string) || 'Unknown Service',
            location: (service?.location as string) || null,
            price: (service?.price as number) || 0,
            rating: (service?.rating as number) || null,
            image: service?.images ? (JSON.parse(service.images as string)[0] as string) : null,
          };
        } else {
          details = {
            id: item.id,
            userId: item.user_id,
            serviceId: null,
            productId: null,
            createdAt: item.created_at,
            type: 'product',
            name: 'Unknown Item',
            location: null,
            price: 0,
            rating: null,
            image: null,
          };
        }

        return details;
      });
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId });
    }
  }

  /**
   * Check if item exists in wishlist
   * التحقق إذا كان العنصر موجوداً في المفضلة
   */
  async existsByUserAndItem(
    userId: string,
    serviceId?: string | null,
    productId?: string | null
  ): Promise<boolean> {
    const item = await this.findByUserAndItem(userId, serviceId, productId);
    return item !== null;
  }

  /**
   * Find wishlist item by user and item
   * البحث عن عنصر المفضلة حسب المستخدم والعنصر
   */
  async findByUserAndItem(
    userId: string,
    serviceId?: string | null,
    productId?: string | null
  ): Promise<WishlistItemEntity | null> {
    const filters: Record<string, unknown> = { user_id: userId };

    if (serviceId) {
      filters.service_id = serviceId;
    } else if (productId) {
      filters.product_id = productId;
    }

    return this.findOne(filters);
  }

  /**
   * Remove item from wishlist
   * إزالة عنصر من المفضلة
   */
  async removeByUserAndId(userId: string, itemId: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const { error } = await client
        .from(this.tableName)
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, userId, itemId });
      }

      return true;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId, itemId });
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private toWishlistItemWithDetails(row: Record<string, unknown>): WishlistItemWithDetails {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      serviceId: row.service_id as string | null,
      productId: row.product_id as string | null,
      createdAt: row.created_at as string,
      type: (row.type as 'service' | 'product') || 'product',
      name: (row.name as string) || 'Unknown',
      location: row.location as string | null,
      price: (row.price as number) || 0,
      rating: row.rating as number | null,
      image: row.image as string | null,
    };
  }
}

// ============================================
// Singleton Instances
// ============================================

let productRepositoryInstance: ProductRepository | null = null;
let cartRepositoryInstance: CartRepository | null = null;
let cartItemRepositoryInstance: CartItemRepository | null = null;
let wishlistRepositoryInstance: WishlistRepository | null = null;

/**
 * Get the ProductRepository singleton instance
 * الحصول على مثيل مستودع المنتجات
 */
export function getProductRepository(): ProductRepository {
  if (!productRepositoryInstance) {
    productRepositoryInstance = new ProductRepository();
  }
  return productRepositoryInstance;
}

/**
 * Get the CartRepository singleton instance
 * الحصول على مثيل مستودع السلة
 */
export function getCartRepository(): CartRepository {
  if (!cartRepositoryInstance) {
    cartRepositoryInstance = new CartRepository();
  }
  return cartRepositoryInstance;
}

/**
 * Get the CartItemRepository singleton instance
 * الحصول على مثيل مستودع عناصر السلة
 */
export function getCartItemRepository(): CartItemRepository {
  if (!cartItemRepositoryInstance) {
    cartItemRepositoryInstance = new CartItemRepository();
  }
  return cartItemRepositoryInstance;
}

/**
 * Get the WishlistRepository singleton instance
 * الحصول على مثيل مستودع المفضلة
 */
export function getWishlistRepository(): WishlistRepository {
  if (!wishlistRepositoryInstance) {
    wishlistRepositoryInstance = new WishlistRepository();
  }
  return wishlistRepositoryInstance;
}
