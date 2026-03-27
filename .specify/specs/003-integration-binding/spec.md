# Feature Specification: Integration & Binding - ربط الحلول بالكود الفعلي

**Feature Branch**: `003-integration-binding`
**Created**: 2025-03-27
**Status**: Draft
**Input**: ربط الحلول الجذرية (Phase 1-5) بالكود الفعلي

## Problem Statement

تم إنشاء الحلول الجذرية (Route Protection, Resource Ownership, DataLoader, Validation, Unified Types) لكنها **غير مربوطة بالكود الفعلي**.

```
الحالة الحالية:
┌─────────────────────────────────────────────────────────────┐
│  الحلول الجذرية (موجودة)          الكود الفعلي (منفصل)        │
│  ─────────────────────          ────────────────────────    │
│  ✅ middleware.ts                ❌ routes تستخدم requireAuth │
│  ✅ route-protection.ts          ❌ يدوياً في كل route       │
│  ✅ resource-ownership.ts        ❌ لم يُستخدم فعلياً         │
│  ✅ dataloader/index.ts          ❌ repositories لا تستخدمه   │
│  ✅ validation/index.ts          ❌ routes بدون validation    │
│  ✅ core/types/*.ts              ❌ features تعرف أنواعها     │
└─────────────────────────────────────────────────────────────┘
```

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Middleware Actually Protects Routes (Priority: P1)

**كمطور، أريد أن Next.js middleware يحمي routes فعلياً وليس فقط موجوداً.**

**Why this priority**: بدون هذا الربط، الـ middleware عديم الفائدة.

**Independent Test**:
1. إنشاء route جديد بدون أي كود حماية
2. محاولة استدعاؤه بدون token
3. يجب أن يرجع 401 تلقائياً

**Acceptance Scenarios**:
1. **Given** route `/api/test-new` بدون أي auth code, **When** يتم استدعاؤه بدون token, **Then** يرجع 401
2. **Given** route `/api/test-new` بدون أي auth code, **When** يتم استدعاؤه مع token صالح, **Then** يعمل بنجاح
3. **Given** route في `PUBLIC_ROUTES`, **When** يتم استدعاؤه بدون token, **Then** يعمل بنجاح

---

### User Story 2 - Repositories Use Unified Types (Priority: P1)

**كمطور، أريد أن repositories تستخدم الأنواع الموحدة من `@/core/types` وليس أنواعها المحلية.**

**Why this priority**: بدون هذا، الأنواع الموحدة عديمة الفائدة وتبقى التكرارات.

**Independent Test**:
1. فتح أي repository interface file
2. التحقق من أن imports تأتي من `@/core/types`
3. عدم وجود تعريفات types محلية

**Acceptance Scenarios**:
1. **Given** `IBookingRepository`, **When** يتم فتح الملف, **Then** imports من `@/core/types`
2. **Given** أي entity type, **When** يتم استخدامه, **Then** يأتي من الأنواع الموحدة
3. **Given** نوع محلي مكرر, **When** يتم اكتشافه, **Then** يجب حذفه

---

### User Story 3 - DataLoader Actually Batches Queries (Priority: P2)

**كمطور، أريد أن BaseRepository.findById يستخدم DataLoader فعلياً ويمنع N+1.**

**Why this priority**: بدون هذا، DataLoader عديم الفائدة.

**Independent Test**:
1. استدعاء `findById` عدة مرات بنفس الـ IDs
2. التحقق من أن query واحدة فقط تُنفذ

**Acceptance Scenarios**:
1. **Given** 10 استدعاء `findById` بنفس IDs, **When** يتم التنفيذ, **Then** query واحدة فقط
2. **Given** create/update/delete operation, **When** يتم التنفيذ, **Then** cache يُمسح

---

### User Story 4 - Validation Middleware Applied (Priority: P2)

**كمطور، أريد أن API routes تستخدم validation HOF أو على الأقل default schemas.**

**Why this priority**: بدون هذا، validation عديم الفائدة.

**Independent Test**:
1. إرسال بيانات غير صالحة لأي route
2. التحقق من أن الـ response يوضح الخطأ

**Acceptance Scenarios**:
1. **Given** route بدون schema محدد, **When** يتم إرسال بيانات, **Then** default validation يُطبق
2. **Given** route مع `withValidation` HOF, **When** يتم إرسال بيانات غير صالحة, **Then** يرجع 400 مع تفاصيل

---

### User Story 5 - Resource Ownership Verified (Priority: P1)

**كمطور، أريد أن owner routes تستخدم ResourceOwnership layer للتحقق تلقائياً.**

**Why this priority**: بدون هذا، IDOR vulnerabilities تبقى موجودة.

**Independent Test**:
1. مستخدم A يحاول تعديل booking مستخدم B
2. يجب أن يرجع 403 Forbidden

**Acceptance Scenarios**:
1. **Given** owner route (bookings/:id), **When** مستخدم غير المالك يحاول التعديل, **Then** يرجع 403
2. **Given** admin يحاول التعديل, **When** يتم الطلب, **Then** يعمل بنجاح

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Middleware يعمل فعلياً على كل API routes
- **FR-002**: كل repository interfaces تستخدم `@/core/types`
- **FR-003**: DataLoader يُستخدم في `findById` فعلياً
- **FR-004**: validation middleware يُطبق على routes
- **FR-005**: Resource Ownership يُستخدم في owner routes

### Non-Functional Requirements

- **NFR-001**: لا تغيير في behavior للـ routes العاملة
- **NFR-002**: لا تأثير على الأداء
- **NFR-003**: التوافق الكامل مع الدستور المادة VI

### Key Entities

- **BoundRoute**: Route مرتبط بـ middleware protection
- **TypedRepository**: Repository يستخدم الأنواع الموحدة
- **ValidatedRoute**: Route يستخدم validation HOF

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: كل API route يمر بـ middleware (verify بالـ logs)
- **SC-002**: 0 type definitions مكررة في features/
- **SC-003**: كل findById يستخدم DataLoader (verify بالـ profiling)
- **SC-004**: كل mutation route لديه validation
- **SC-005**: كل owner route يتحقق من الملكية

## Architecture Decisions

### ADR-001: Gradual Migration Strategy
**Decision**: ربط تدريجي من الأعلى للأسفل (middleware → routes → repositories)
**Rationale**: تجنب breaking changes مع ضمان عمل كل طبقة

### ADR-002: Remove Duplicate Types
**Decision**: حذف الأنواع المكررة من features/*/types.ts والاعتماد على @/core/types
**Rationale**: Single Source of Truth

### ADR-003: Update Route Handlers
**Decision**: تحديث routes لاستخدام context من headers بدلاً من requireAuth يدوياً
**Rationale**: الاستفادة من middleware
