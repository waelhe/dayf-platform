# Feature Specification: Backend Critical Fixes

**Feature Branch**: `002-backend-critical-fixes`
**Created**: 2025-03-27
**Status**: ✅ **مكتمل** (Updated: 2025-03-27)
**Input**: فحص جذري فعلي للباك إند - اكتشاف ثغرات تكسر الدستور

---

## Executive Summary

بناءً على الفحص الجذري الفعلي (ليس نظري) للباك إند، تم اكتشاف **4 ثغرات حرجة** تكسر مواد الدستور و**3 ثغرات متوسطة** و**3 جداول مفقودة** في Supabase.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Escrow إلزامي لكل حجز (Priority: P0-CRITICAL)

**كمستخدم**، أريد أن يُنشأ حساب ضمان (Escrow) تلقائياً مع كل حجز لحماية مالي.

**Why this priority**: كسر المادة I من الدستور - "Escrow مطلوب لكل حجز يتجاوز صفراً"

**Constitutional Violation**: المادة I - Escrow & Disputes

**Current Bug**:
```typescript
// src/features/bookings/infrastructure/bookings-service.ts:35
escrowId: null,  // ⚠️ يُنشأ حجز بدون ضمان!
```

**Independent Test**:
- إنشاء حجز جديد عبر API
- التحقق من وجود escrowId مرتبط
- النتيجة المتوقعة: escrowId NOT null

**Acceptance Scenarios**:

1. **Given** مستخدم ينشئ حجز جديد, **When** الحجز يُنشأ, **Then** يُنشأ Escrow تلقائياً ويرتبط بالحجز
2. **Given** حجز موجود بدون Escrow, **When** نحاول تأكيده, **Then** يفشل التأكيد مع خطأ "Escrow required"
3. **Given** Escrow تم إنشاؤه, **When** نتحقق من حالته, **Then** يكون PENDING

---

### User Story 2 - Event Bus للتواصل بين الوحدات (Priority: P0-CRITICAL)

**كمطور**، أريد نظام أحداث يفصل بين الوحدات بدلاً من الاستدعاء المباشر.

**Why this priority**: كسر المادة V من الدستور - "لا استدعاء مباشر بين modules"

**Constitutional Violation**: المادة V - الاستقلالية بين الوحدات

**Current Bug**: لا يوجد Event Bus نهائياً في المشروع

**Independent Test**:
- البحث عن EventBus أو eventBus في الكود
- النتيجة المتوقعة: وحدة Event Bus موجودة

**Acceptance Scenarios**:

1. **Given** Event Bus موجود, **When** booking.completed يُنشر, **Then** المستمعون يتلقونه
2. **Given** حجز يكتمل, **When** completeBooking() يُستدعى, **Then** يُنشر حدث booking.completed
3. **Given** Escrow يُطلق, **When** releaseEscrow() يُستدعى, **Then** يُنشر حدث escrow.released

---

### User Story 3 - Transaction Rollback حقيقي (Priority: P0-CRITICAL)

**كمستخدم مالي**، أريد أن تتراجع العمليات المالية بشكل ذري إذا فشلت أي خطوة.

**Why this priority**: حماية البيانات المالية من الفساد

**Current Bug**:
```typescript
// src/infrastructure/database/supabase-provider.ts:349
console.log(`Compensating insert on ${op.table}`);  // فقط logging!
```

**Independent Test**:
- محاكاة فشل في منتصف معاملة مالية
- التحقق من تراجع جميع العمليات السابقة
- النتيجة المتوقعة: لا توجد بيانات جزئية

**Acceptance Scenarios**:

1. **Given** معاملة مالية متعددة الخطوات, **When** خطوة في المنتصف تفشل, **Then** جميع الخطوات السابقة تتراجع
2. **Given** Escrow يُنشأ ثم فشل التمويل, **When** نتحقق, **Then** Escrow يُحذف

---

### User Story 4 - جداول Supabase المفقودة (Priority: P1-HIGH)

