'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, Plus, Minus, Loader2, Package, ArrowLeft, Check, MapPin, CreditCard, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Header, Footer, BottomNav } from '@/components/dayf';

const DEMO_USER_ID = 'demo-user';

interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
    location: string;
  };
  quantity: number;
}

interface Cart {
  id: string;
  items: CartItem[];
  total: number;
  itemCount: number;
}

export default function CartClient() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: 'مستخدم تجريبي',
    phone: '+963-912-345-678',
    address: 'دمشق - المدينة القديمة',
    city: 'دمشق',
    notes: '',
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch(`/api/cart?userId=${DEMO_USER_ID}`);
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('تم حذف العنصر');
        fetchCart();
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const checkout = async () => {
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setCheckingOut(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          items: cart?.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })) || [],
          shippingInfo,
        }),
      });

      if (response.ok) {
        toast.success('تم إنشاء الطلب بنجاح!');
        // Clear cart
        await fetch(`/api/cart?userId=${DEMO_USER_ID}`, { method: 'DELETE' });
        setShowCheckout(false);
        fetchCart();
        // Redirect to orders page
        window.location.href = '/orders';
      } else {
        throw new Error('Failed');
      }
    } catch (error) {
      toast.error('حدث خطأ في إنشاء الطلب');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col bg-[#F8F5F0]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F8F5F0]" dir="rtl">
      <Header />

      <div className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            سلة التسوق
          </h1>

          {!cart || cart.items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
              <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">السلة فارغة</h2>
              <p className="text-gray-600 mb-6">أضف بعض المنتجات للبدء</p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
              >
                <span>تصفح السوق</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4"
                  >
                    <img
                      src={item.product.image || '/placeholder.jpg'}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-xl"
                    />

                    <div className="flex-1">
                      <Link href={`/marketplace/${item.product.id}`}>
                        <h3 className="font-bold text-gray-900 hover:text-emerald-600 transition-colors">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500">{item.product.location}</p>
                      <p className="font-bold text-emerald-600 mt-2">${item.product.price.toLocaleString()}</p>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-2 hover:bg-gray-200 rounded-r-xl disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-200 rounded-l-xl"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <p className="font-bold text-gray-900">
                        ${(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-4">
                  <h2 className="font-bold text-gray-900 mb-4">ملخص الطلب</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>المجموع الفرعي</span>
                      <span>${cart.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>الشحن</span>
                      <span className="text-emerald-600">مجاني</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>المجموع</span>
                        <span className="text-xl">${cart.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>إتمام الطلب</span>
                  </button>

                  <Link
                    href="/marketplace"
                    className="block text-center text-emerald-600 hover:underline mt-4"
                  >
                    متابعة التسوق
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">إتمام الطلب</h2>
                <p className="text-gray-500 mt-1">أدخل معلومات الشحن</p>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    value={shippingInfo.fullName}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المدينة *
                  </label>
                  <select
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="دمشق">دمشق</option>
                    <option value="حلب">حلب</option>
                    <option value="اللاذقية">اللاذقية</option>
                    <option value="حمص">حمص</option>
                    <option value="طرطوس">طرطوس</option>
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العنوان التفصيلي *
                  </label>
                  <textarea
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ملاحظات (اختياري)
                  </label>
                  <textarea
                    value={shippingInfo.notes}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    placeholder="أي تعليمات خاصة للتوصيل..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* Delivery Info */}
                <div className="bg-emerald-50 rounded-xl p-4 flex items-start gap-3">
                  <Truck className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-800">التوصيل مجاني</p>
                    <p className="text-sm text-emerald-600">سيتم التوصيل خلال 2-5 أيام عمل</p>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">عدد المنتجات</span>
                    <span>{cart?.itemCount} منتج</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>المجموع الكلي</span>
                    <span className="text-emerald-600">${cart?.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={checkout}
                  disabled={checkingOut}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {checkingOut ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      تأكيد الطلب
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <BottomNav />
    </main>
  );
}
