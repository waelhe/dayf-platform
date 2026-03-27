/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Product Details Page Client Component
 *
 * صفحة تفاصيل المنتج في السوق - متصلة بالبيانات الحقيقية
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star,
  MapPin,
  ShoppingCart,
  Heart,
  Share2,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Store,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Header, Footer, BottomNav } from '@/components/dayf';

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
  vendorId: string;
  vendor?: {
    id: string;
    displayName: string;
  };
}

interface ProductDetailsClientProps {
  productId: string;
}

// Demo user ID - in production this would come from auth session
const DEMO_USER_ID = 'demo-user';

export default function ProductDetailsClient({ productId }: ProductDetailsClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketplace/products/${productId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('المنتج غير موجود');
        } else {
          throw new Error('Failed to fetch product');
        }
        return;
      }

      const data = await response.json();
      setProduct(data.product);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('فشل في تحميل المنتج');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const addToCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          productId: product?.id,
          quantity
        }),
      });

      if (response.ok) {
        toast.success('تمت الإضافة إلى السلة');
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('حدث خطأ أثناء الإضافة للسلة');
    }
  };

  const buyNow = async () => {
    await addToCart();
    router.push('/cart');
  };

  // Get product images - single image from DB for now
  const productImages = product ? [product.image].filter(Boolean) : [];

  const nextImage = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex(prev => (prev + 1) % productImages.length);
    }
  };

  const prevImage = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex(prev => (prev - 1 + productImages.length) % productImages.length);
    }
  };

  // Loading State
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

  // Error / Not Found State
  if (error || !product) {
    return (
      <main className="min-h-screen flex flex-col bg-[#F8F5F0]">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Package className="w-20 h-20 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'المنتج غير موجود'}
          </h2>
          <p className="text-gray-500 mb-6">عذراً، لم نتمكن من العثور على هذا المنتج</p>
          <Button onClick={() => router.push('/marketplace')} className="bg-emerald-600 hover:bg-emerald-700">
            العودة للسوق
          </Button>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F8F5F0]" dir="rtl">
      <Header />

      <div className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-emerald-600">الرئيسية</Link>
              <ChevronLeft className="w-4 h-4" />
              <Link href="/marketplace" className="hover:text-emerald-600">السوق</Link>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-gray-900 font-medium truncate">{product.name}</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative bg-white rounded-3xl overflow-hidden aspect-square">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={productImages[currentImageIndex] || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>

                {product.rating >= 4.5 && (
                  <span className="absolute top-4 right-4 bg-amber-400 text-white px-3 py-1 rounded-full text-sm font-bold">
                    مميز
                  </span>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Rating */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(product.rating)
                            ? 'text-amber-400 fill-current'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                    <span className="font-bold mr-1">{product.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({product.reviews} تقييم)</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{product.location}</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="bg-emerald-50 rounded-2xl p-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-emerald-600">
                    ${product.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-gray-600 font-medium">الكمية:</span>
                <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-2 py-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={addToCart}
                  variant="outline"
                  className="flex-1 h-14 text-lg border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                >
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  أضف للسلة
                </Button>
                <Button
                  onClick={buyNow}
                  className="flex-1 h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  اشترِ الآن
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    isWishlisted
                      ? 'bg-red-50 text-red-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  <span>{isWishlisted ? 'في المفضلة' : 'أضف للمفضلة'}</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all">
                  <Share2 className="w-5 h-5" />
                  <span>مشاركة</span>
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                  <Truck className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                  <span className="text-xs text-gray-600">توصيل سريع</span>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                  <span className="text-xs text-gray-600">ضمان الجودة</span>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-gray-100">
                  <RotateCcw className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                  <span className="text-xs text-gray-600">إرجاع سهل</span>
                </div>
              </div>

              {/* Vendor */}
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Store className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">
                    {product.vendor?.displayName || 'بائع محلي'}
                  </div>
                  <div className="text-sm text-gray-500">بائع موثوق</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-12">
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-4 px-4 font-medium transition-all ${
                  activeTab === 'description'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                الوصف
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-4 px-4 font-medium transition-all ${
                  activeTab === 'reviews'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                التقييمات ({product.reviews})
              </button>
            </div>

            <div className="py-6">
              {activeTab === 'description' ? (
                <div className="prose prose-lg max-w-none text-gray-600">
                  <p>{product.description}</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد تقييمات بعد</h3>
                  <p className="text-gray-500">
                    كن أول من يقيّم هذا المنتج!
                  </p>
                  <p className="text-xs text-gray-400 mt-4">
                    نظام التقييمات قيد التطوير
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <BottomNav />
    </main>
  );
}