**كمطور**، أريد أن تكون جميع الجداول المطلوبة موجودة في Supabase.

**Why this priority**: سيؤدي إلى 500 errors عند استخدام هذه الميزات

**Current Bug**: 3 جداول مفقودة:
- `tours` - للجولات السياحية
- `order_items` - عناصر الطلبات
- `user_verifications` - توثيق المستخدمين

**Independent Test**:
```bash
curl "$SUPABASE_URL/rest/v1/tours?select=id&limit=1"
# Expected: [] or data
# Actual: {"message":"Could not find the table 'public.tours'"}
```

**Acceptance Scenarios**:

1. **Given** جدول tours مفقود, **When** ننشئه, **Then** API /api/tours يعمل
2. **Given** جدول order_items مفقود, **When** ننشئه, **Then** Orders API يعمل كاملاً

---

### User Story 5 - نشر أحداث اكتمال الحجز (Priority: P1-HIGH)

**كمستخدم**، أريد أن أحصل على إشعار وطريقة لمراجعة الخدمة بعد اكتمال الحجز.

**Why this priority**: سلسلة الأحداث (Review → Loyalty → Gamification) لا تبدأ

**Current Bug**:
```typescript
export async function completeBooking(bookingId: string): Promise<Booking> {
  return updateBookingStatus(bookingId, BookingStatus.COMPLETED);
  // ❌ لا يوجد: eventBus.publish('booking.completed', ...)
}
```

**Acceptance Scenarios**:

1. **Given** حجز يكتمل, **When** completeBooking() يُستدعى, **Then** يُنشر حدث booking.completed
2. **Given** حدث booking.completed, **When** ReviewService يستمع, **Then** يُرسل إشعار للمراجعة

---

### User Story 6 - Rate Limiting في Middleware (Priority: P2-MEDIUM)

**كمسؤول أمان**، أريد حماية الـ endpoints من الـ abuse.

**Why this priority**: RateLimiter موجود لكن غير مستخدم

**Current Bug**: `src/lib/rate-limit/index.ts` موجود لكن غير مستخدم في `src/middleware.ts`

**Acceptance Scenarios**:

1. **Given** Rate limiter مُطبق, **When** مستخدم يرسل 100 طلب/دقيقة, **Then** يُحظر مؤقتاً

---

### User Story 7 - بيانات Service في الحجوزات (Priority: P2-MEDIUM)

**كمستخدم**، أريد رؤية تفاصيل الخدمة في قائمة حجوزاتي.

**Why this priority**: تجربة مستخدم سيئة - بيانات فارغة

**Current Bug**:
```typescript
service: {
  id: booking.serviceId,
  title: '',  // ⚠️ فارغ
  price: 0,   // ⚠️ سعر صفر!
},
```

**Acceptance Scenarios**:

1. **Given** حجز مع خدمة, **When** أستعلم عن حجوزاتي, **Then** أرى تفاصيل الخدمة كاملة

---

## Requirements *(mandatory)*

### Functional Requirements

| ID | Requirement | Priority | Constitutional Article |
|----|-------------|----------|------------------------|
| FR-001 | كل حجز جديد MUST يُنشئ Escrow تلقائياً | P0 | المادة I |
| FR-002 | النظام MUST يستخدم Event Bus للتواصل بين الوحدات | P0 | المادة V |
| FR-003 | Transaction Rollback MUST يعمل بشكل حقيقي | P0 | المادة I |
| FR-004 | جداول Supabase المفقودة MUST تُنشأ | P1 | - |
| FR-005 | completeBooking() MUST ينشر حدث booking.completed | P1 | المادة V |
| FR-006 | Rate Limiting MUST يُطبق في middleware | P2 | المادة VI |
| FR-007 | بيانات Service MUST تُجلب في الحجوزات | P2 | - |

### Key Entities

- **Event Bus**: وحدة مركزية لنشر واستقبال الأحداث
- **Escrow Integration**: ربط تلقائي بين الحجوزات والضمانات
- **Transaction Context**: سياق للعمليات الذرية مع rollback حقيقي

