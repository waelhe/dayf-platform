'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ServiceSchema, Service } from '../types';
import { Loader2, Plus, X, Image as ImageIcon } from 'lucide-react';

interface ServiceFormProps {
  initialData?: Partial<Service>;
  onSubmit: (data: Service) => Promise<void>;
  isLoading?: boolean;
  language?: string;
}

export default function ServiceForm({ initialData, onSubmit, isLoading, language = 'ar' }: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ServiceSchema) as never,
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      location: initialData?.location || '',
      price: initialData?.price || 0,
      mainCategoryId: initialData?.mainCategoryId || 'tourism',
      subCategoryId: initialData?.subCategoryId || '',
      type: initialData?.type || '',
      images: initialData?.images || [],
      amenities: initialData?.amenities || [],
      features: initialData?.features || [],
      rating: initialData?.rating || 0,
      reviews: initialData?.reviews || 0,
      views: initialData?.views || 0,
      maxGuests: initialData?.maxGuests || 4,
      bedrooms: initialData?.bedrooms || 1,
      beds: initialData?.beds || 1,
      baths: initialData?.baths || 1,
      hostId: initialData?.hostId || '',
      isSuperhost: initialData?.isSuperhost || false,
      isPopular: initialData?.isPopular || false,
    },
  });

  const images = watch('images') || [];
  const amenities = watch('amenities') || [];
  const features = watch('features') || [];

  const handleAddImage = () => {
    const url = prompt(language === 'ar' ? 'أدخل رابط الصورة:' : 'Enter image URL:');
    if (url) {
      setValue('images', [...images, url]);
    }
  };

  const removeImage = (index: number) => {
    setValue('images', images.filter((_, i) => i !== index));
  };

  const handleAddAmenity = () => {
    const amenity = prompt(language === 'ar' ? 'أدخل ميزة (مثلاً: واي فاي):' : 'Enter amenity (e.g., WiFi):');
    if (amenity) {
      setValue('amenities', [...amenities, amenity]);
    }
  };

  const removeAmenity = (index: number) => {
    setValue('amenities', amenities.filter((_, i) => i !== index));
  };

  const handleAddFeature = () => {
    const feature = prompt(language === 'ar' ? 'أدخل خاصية (مثلاً: إطلالة بحرية):' : 'Enter feature (e.g., Sea View):');
    if (feature) {
      setValue('features', [...features, feature]);
    }
  };

  const removeFeature = (index: number) => {
    setValue('features', features.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {language === 'ar' ? 'عنوان الخدمة' : 'Service Title'}
            </label>
            <input
              {...register('title')}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder={language === 'ar' ? 'مثلاً: شقة فاخرة في دمشق' : 'e.g., Luxury Apartment in Damascus'}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {language === 'ar' ? 'الوصف' : 'Description'}
            </label>
            <textarea
              {...register('description')}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px]"
              placeholder={language === 'ar' ? 'وصف تفصيلي للخدمة...' : 'Detailed description...'}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {language === 'ar' ? 'الموقع' : 'Location'}
            </label>
            <input
              {...register('location')}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder={language === 'ar' ? 'مثلاً: دمشق، المالكي' : 'e.g., Damascus, Malki'}
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {language === 'ar' ? 'السعر (USD)' : 'Price (USD)'}
              </label>
              <input
                type="number"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {language === 'ar' ? 'التصنيف الرئيسي' : 'Main Category'}
              </label>
              <select
                {...register('mainCategoryId')}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="tourism">{language === 'ar' ? 'سياحة' : 'Tourism'}</option>
                <option value="medical">{language === 'ar' ? 'طب' : 'Medical'}</option>
                <option value="realestate">{language === 'ar' ? 'عقارات' : 'Real Estate'}</option>
                <option value="education">{language === 'ar' ? 'تعليم' : 'Education'}</option>
                <option value="business">{language === 'ar' ? 'أعمال' : 'Business'}</option>
                <option value="experiences">{language === 'ar' ? 'تجارب' : 'Experiences'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              {language === 'ar' ? 'نوع الخدمة / وصف قصير' : 'Service Type / Short Description'}
            </label>
            <input
              {...register('type')}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder={language === 'ar' ? 'مثلاً: شقة كاملة، غرفة خاصة' : 'e.g., Entire Apartment, Private Room'}
            />
          </div>
        </div>

        {/* Images */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold text-gray-700">
              {language === 'ar' ? 'الصور' : 'Images'}
            </label>
            <button
              type="button"
              onClick={handleAddImage}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'إضافة صورة' : 'Add Image'}
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 border-2 border-dashed border-gray-200 rounded-2xl p-4 min-h-[150px]">
            {images.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-8 h-8 mb-2" />
                <p className="text-xs">{language === 'ar' ? 'لا توجد صور مضافة' : 'No images added'}</p>
              </div>
            ) : (
              images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Amenities & Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-gray-700">
              {language === 'ar' ? 'المرافق' : 'Amenities'}
            </label>
            <button
              type="button"
              onClick={handleAddAmenity}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {amenities.map((item, idx) => (
              <span key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {item}
                <button type="button" onClick={() => removeAmenity(idx)}><X className="w-3 h-3 text-gray-400" /></button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-bold text-gray-700">
              {language === 'ar' ? 'المميزات' : 'Features'}
            </label>
            <button
              type="button"
              onClick={handleAddFeature}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {features.map((item, idx) => (
              <span key={idx} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {item}
                <button type="button" onClick={() => removeFeature(idx)}><X className="w-3 h-3 text-emerald-400" /></button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Room Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            {language === 'ar' ? 'الحد الأقصى للضيوف' : 'Max Guests'}
          </label>
          <input
            type="number"
            {...register('maxGuests', { valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            {language === 'ar' ? 'غرف النوم' : 'Bedrooms'}
          </label>
          <input
            type="number"
            {...register('bedrooms', { valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            {language === 'ar' ? 'الأسرة' : 'Beds'}
          </label>
          <input
            type="number"
            {...register('beds', { valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            {language === 'ar' ? 'الحمامات' : 'Baths'}
          </label>
          <input
            type="number"
            {...register('baths', { valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
      >
        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
        {language === 'ar' ? 'حفظ الخدمة' : 'Save Service'}
      </button>
    </form>
  );
}
