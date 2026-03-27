/**
 * Order Repository Interface
 * واجهة مستودع الطلبات
 * 
 * Defines the contract for order data access operations.
 */

import type { IRepository, BaseEntity } from '@/core/database';
import { OrderStatus } from '@/core/types/enums';

export { OrderStatus };

/**
 * Order item entity
 * كيان عنصر الطلب
 */
export interface OrderItem extends BaseEntity {
  /** Order ID */
  orderId: string;
  
  /** Product ID */
  productId: string;
  
  /** Quantity */
  quantity: number;
  
  /** Price at time of order */
  price: number;
}

/**
 * Order entity interface
 * واجهة كيان الطلب
 */
export interface Order extends BaseEntity {
  /** User ID */
  userId: string;
  
  /** Total price */
  total: number;
  
  /** Order status */
  status: OrderStatus;
  
  /** Escrow ID if payment is held */
  escrowId: string | null;
}

/**
 * Order with items
 * طلب مع العناصر
 */
export interface OrderWithItems extends Order {
  items: OrderItem[];
}

/**
 * Order repository interface
 * واجهة مستودع الطلبات
 */
export interface IOrderRepository extends IRepository<Order> {
  /**
   * Find orders by user ID
   * البحث عن طلبات بواسطة المستخدم
   */
  findByUser(userId: string): Promise<Order[]>;

  /**
   * Find order with items
   * البحث عن طلب مع العناصر
   */
  findWithItems(orderId: string): Promise<OrderWithItems | null>;

  /**
   * Find orders with items by user
   * البحث عن طلبات مع العناصر بواسطة المستخدم
   */
  findByUserWithItems(userId: string): Promise<OrderWithItems[]>;

  /**
   * Update order status
   * تحديث حالة الطلب
   */
  updateStatus(orderId: string, status: OrderStatus): Promise<void>;

  /**
   * Create order with items
   * إنشاء طلب مع العناصر
   */
  createWithItems(
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
    items: Omit<OrderItem, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<OrderWithItems>;

  /**
   * Link order to escrow
   * ربط الطلب بالضمان
   */
  linkEscrow(orderId: string, escrowId: string): Promise<void>;
}

/**
 * Order item repository interface
 * واجهة مستودع عناصر الطلب
 */
export interface IOrderItemRepository extends IRepository<OrderItem> {
  /**
   * Find items by order ID
   * البحث عن عناصر بواسطة الطلب
   */
  findByOrder(orderId: string): Promise<OrderItem[]>;
}
