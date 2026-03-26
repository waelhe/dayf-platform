/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Base Entity
 * 
 * الكيان الأساسي لجميع الكيانات في النظام
 */

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable {
  deletedAt: Date | null;
  deletedBy: string | null;
}

export interface Versioned {
  version: number;
}

export interface Translatable {
  translations: Record<string, string>;
}

/**
 * إنشاء معرف فريد
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * التحقق من وجود الكيان
 */
export function exists<T extends BaseEntity>(entity: T | null | undefined): entity is T {
  return entity !== null && entity !== undefined;
}
