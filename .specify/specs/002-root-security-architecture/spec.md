# Feature Specification: Root Security Architecture

**Feature Branch**: `002-root-security-architecture`
**Created**: 2025-03-27
**Status**: Draft
**Input**: الفحص المنظومي الجذري الشامل - Task ID 15

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Protected Routes by Default (Priority: P1)

كمطور، أريد أن كل route جديد يكون محمياً تلقائياً بدون الحاجة لإضافة requireAuth يدوياً.

**Why this priority**: الحل الترقيعي (إضافة requireAuth لكل route) لا يمنع نسيان route جديد. الحل الجذري يحمي تلقائياً.

**Independent Test**: إنشاء route جديد بدون requireAuth يجب أن يرجع 401 تلقائياً.

**Acceptance Scenarios**:
1. **Given** route جديد بدون requireAuth, **When** يتم استدعاؤه بدون token, **Then** يرجع 401 تلقائياً
2. **Given** route عام (مُعرّف في publicRoutes), **When** يتم استدعاؤه بدون token, **Then** يعمل بشكل طبيعي

---

### User Story 2 - Resource Ownership Automatically Verified (Priority: P1)

كمطور، أريد أن ملكية الموارد تُتحقق تلقائياً بدون كتابة كود IDOR protection في كل route.

**Why this priority**: IDOR vulnerabilities تحدث عندما ينسى المطور التحقق من الملكية. الحل الجذري يتحقق تلقائياً.

**Independent Test**: محاولة الوصول لمورد يملكه مستخدم آخر يجب أن ترجع 403 تلقائياً.

**Acceptance Scenarios**:
1. **Given** مستخدم يحاول تعديل booking مستخدم آخر, **When** يتم الطلب, **Then** يرجع 403 Forbidden
2. **Given** admin يحاول تعديل booking مستخدم آخر, **When** يتم الطلب, **Then** يعمل بشكل طبيعي

---

### User Story 3 - N+1 Queries Prevented by Architecture (Priority: P2)

كمطور، أريد أن N+1 queries مستحيلة على مستوى البنية، وليس مجرد تجنبها في كل query.

**Why this priority**: حل N+1 لكل query بشكل منفرد ترقيعي. الحل الجذري يمنعها على مستوى البنية.

**Independent Test**: كتابة query بدون DataLoader يجب أن تُرفض أو تُحذّر تلقائياً.

**Acceptance Scenarios**:
1. **Given** service يحتاج بيانات من جدول آخر, **When** يتم تحميل عدة سجلات, **Then** يُستخدم DataLoader تلقائياً
2. **Given** query بدون batching, **When** يتم تنفيذها, **Then** يُسجل تحذير في التطوير

---

### User Story 4 - Validation Applied Automatically (Priority: P2)

كمطور، أريد أن كل API route لديه validation تلقائياً بدون تحديد schema لكل route يدوياً.

**Why this priority**: نسيان validation في route جديد مشكلة شائعة. الحل الجذري يطبق validation تلقائياً.

**Independent Test**: إرسال بيانات غير صالحة يجب أن يرفض تلقائياً مع رسالة واضحة.

**Acceptance Scenarios**:
1. **Given** route بدون schema محدد, **When** يتم إرسال بيانات, **Then** يُطبق default validation
2. **Given** route مع schema محدد, **When** يتم إرسال بيانات غير صالحة, **Then** يرجع 400 مع تفاصيل الخطأ

---

### User Story 5 - Type Safety Enforced (Priority: P3)

كمطور، أريد أن TypeScript types تكون موحدة ومتسقة عبر كل المشروع.

**Why this priority**: Type mismatches تسبب أخطاء في runtime. الحل الجذري يضمن التناسق.

**Independent Test**: Date vs string mismatches يجب أن تُكتشف في compile time.

**Acceptance Scenarios**:
1. **Given** entity تحتوي على Date, **When** يتم تحويلها إلى JSON, **Then** تُحول بشكل صحيح
2. **Given** API response, **When** يتم استخدامه في frontend, **Then** الـ types متطابقة

---

### Edge Cases

- ماذا يحدث عند إضافة route جديد في منتصف الليل؟ يجب أن يكون محمياً تلقائياً
- ماذا يحدث عند إضافة entity جديد؟ يجب أن يُسجل في ResourceOwnership تلقائياً
- ماذا يحدث عند نسيان schema؟ يجب أن يُطبق default validation

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: نظام Auth Middleware موحد يحمي كل routes تلقائياً
- **FR-002**: قائمة publicRoutes واحدة كمصدر للحقيقة
- **FR-003**: ResourceOwnership layer للتحقق التلقائي من الملكية
- **FR-004**: DataLoader Pattern لمنع N+1 queries
- **FR-005**: Validation Middleware مع fallback schema
- **FR-006**: TypeScript types موحدة بين frontend و backend

### Non-Functional Requirements

- **NFR-001**: لا تأثير على أداء routes الموجودة
- **NFR-002**: سهولة الصيانة - route جديد يعمل بدون إضافة كود حماية
- **NFR-003**: التوافق مع Constitution المادة VI (الأمان بالافتراض)

### Key Entities

- **RouteConfig**: تعريف route مع level الحماية (public, authenticated, owner, admin)
- **ResourceOwnership**: تعريف ملكية الموارد (entity, ownerField, adminOverride)
- **ValidationSchema**: Zod schema مع fallback للـ default validation
- **DataLoaderRegistry**: تسجيل DataLoaders لكل entity

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 routes بدون حماية (تلقائياً أو يدوياً)
- **SC-002**: 0 IDOR vulnerabilities في security scan
- **SC-003**: 0 N+1 queries في performance profiling
- **SC-004**: 100% TypeScript coverage بدون any types
- **SC-005**: كل route جديد يعمل بأمان بدون كود إضافي

## Architecture Decisions

### ADR-001: Next.js Middleware for Auth
**Decision**: استخدام Next.js middleware.ts للتحقق من Auth قبل الوصول لأي route
**Rationale**: Next.js middleware يعمل قبل كل route، لا يمكن نسيانه
**Alternatives Rejected**: requireAuth في كل route (ترقيعي)

### ADR-002: Resource Ownership Decorator Pattern
**Decision**: استخدام decorator/annotation pattern لتعريف ملكية الموارد
**Rationale**: التعريف في مكان واحد، التطبيق تلقائي
**Alternatives Rejected**: التحقق اليدوي في كل route (ترقيعي)

### ADR-003: DataLoader at Repository Level
**Decision**: تطبيق DataLoader في BaseRepository
**Rationale**: كل repository يرث batching تلقائياً
**Alternatives Rejected**: DataLoader في كل service (ترقيعي)

### ADR-004: Zod Middleware with Fallback
**Decision**: middleware يطبق validation مع fallback للـ basic types
**Rationale**: لا يمكن نسيان validation، دائماً هناك حماية أساسية
**Alternatives Rejected**: schema لكل route (ترقيعي)
