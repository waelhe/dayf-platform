/**
 * Order Repository Implementation
 * تنفيذ مستودع الطلبات
 * 
 * Implements IOrderRepository using Supabase as the data source.
 */

import { BaseRepository } from '@/infrastructure/repositories/base.repository';
import { getSupabaseProvider } from '@/infrastructure/database/supabase-provider';
import { TABLES, type SupabaseOrder, type SupabaseOrderItem } from '@/lib/supabase';
import type { Order, OrderItem, OrderWithItems, IOrderRepository, IOrderItemRepository } from '../../domain/interfaces';
import { OrderStatus } from '@/core/types/enums';
import { DatabaseError } from '@/core/database';

/**
 * Order Repository
 * مستودع الطلبات
 */
export class OrderRepository extends BaseRepository<Order> implements IOrderRepository {
  constructor() {
    super(TABLES.ORDERS, getSupabaseProvider());
  }

  // ============================================
  // Entity Mapping Methods
  // ============================================

  protected override toEntity(row: Record<string, unknown>): Order {
    const dbRow = row as unknown as SupabaseOrder;
    
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      total: dbRow.total,
      status: dbRow.status as OrderStatus,
      escrowId: dbRow.escrow_id,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }

  protected override toRow(entity: Partial<Order>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.userId !== undefined) row.user_id = entity.userId;
    if (entity.total !== undefined) row.total = entity.total;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.escrowId !== undefined) row.escrow_id = entity.escrowId;

    return row;
  }

  // ============================================
  // Order-Specific Repository Methods
  // ============================================

  /**
   * Find orders by user ID
   * البحث عن طلبات بواسطة المستخدم
   */
  async findByUser(userId: string): Promise<Order[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, userId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId });
    }
  }

  /**
   * Find order with items
   * البحث عن طلب مع العناصر
   */
  async findWithItems(orderId: string): Promise<OrderWithItems | null> {
    try {
      const client = this.getClient();
      
      // Get order
      const { data: orderData, error: orderError } = await client
        .from(this.tableName)
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) {
        if (orderError.code === 'PGRST116') return null;
        throw DatabaseError.fromError(orderError, { table: this.tableName, orderId });
      }

      if (!orderData) return null;

      // Get items
      const { data: itemsData, error: itemsError } = await client
        .from(TABLES.ORDER_ITEMS)
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        throw DatabaseError.fromError(itemsError, { table: TABLES.ORDER_ITEMS, orderId });
      }

      return {
        ...this.toEntity(orderData),
        items: (itemsData || []).map(item => this.toItemEntity(item)),
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, orderId });
    }
  }

  /**
   * Find orders with items by user
   * البحث عن طلبات مع العناصر بواسطة المستخدم
   */
  async findByUserWithItems(userId: string): Promise<OrderWithItems[]> {
    try {
      const client = this.getClient();
      
      // Get orders
      const orders = await this.findByUser(userId);
      
      // Get items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const orderWithItems = await this.findWithItems(order.id);
          return orderWithItems;
        })
      );

      return ordersWithItems.filter((o): o is OrderWithItems => o !== null);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, userId });
    }
  }

  /**
   * Update order status
   * تحديث حالة الطلب
   */
  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          status,
          updated_at: now,
        })
        .eq('id', orderId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, orderId, operation: 'updateStatus' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, orderId, operation: 'updateStatus' });
    }
  }

  /**
   * Create order with items
   * إنشاء طلب مع العناصر
   */
  async createWithItems(
    order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>,
    items: Omit<OrderItem, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<OrderWithItems> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      // Create order
      const { data: orderData, error: orderError } = await client
        .from(this.tableName)
        .insert({
          user_id: order.userId,
          total: order.total,
          status: order.status || OrderStatus.PENDING,
          escrow_id: order.escrowId,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (orderError) {
        throw DatabaseError.fromError(orderError, { table: this.tableName, operation: 'createWithItems' });
      }

      const newOrder = this.toEntity(orderData);

      // Create items
      const itemRows = items.map(item => ({
        order_id: newOrder.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        created_at: now,
        updated_at: now,
      }));

      const { data: itemsData, error: itemsError } = await client
        .from(TABLES.ORDER_ITEMS)
        .insert(itemRows)
        .select();

      if (itemsError) {
        // Try to rollback the order
        await client.from(this.tableName).delete().eq('id', newOrder.id);
        throw DatabaseError.fromError(itemsError, { table: TABLES.ORDER_ITEMS, operation: 'createWithItems' });
      }

      return {
        ...newOrder,
        items: (itemsData || []).map(item => this.toItemEntity(item)),
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, operation: 'createWithItems' });
    }
  }

  /**
   * Link order to escrow
   * ربط الطلب بالضمان
   */
  async linkEscrow(orderId: string, escrowId: string): Promise<void> {
    try {
      const client = this.getClient();
      const now = new Date().toISOString();

      const { error } = await client
        .from(this.tableName)
        .update({
          escrow_id: escrowId,
          updated_at: now,
        })
        .eq('id', orderId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, orderId, escrowId, operation: 'linkEscrow' });
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, orderId, operation: 'linkEscrow' });
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private toItemEntity(row: Record<string, unknown>): OrderItem {
    const dbRow = row as unknown as SupabaseOrderItem;
    
    return {
      id: dbRow.id,
      orderId: dbRow.order_id,
      productId: dbRow.product_id,
      quantity: dbRow.quantity,
      price: dbRow.price,
      createdAt: dbRow.created_at || '',
      updatedAt: dbRow.updated_at || '',
    };
  }
}

