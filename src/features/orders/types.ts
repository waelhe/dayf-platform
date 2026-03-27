import { z } from 'zod';

// Order status enum matching Prisma
export const OrderStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

// Order item schema
export const OrderItemSchema = z.object({
  id: z.string().optional(),
  orderId: z.string().optional(),
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

// Order schema
export const OrderSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  items: z.array(OrderItemSchema),
  total: z.number().positive(),
  status: OrderStatusSchema.default('PENDING'),
});

export type Order = z.infer<typeof OrderSchema>;

// Order with product details
export interface OrderWithProducts extends Order {
  id: string;
  createdAt: Date;
  items: (OrderItem & {
    product: {
      id: string;
      name: string;
      image: string;
      price: number;
    };
  })[];
}

// Create order input
export interface CreateOrderInput {
  userId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

// Order status labels (Arabic)
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'قيد الانتظار',
  PROCESSING: 'قيد المعالجة',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

// Order status colors
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};
