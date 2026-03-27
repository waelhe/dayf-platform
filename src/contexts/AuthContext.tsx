/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Auth Context
 * 
 * سياق المصادقة للعميل - متصل بـ API الحقيقي
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { UserRole, type Permission, PERMISSIONS, hasPermission, hasRole } from '@/core/domain';

// نوع المستخدم
export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  avatar: string | null;
  role: UserRole;
  language: string;
  membershipLevel: string;
  loyaltyPoints: number;
  emailVerified: Date | null;
  phoneVerified: Date | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, otp: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // تحميل المستخدم عند بدء التطبيق
  const loadUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  }, []);

  // تحميل المستخدم عند بدء التطبيق
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // تسجيل الدخول بالبريد
  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'email',
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }

      setState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'فشل تسجيل الدخول',
      }));
      throw error;
    }
  }, []);

  // تسجيل الدخول بالهاتف
  const loginWithPhone = useCallback(async (phone: string, otp: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'phone',
          phone,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل تسجيل الدخول');
      }

      setState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'فشل تسجيل الدخول',
      }));
      throw error;
    }
  }, []);

  // إنشاء حساب
  const register = useCallback(async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'email',
          ...data,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'فشل إنشاء الحساب');
      }

      setState({
        user: responseData.user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'فشل إنشاء الحساب',
      }));
      throw error;
    }
  }, []);

  // تسجيل الخروج
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }

    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  // تحديث الملف
  const updateProfile = useCallback((data: Partial<User>) => {
    setState(prev => {
      if (!prev.user) return prev;
      const updated = { ...prev.user, ...data };
      return { ...prev, user: updated };
    });
  }, []);

  // تحديث بيانات المستخدم
  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  // التحقق من الصلاحية
  const checkPermission = useCallback(
    (permission: Permission): boolean => {
      if (!state.user) return false;
      return hasPermission(state.user as any, permission);
    },
    [state.user]
  );

  // التحقق من الدور
  const checkRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!state.user) return false;
      return hasRole(state.user as any, role);
    },
    [state.user]
  );

  // مسح الخطأ
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      login,
      loginWithPhone,
      register,
      logout,
      updateProfile,
      hasPermission: checkPermission,
      hasRole: checkRole,
      clearError,
      refreshUser,
    }),
    [
      state,
      login,
      loginWithPhone,
      register,
      logout,
      updateProfile,
      checkPermission,
      checkRole,
      clearError,
      refreshUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { PERMISSIONS, UserRole };
export type { Permission };
