/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Error Components
 * 
 * Reusable error states for the application
 */

'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, RefreshCcw, Home, Wifi, Server, Search } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  icon?: 'alert' | 'wifi' | 'server' | 'search';
  showHomeButton?: boolean;
}

export function ErrorDisplay({ 
  title, 
  message, 
  onRetry, 
  retryText,
  icon = 'alert',
  showHomeButton = false,
}: ErrorDisplayProps) {
  const { language } = useLanguage();

  const icons = {
    alert: AlertCircle,
    wifi: Wifi,
    server: Server,
    search: Search,
  };

  const IconComponent = icons[icon];

  const defaultTitle = language === 'ar' ? 'حدث خطأ' : 'Something went wrong';
  const defaultMessage = language === 'ar' 
    ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' 
    : 'An unexpected error occurred. Please try again.';
  const defaultRetryText = language === 'ar' ? 'إعادة المحاولة' : 'Try Again';

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <IconComponent className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title || defaultTitle}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md">
        {message || defaultMessage}
      </p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 bg-[#0D4D3A] text-white rounded-lg font-medium hover:bg-[#1A5F4A] transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            {retryText || defaultRetryText}
          </button>
        )}
        {showHomeButton && (
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </button>
        )}
      </div>
    </div>
  );
}

interface NetworkErrorProps {
  onRetry?: () => void;
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  const { language } = useLanguage();

  return (
    <ErrorDisplay
      icon="wifi"
      title={language === 'ar' ? 'لا يوجد اتصال' : 'No Connection'}
      message={language === 'ar' 
        ? 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.' 
        : 'Check your internet connection and try again.'}
      onRetry={onRetry}
    />
  );
}

interface ServerErrorProps {
  onRetry?: () => void;
}

export function ServerError({ onRetry }: ServerErrorProps) {
  const { language } = useLanguage();

  return (
    <ErrorDisplay
      icon="server"
      title={language === 'ar' ? 'خطأ في الخادم' : 'Server Error'}
      message={language === 'ar' 
        ? 'الخادم غير متاح حالياً. يرجى المحاولة لاحقاً.' 
        : 'The server is temporarily unavailable. Please try again later.'}
      onRetry={onRetry}
    />
  );
}

interface NotFoundErrorProps {
  itemName?: string;
}

export function NotFoundError({ itemName }: NotFoundErrorProps) {
  const { language } = useLanguage();
  const item = itemName || (language === 'ar' ? 'العنصر' : 'item');

  return (
    <ErrorDisplay
      icon="search"
      title={language === 'ar' ? 'غير موجود' : 'Not Found'}
      message={language === 'ar' 
        ? `عذراً، لم نتمكن من العثور على ${item}.` 
        : `Sorry, we couldn't find the ${item}.`}
      showHomeButton
    />
  );
}

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-red-700 text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 transition-colors"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
