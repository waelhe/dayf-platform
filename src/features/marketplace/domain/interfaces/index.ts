/**
 * Marketplace Domain Interfaces
 * واجهات نطاق السوق
 *
 * Exports all marketplace domain interfaces and types.
 */

export type {
  // Product Types
  ProductEntity,
  ProductWithVendor,
  ProductFilters,

  // Cart Types
  CartEntity,
  CartItemEntity,
  CartItemWithProduct,
  CartWithItems,

  // Wishlist Types
  WishlistItemEntity,
  WishlistItemType,
  WishlistItemWithDetails,

  // Repository Interfaces
  IProductRepository,
  ICartRepository,
  ICartItemRepository,
  IWishlistRepository,
} from './marketplace.repository.interface';
