# Feature Specification: Root Technical Debt Resolution

**Feature Branch**: `001-root-technical-debt`
**Created**: 2025-03-27
**Status**: In Progress
**Input**: ربط الحلول الجذرية الموجودة بالكود الفعلي - تنفيذ فعلي وليس نظري

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resource Ownership Protection (Priority: P1)

كمطور، أريد أن أتأكد أن كل owner routes تستخدم `verifyOwnership()` تلقائياً لمنع ثغرات IDOR.

**Why this priority**: حماية أمنية حرجة - كل owner route بدون تحقق ملكية = ثغرة IDOR

**Independent Test**: 
- يمكن اختباره بالكامل عبر محاولة الوصول لمورد مستخدم آخر عبر API
- النتيجة المتوقعة: 403 Forbidden

**Acceptance Scenarios**:

1. **Given** مستخدم مصادق يحاول تعديل مراجعة مستخدم آخر, **When** يرسل PATCH /api/reviews/{id}, **Then** يتلقى 403 Forbidden
2. **Given** مدير يحاول تعديل مراجعة مستخدم آخر, **When** يرسل PATCH /api/reviews/{id}, **Then** ينجح التعديل
3. **Given** مستخدم يحاول الوصول لضمان ليس طرفاً فيه, **When** يرسل GET /api/escrow/{id}, **Then** يتلقى 403 Forbidden

---

### User Story 2 - Unified Types (Priority: P2)

كمطور، أريد أن تستخدم كل repositories الـ types الموحدة من `@/core/types` لمنع التكرار وعدم التوافق.

**Why this priority**: يسهل الصيانة ويمنع الأخطاء الناتجة عن تضارب الأنواع

**Independent Test**:
- البحث عن imports من `@prisma/client` أو types محلية
- النتيجة المتوقعة: 0 imports من @prisma/client في جميع repositories

**Acceptance Scenarios**:

1. **Given** repository يستخدم type محلي, **When** نقوم بالتحديث, **Then** يستخدم type من `@/core/types`
2. **Given** enum يُستخدم في service, **When** نقوم بالتحديث, **Then** يُستورد من `@/core/types/enums`

---

### User Story 3 - Validation Coverage (Priority: P3)

كمطور، أريد أن تكون كل API routes محمية بـ Zod validation schemas.

**Why this priority**: منع البيانات غير الصالحة من الدخول للنظام

**Independent Test**:
- إرسال بيانات غير صالحة لأي API endpoint
- النتيجة المتوقعة: 400 Bad Request مع رسالة خطأ واضحة

**Acceptance Scenarios**:

1. **Given** API route بدون Zod validation, **When** نضيف schema, **Then** يرفض البيانات غير الصالحة
2. **Given** بيانات صالحة, **When** نرسلها للـ API, **Then** تُقبل وتُعالج

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: كل owner routes MUST تستخدم `verifyOwnership()` أو `requireOwner()`
- **FR-002**: كل repositories MUST تستخدم types من `@/core/types`
- **FR-003**: كل API routes MUST تستخدم Zod validation للـ input
- **FR-004**: الـ middleware MUST يعمل بشكل صحيح ويضيف user headers
- **FR-005**: لا MUST تكون هناك imports من `@prisma/client` في أي source file

### Key Entities

- **Owner Routes**: Routes التي تتطلب ملكية المورد (bookings/[id], reviews/[id], escrow/[id], etc.)
- **Resource Types**: bookings, reviews, escrows, services, companies, disputes
- **Unified Types**: Profile, Booking, Review, Escrow, Service, Company, Dispute

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 ثغرات IDOR - كل owner routes محمية
- **SC-002**: 0 imports من `@prisma/client` في source files
- **SC-003**: 100% من API routes تستخدم Zod validation
- **SC-004**: TypeScript compilation بدون أخطاء
- **SC-005**: ESLint بدون أخطاء (warnings مقبولة)
