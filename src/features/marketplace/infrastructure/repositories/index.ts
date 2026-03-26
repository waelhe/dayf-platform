/**
 * Marketplace Infrastructure Repositories
 * مستودعات البنية التحتية للسوق
 *
 * Exports all marketplace repository implementations.
 */

export {
  // Repository Classes
  ProductRepository,
  CartRepository,
  CartItemRepository,
  WishlistRepository,

  // Singleton Getters
  getProductRepository,
  getCartRepository,
  getCartItemRepository,
  getWishlistRepository,
} from './marketplace.repository';

// Re-export types for convenience
export type {
  ProductEntity,
  ProductWithVendor,
  ProductFilters,
  CartEntity,
  CartItemEntity,
  CartItemWithProduct,
  CartWithItems,
  WishlistItemEntity,
  WishlistItemType,
  WishlistItemWithDetails,
  IProductRepository,
  ICartRepository,
  ICartItemRepository,
  IWishlistRepository,
} from '../../domain/interfaces';
