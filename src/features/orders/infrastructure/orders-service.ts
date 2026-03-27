/**
 * Orders Service
 * 
 * خدمة الطلبات - باستخدام Repository Pattern
 */

import { getOrderRepository } from './repositories';
import { OrderStatus } from '@/core/types/enums';
import type { Order, OrderItem, OrderWithProducts, CreateOrderInput } from '../types';

export const ordersService = {
  // Create order from cart
  async create(input: CreateOrderInput): Promise<OrderWithProducts> {
    const orderRepo = getOrderRepository();
    
    // Calculate total from items (assuming prices are provided or fetched elsewhere)
    let total = 0;
    const items: { productId: string; quantity: number; price: number }[] = [];

    for (const item of input.items) {
      // Price would typically be fetched from product service
      // For now, assume price is included in input
      const price = (item as any).price || 0;
      total += price * item.quantity;
      items.push({
        productId: item.productId,
        quantity: item.quantity,
        price,
      });
    }

    // Create order with items
    const order = await orderRepo.createWithItems(
      {
        userId: input.userId,
        total,
        status: OrderStatus.PENDING,
        escrowId: null,
      },
      items
    );

    return this.toOrderWithProducts(order);
  },

  // Get orders by user
  async getByUser(userId: string): Promise<OrderWithProducts[]> {
    const orderRepo = getOrderRepository();
    const orders = await orderRepo.findByUserWithItems(userId);
    return orders.map(o => this.toOrderWithProducts(o));
  },

  // Get order by ID
  async getById(id: string): Promise<OrderWithProducts | null> {
    const orderRepo = getOrderRepository();
    const order = await orderRepo.findWithItems(id);
    
    if (!order) return null;
    
    return this.toOrderWithProducts(order);
  },

  // Update order status
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const orderRepo = getOrderRepository();
    await orderRepo.updateStatus(id, status);
    
    const order = await orderRepo.findById(id);
    if (!order) {
      throw new Error('Order not found after update');
    }
    
    return order;
  },

  // Cancel order
  async cancel(id: string): Promise<Order> {
    return this.updateStatus(id, OrderStatus.CANCELLED);
  },

  // Get all orders (admin)
  async getAll(): Promise<OrderWithProducts[]> {
    const orderRepo = getOrderRepository();
    
    // Get all orders (would need pagination in production)
    const { data, error } = await orderRepo['getClient']()
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const orders = await Promise.all(
      (data || []).map(async (orderData: any) => {
        const order = await orderRepo.findWithItems(orderData.id);
        return order ? this.toOrderWithProducts(order) : null;
      })
    );

    return orders.filter((o): o is OrderWithProducts => o !== null);
  },

  // Helper to transform to OrderWithProducts
  toOrderWithProducts(order: { 
    id: string; 
    userId: string; 
    total: number; 
    status: string; 
    createdAt?: string | Date;
    items?: { productId: string; quantity: number; price: number }[] 
  }): OrderWithProducts {
    return {
      id: order.id,
      userId: order.userId,
      total: order.total,
      status: order.status as OrderStatus,
      createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
      items: (order.items || []).map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.productId,
          name: '',  // Would need to fetch from product service
          image: '',
          price: item.price,
        },
      })),
    };
  },
};

export type { Order, OrderItem, OrderStatus, CreateOrderInput, OrderWithProducts };
