/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * User Entity
 * 
 * كيان المستخدم الأساسي
 */

import type { BaseEntity } from './base.entity';

/**
 * أدوار المستخدمين
 */
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  HOST = 'HOST',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/**
 * صلاحيات المستخدمين
 */
export const PERMISSIONS = {
  // تصفح
  VIEW_LISTINGS: 'view:listings',
  VIEW_SERVICES: 'view:services',
  VIEW_PRODUCTS: 'view:products',
  VIEW_TOPICS: 'view:topics',
  
  // إنشاء
  CREATE_BOOKING: 'create:booking',
  CREATE_REVIEW: 'create:review',
  CREATE_TOPIC: 'create:topic',
  CREATE_REPLY: 'create:reply',
  
  // إدارة
  MANAGE_LISTINGS: 'manage:listings',
  MANAGE_PRODUCTS: 'manage:products',
  MANAGE_BOOKINGS: 'manage:bookings',
  MANAGE_USERS: 'manage:users',
  MANAGE_CONTENT: 'manage:content',
  
  // صلاحيات خاصة
  ALL: '*',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * صلاحيات كل دور
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_TOPICS,
  ],
  [UserRole.USER]: [
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_TOPICS,
    PERMISSIONS.CREATE_BOOKING,
    PERMISSIONS.CREATE_REVIEW,
    PERMISSIONS.CREATE_TOPIC,
    PERMISSIONS.CREATE_REPLY,
  ],
  [UserRole.HOST]: [
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_TOPICS,
    PERMISSIONS.CREATE_BOOKING,
    PERMISSIONS.CREATE_REVIEW,
    PERMISSIONS.CREATE_TOPIC,
    PERMISSIONS.CREATE_REPLY,
    PERMISSIONS.MANAGE_LISTINGS,
    PERMISSIONS.MANAGE_BOOKINGS,
  ],
  [UserRole.PROVIDER]: [
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_TOPICS,
    PERMISSIONS.CREATE_BOOKING,
    PERMISSIONS.CREATE_REVIEW,
    PERMISSIONS.CREATE_TOPIC,
    PERMISSIONS.CREATE_REPLY,
    PERMISSIONS.MANAGE_LISTINGS,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_BOOKINGS,
  ],
  [UserRole.ADMIN]: [
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_TOPICS,
    PERMISSIONS.CREATE_BOOKING,
    PERMISSIONS.CREATE_REVIEW,
    PERMISSIONS.CREATE_TOPIC,
    PERMISSIONS.CREATE_REPLY,
    PERMISSIONS.MANAGE_LISTINGS,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_CONTENT,
  ],
  [UserRole.SUPER_ADMIN]: [PERMISSIONS.ALL],
};

/**
 * كيان المستخدم
 */
export interface UserEntity extends BaseEntity {
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  language: 'ar' | 'en';
  reputationPoints: number;
  lastLogin: Date | null;
}

/**
 * التحقق من الصلاحية
 */
export function hasPermission(user: UserEntity, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[user.role];
  return permissions.includes(PERMISSIONS.ALL) || permissions.includes(permission);
}

/**
 * التحقق من الدور
 */
export function hasRole(user: UserEntity, roles: UserRole | UserRole[]): boolean {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role);
}

/**
 * التحقق من أنه مضيف
 */
export function isHost(user: UserEntity): boolean {
  return [UserRole.HOST, UserRole.PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);
}

/**
 * التحقق من أنه مزود
 */
export function isProvider(user: UserEntity): boolean {
  return [UserRole.PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);
}

/**
 * التحقق من أنه مدير
 */
export function isAdmin(user: UserEntity): boolean {
  return [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);
}
