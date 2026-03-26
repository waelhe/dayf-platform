'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Loader2, ShoppingBag, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, OrderWithProducts, OrderStatus } from '@/features/orders/types';

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  PENDING: <Clock className="w-5 h-5" />,
  PROCESSING: <Package className="w-5 h-5" />,
  SHIPPED: <Truck className="w-5 h-5" />,
  DELIVERED: <CheckCircle className="w-5 h-5" />,
  CANCELLED: <XCircle className="w-5 h-5" />,
};

const DEMO_USER_ID = 'demo-user';

export default function OrdersClient() {
  const [orders, setOrders] = useState<OrderWithProducts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?userId=${DEMO_USER_ID}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('ar-SY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8" />
          طلباتي
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">لا توجد طلبات</h2>
            <p className="text-gray-600 mb-6">لم تقم بأي طلبات بعد</p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              <span>تصفح السوق</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500">رقم الطلب</p>
                    <p className="font-mono font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">تاريخ الطلب</p>
                    <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                    {STATUS_ICONS[order.status]}
                    <span className="font-medium">{ORDER_STATUS_LABELS[order.status]}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <img
                          src={item.product.image || '/placeholder.jpg'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-xl"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>الكمية: {item.quantity}</span>
                            <span>السعر: ${item.price}</span>
                          </div>
                        </div>
                        <div className="font-bold text-gray-900">
                          ${(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-gray-600">المجموع الكلي</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      ${order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
