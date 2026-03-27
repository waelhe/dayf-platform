# Tasks: Integration & Binding

**Branch**: `003-integration-binding` | **Date**: 2025-03-27 | **Status**: ⏳ جاري

---

## Phase 1: Bind Middleware to Routes (Priority: P1)

### Task 1.1: Verify Middleware Matcher
- [ ] التحقق من أن `middleware.ts` matcher يشمل كل `/api/*` routes
- [ ] اختبار أن route جديد بدون كود يُحمى تلقائياً
- [ ] التحقق من أن PUBLIC_ROUTES تعمل بدون token

### Task 1.2: Update Route Handlers to Use Context
- [ ] تحديث routes لقراءة `x-user-id` من headers
- [ ] إزالة `requireAuth()` calls من routes (middleware يحمي)
- [ ] اختبار أن كل route يعمل كما كان

### Task 1.3: Test Auth Flow
- [ ] إنشاء test route بدون أي auth code
- [ ] اختبار unauthorized → 401
- [ ] اختبار authorized → يعمل
- [ ] اختبار public route → يعمل بدون token

**Files**: `src/middleware.ts`, `src/app/api/*/route.ts`

---

## Phase 2: Bind Unified Types to Repositories (Priority: P1)

### Task 2.1: Update Repository Interfaces
- [ ] تحديث `IBookingRepository` لاستخدام `Booking` من `@/core/types`
- [ ] تحديث `IReviewRepository` لاستخدام `Review` من `@/core/types`
- [ ] تحديث `ICompanyRepository` لاستخدام `Company` من `@/core/types`
- [ ] تحديث `IOrderRepository` لاستخدام `Order` من `@/core/types`
- [ ] تحديث `IEscrowRepository` لاستخدام `Escrow` من `@/core/types`
- [ ] تحديث `IUserRepository` لاستخدام `Profile` من `@/core/types`

### Task 2.2: Remove Duplicate Types
- [ ] حذف الأنواع المكررة من `features/bookings/types.ts`
- [ ] حذف الأنواع المكررة من `features/reviews/types.ts`
- [ ] حذف الأنواع المكررة من `features/companies/types.ts`
- [ ] حذف الأنواع المكررة من `features/orders/types.ts`
- [ ] حذف الأنواع المكررة من `features/escrow/types.ts`

### Task 2.3: Verify Type Imports
- [ ] التحقق من أن كل import يأتي من `@/core/types`
- [ ] التحقق من أن TypeScript compile يعمل
- [ ] اختبار أن الأنواع متطابقة

**Files**: كل `features/*/domain/interfaces/*.ts`, `features/*/types.ts`

---

## Phase 3: Bind DataLoader to Repositories (Priority: P2)

### Task 3.1: Update BaseRepository
- [ ] التحقق من أن `findById` يستخدم `_loader`
- [ ] اختبار أن عدة استدعاءات بنفس ID تعمل query واحدة
- [ ] التحقق من أن cache يُمسح بعد mutations

### Task 3.2: Test N+1 Prevention
- [ ] إنشاء test يستدعي `findById` 10 مرات بنفس IDs
- [ ] التحقق من عدد queries في logs
- [ ] التأكد من أن batch size محترم

**Files**: `src/infrastructure/repositories/base.repository.ts`

---

## Phase 4: Bind Validation to Routes (Priority: P2)

### Task 4.1: Identify Routes Without Validation
- [ ] فحص كل API routes
- [ ] تحديد routes بدون validation
- [ ] ترتيب حسب الخطورة (mutate > read)

### Task 4.2: Apply Validation HOF
- [ ] تحديث mutation routes (POST, PUT, PATCH, DELETE) لاستخدام `withValidation`
- [ ] تطبيق DefaultSchemas على routes بدون schema محدد
- [ ] اختبار أن validation يعمل

### Task 4.3: Test Validation
- [ ] إرسال بيانات غير صالحة لكل route
- [ ] التحقق من أن response يوضح الخطأ
- [ ] التحقق من أن valid data يعمل

**Files**: كل `src/app/api/*/route.ts`

---

## Phase 5: Bind Resource Ownership (Priority: P1)

### Task 5.1: Identify Owner Routes
- [ ] فحص كل routes التي تتعامل مع موارد محددة
- [ ] تحديد routes التي تحتاج ownership check
- [ ] ترتيب حسب الخطورة (escrow, bookings, reviews)

### Task 5.2: Apply Resource Ownership
- [ ] تحديث owner routes لاستخدام `requireOwner()`
- [ ] إزالة ownership checks اليدوية
- [ ] اختبار أن IDOR محمي

### Task 5.3: Test IDOR Prevention
- [ ] مستخدم A يحاول الوصول لمورد مستخدم B
- [ ] التحقق من أن response = 403 Forbidden
- [ ] Admin يحاول الوصول → يعمل

**Files**: `src/app/api/bookings/[id]/route.ts`, `src/app/api/reviews/[id]/route.ts`, `src/app/api/escrow/[id]/route.ts`

---

## Verification Checklist

### Security Verification
- [ ] Middleware يحمي كل routes تلقائياً
- [ ] لا يمكن الوصول لمورد مستخدم آخر (IDOR)
- [ ] كل input يتم التحقق منه (validation)

### Type Safety Verification
- [ ] كل types من `@/core/types`
- [ ] 0 type definitions مكررة
- [ ] TypeScript compile بدون أخطاء

### Performance Verification
- [ ] DataLoader يمنع N+1
- [ ] لا regression في الأداء

### Constitution Compliance
- [ ] المادة I: Escrow + Soft Delete محميين
- [ ] المادة VI: Auth + Validation تلقائيان

---

## 📊 Progress Tracking

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Bind Middleware | ⏳ | 0% |
| Phase 2: Bind Types | ⏳ | 0% |
| Phase 3: Bind DataLoader | ⏳ | 0% |
| Phase 4: Bind Validation | ⏳ | 0% |
| Phase 5: Bind Ownership | ⏳ | 0% |

---

**🚀 Ready to Implement**