### Events to Implement

```typescript
// الأحداث المطلوبة للدستور
'booking.created'     → يُطلق: Escrow creation
'booking.completed'   → يُطلق: Review request, Loyalty points
'escrow.funded'       → يُؤكد: Ready for service
'escrow.released'     → يُؤكد: Verified review eligibility
'dispute.resolved'    → يُغذي: Company reputation score
```

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

| ID | Criterion | Target | Verification |
|----|-----------|--------|--------------|
| SC-001 | حجوزات بدون Escrow | 0 | DB query |
| SC-002 | Event Bus موجود | ✅ | File exists |
| SC-003 | Transaction Rollback يعمل | ✅ | Integration test |
| SC-004 | جداول مفقودة | 0 | Supabase query |
| SC-005 | أحداث منشورة عند الاكتمال | ✅ | Event log |
| SC-006 | Rate limiting مطبق | ✅ | Middleware check |
| SC-007 | TypeScript errors | 0 | `bun run lint` |

---

## Constitutional Compliance

| المادة | المتطلب | الحالة الحالية | المطلوب |
|--------|---------|---------------|---------|
| **I** | Escrow مطلوب | 🔴 غير مُمتثل | ✅ إصلاح FR-001 |
| **II** | AI Fallback | ⚪ غير قابل | - |
| **III** | البيانات السياحية | 🟡 جزئي | ✅ إنشاء tours table |
| **IV** | المراجعات | 🟡 جزئي | ✅ نشر booking.completed |
| **V** | الأحداث | 🔴 غير مُمتثل | ✅ بناء Event Bus |
| **VI** | الأمان | 🟢 مُمتثل | ✅ تطبيق Rate Limit |

---

## Out of Scope

- AI features (المادة II)
- Chat/Messaging system
- Check-in QR system
- Gamification system

---

## Technical Context

**Verified By**: فحص فعلي بالـ curl وقراءة الكود
**Date**: 2025-03-27
**Supabase URL**: jqzpxxsrdcdgimiimbqx.supabase.co
**Tables Verified**: profiles ✅, services ✅, products ✅, bookings ✅, escrows ✅
**Tables Missing**: tours ❌, order_items ❌, user_verifications ❌

---

## ✅ ملخص الحالة المكتملة (Updated: 2025-03-27)

### ما تم إصلاحه فعلياً:

| الثغرة | الحالة | الدليل |
|--------|--------|--------|
| **FR-001: Escrow تلقائي** | ✅ مكتمل | `bookings-service.ts:77-86` - ينشئ Escrow مع كل حجز |
| **FR-002: Event Bus** | ✅ مكتمل | `src/core/events/` - SimpleEventBus يعمل |
| **FR-003: Transaction Rollback** | ✅ مكتمل | `supabase-provider.ts` - Compensating Actions |
| **FR-004: الجداول المفقودة** | ✅ Schema جاهز | `supabase/schema-complete.sql` |
| **FR-005: نشر الأحداث** | ✅ مكتمل | `bookings-service.ts:274` - booking.completed |
| **FR-006: Rate Limiting** | ✅ مكتمل | `middleware.ts` - Auth/OTP/API limiters |
| **FR-007: بيانات Service** | ✅ مكتمل | `bookings-service.ts:119-138` |

### الامتثال للدستور النهائي:

| المادة | المتطلب | الحالة النهائية |
|--------|---------|----------------|
| **I** | Escrow مطلوب | ✅ مُمتثل |
| **II** | AI Fallback | ⚪ غير قابل |
| **III** | البيانات السياحية | ✅ Schema جاهز |
| **IV** | المراجعات | ✅ مُمتثل |
| **V** | الأحداث | ✅ مُمتثل |
| **VI** | الأمان | ✅ مُمتثل |

### نتائج التحقق:

- ✅ `bun run lint`: 0 errors, 2 warnings
- ✅ Dev server: يعمل بنجاح
- ✅ API responses: 200 OK
- ✅ TypeScript: بدون أخطاء
