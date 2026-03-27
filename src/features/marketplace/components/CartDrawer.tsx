'use client';

import React from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

export default function CartDrawer() {
  const { 
    cartItems, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    cartTotal, 
    cartCount 
  } = useCart();

  const handleCheckout = async () => {
    // TODO: Implement checkout with auth
    // For now, just clear the cart and show success
    try {
      clearCart();
      setIsCartOpen(false);
      toast.success('تم إرسال طلبك بنجاح');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('حدث خطأ أثناء إتمام الطلب');
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={() => setIsCartOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-emerald-600" />
                سلة المشتريات
                <span className="bg-emerald-100 text-emerald-800 text-sm py-1 px-3 rounded-full font-bold">
                  {cartCount}
                </span>
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                  <ShoppingBag className="w-16 h-16 text-gray-300" />
                  <p className="text-lg">سلة المشتريات فارغة</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    تصفح المنتجات
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-20 h-20 object-cover rounded-xl"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                            <p className="text-sm text-gray-500">{item.vendor?.displayName || 'بائع محلي'}</p>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-emerald-600">
                            {(item.price * item.quantity).toLocaleString('ar-SA')} ل.س
                          </span>
                          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-emerald-600"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-emerald-600"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center mb-4 text-lg">
                  <span className="text-gray-600">المجموع الإجمالي</span>
                  <span className="font-bold text-2xl text-gray-900">
                    {cartTotal.toLocaleString('ar-SA')} ل.س
                  </span>
                </div>
                <button 
                  onClick={handleCheckout} 
                  className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  إتمام الطلب
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
