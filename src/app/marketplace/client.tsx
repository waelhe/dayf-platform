'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, MapPin, Star, Filter, Search, ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, 
  Loader2, Package, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
  vendor?: string;
}

interface CartItem extends Product {
  quantity: number;
}

const DEMO_USER_ID = 'demo-user';

const CATEGORIES = [
  { id: 'all', name: 'الكل' },
  { id: 'sweets', name: 'حلويات شامية' },
  { id: 'soap', name: 'صابون غار' },
  { id: 'spices', name: 'بهارات وتوابل' },
  { id: 'crafts', name: 'صناعات يدوية' },
  { id: 'textiles', name: 'أقمشة ومطرزات' },
];

export default function MarketplaceClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/marketplace/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('حدث خطأ أثناء تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      const data = await response.json();
      if (data.items) {
        setCartItems(data.items.map((item: any) => ({
          ...item.product,
          quantity: item.quantity,
          vendor: item.product.vendor || 'بائع محلي'
        })));
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: DEMO_USER_ID, productId: product.id, quantity: 1 }),
      });

      if (response.ok) {
        setCartItems(prev => {
          const existing = prev.find(item => item.id === product.id);
          if (existing) {
            return prev.map(item => 
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
          }
          return [...prev, { ...product, quantity: 1, vendor: product.vendor || 'بائع محلي' }];
        });
        toast.success('تمت الإضافة إلى سلة التسوق');
      }
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const updateQuantity = async (productId: string, delta: number) => {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;

    const newQuantity = Math.max(1, item.quantity + delta);
    
    setCartItems(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));

    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: DEMO_USER_ID, productId, quantity: newQuantity }),
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      await fetch(`/api/cart/${productId}`, { method: 'DELETE' });
      setCartItems(prev => prev.filter(item => item.id !== productId));
      toast.success('تمت إزالة المنتج من السلة');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = product.name.includes(searchQuery) || 
                         product.description.includes(searchQuery) || 
                         product.location.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12" dir="rtl">
      {/* Hero Section */}
      <div className="relative bg-emerald-950 text-white py-16 mb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1543083477-4f785aeafaa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
            alt="Souq Background" 
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center md:text-right">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-400/10 text-emerald-400 text-sm font-bold mb-6 border border-emerald-400/20"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>سوق ضيف المحلي</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
              >
                اكتشف <span className="text-emerald-400">كنوز</span> سوريا المحلية
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8"
              >
                من الحلويات الشامية الأصيلة إلى الصناعات اليدوية العريقة، تصلك أينما كنت لدعم الحرفيين المحليين.
              </motion.p>
            </div>
            
            {/* Cart Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl border border-white/10 flex flex-col items-center gap-6 cursor-pointer hover:bg-white/10 transition-all shadow-2xl group"
              onClick={() => setIsCartOpen(true)}
            >
              <div className="relative">
                <div className="bg-emerald-500 w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-10 h-10 text-white" />
                </div>
                {cartItemCount > 0 && (
                  <div className="absolute -top-3 -right-3 bg-rose-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-xl border-4 border-emerald-900">
                    {cartItemCount}
                  </div>
                )}
              </div>
              <div className="text-center">
                <span className="block text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2">سلة المشتريات</span>
                <span className="block text-3xl font-black">{cartTotal.toLocaleString('ar-SA')} <span className="text-sm font-normal text-gray-400">ل.س</span></span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="products-grid">
        
        {/* Featured Products Section */}
        {activeCategory === 'all' && searchQuery === '' && products.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                منتجات مميزة
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.slice(0, 3).map(product => (
                <motion.div 
                  key={`featured-${product.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-emerald-100 group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-emerald-700 shadow-sm">
                      {CATEGORIES.find(c => c.id === product.category)?.name || product.category}
                    </div>
                    <div className="absolute top-4 left-4 bg-amber-400 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      مميز
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                      <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold">{product.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      {product.location}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">السعر</span>
                        <span className="text-xl font-bold text-emerald-600">
                          {product.price.toLocaleString('ar-SA')} ل.س
                        </span>
                      </div>
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        إضافة
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar / Filters */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-emerald-600" />
                تصفية المنتجات
              </h3>
              
              {/* Search */}
              <div className="relative mb-6 group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-all shadow-sm hover:border-emerald-300"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700 mb-3">التصنيفات</h4>
                {CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-right px-4 py-2 rounded-xl text-sm transition-colors ${
                      activeCategory === category.id
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="w-full lg:w-3/4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {activeCategory === 'all' ? 'جميع المنتجات' : CATEGORIES.find(c => c.id === activeCategory)?.name}
              </h2>
              <span className="text-gray-500 text-sm">{filteredProducts.length} منتج</span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد منتجات</h3>
                <p className="text-gray-500">جرب البحث بكلمات مختلفة أو تغيير التصنيف</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-emerald-700 flex items-center gap-1 shadow-sm">
                        <MapPin className="w-3 h-3" />
                        {product.location}
                      </div>
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                        {CATEGORIES.find(c => c.id === product.category)?.name || product.category}
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{product.name}</h3>
                      </div>
                      
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="mr-1 font-bold">{product.rating}</span>
                        </div>
                        <span className="text-gray-400">({product.reviews})</span>
                        <span className="text-gray-300 mx-1">•</span>
                        <span className="text-gray-600 text-xs font-medium">{product.vendor || 'بائع محلي'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 mb-1">السعر</span>
                          <span className="font-bold text-emerald-600 text-xl">
                            {product.price.toLocaleString('ar-SA')} ل.س
                          </span>
                        </div>
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          إضافة
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Cart Slide-over */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-emerald-600" />
                  سلة المشتريات
                  <span className="bg-emerald-100 text-emerald-700 text-sm px-2 py-0.5 rounded-full mr-2">
                    {cartItemCount}
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
                              <p className="text-sm text-gray-500">{item.vendor || 'بائع محلي'}</p>
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
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-emerald-600"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)}
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
                  <Link href="/orders" onClick={() => setIsCartOpen(false)}>
                    <button className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg flex items-center justify-center gap-2">
                      إتمام الطلب
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