/**
 * Order Item Repository
 * مستودع عناصر الطلب
 */
export class OrderItemRepository extends BaseRepository<OrderItem> implements IOrderItemRepository {
  constructor() {
    super(TABLES.ORDER_ITEMS, getSupabaseProvider());
  }

  protected override toEntity(row: Record<string, unknown>): OrderItem {
    const dbRow = row as unknown as SupabaseOrderItem;
    
    return {
      id: dbRow.id,
      orderId: dbRow.order_id,
      productId: dbRow.product_id,
      quantity: dbRow.quantity,
      price: dbRow.price,
      createdAt: dbRow.created_at || '',
      updatedAt: dbRow.updated_at || '',
    };
  }

  protected override toRow(entity: Partial<OrderItem>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.orderId !== undefined) row.order_id = entity.orderId;
    if (entity.productId !== undefined) row.product_id = entity.productId;
    if (entity.quantity !== undefined) row.quantity = entity.quantity;
    if (entity.price !== undefined) row.price = entity.price;

    return row;
  }

  /**
   * Find items by order ID
   * البحث عن عناصر بواسطة الطلب
   */
  async findByOrder(orderId: string): Promise<OrderItem[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('order_id', orderId);

      if (error) {
        throw DatabaseError.fromError(error, { table: this.tableName, orderId });
      }

      return (data || []).map(row => this.toEntity(row));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw DatabaseError.fromError(error, { table: this.tableName, orderId });
    }
  }
}

// ============================================
// Singleton Instances
// ============================================

let orderRepositoryInstance: OrderRepository | null = null;
let orderItemRepositoryInstance: OrderItemRepository | null = null;

/**
 * Get the OrderRepository singleton instance
 * الحصول على مثيل مستودع الطلبات
 */
export function getOrderRepository(): OrderRepository {
  if (!orderRepositoryInstance) {
    orderRepositoryInstance = new OrderRepository();
  }
  return orderRepositoryInstance;
}

/**
 * Get the OrderItemRepository singleton instance
 * الحصول على مثيل مستودع عناصر الطلب
 */
export function getOrderItemRepository(): OrderItemRepository {
  if (!orderItemRepositoryInstance) {
    orderItemRepositoryInstance = new OrderItemRepository();
  }
  return orderItemRepositoryInstance;
}
