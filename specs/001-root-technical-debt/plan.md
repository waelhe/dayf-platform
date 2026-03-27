# Implementation Plan: Root Technical Debt Resolution

**Branch**: `001-root-technical-debt` | **Date**: 2025-03-27 | **Spec**: [spec.md](./spec.md)

## Summary

ربط الحلول الجذرية الموجودة بالكود الفعلي. البنية التحتية موجودة (middleware, resource-ownership, core/types, validation) لكن غير متصلة بالكامل بالـ routes والـ repositories.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16, Zod, Supabase
**Storage**: Supabase (PostgreSQL)
**Testing**: Manual API testing + TypeScript compilation
**Target Platform**: Next.js Server (API Routes)
**Project Type**: web-service

## Current State Analysis

### Phase 1: Route Protection System ✅ (متصل جزئياً)
- **middleware.ts**: موجود ويعمل
- **route-protection.ts**: جميع routes معرفة
- **lib/auth/middleware.ts**: `getAuthUser()` تثق بالـ headers
- **الحالة**: متصل لكن owner routes لا تستخدم `verifyOwnership()`

### Phase 2: Resource Ownership Layer ❌ (غير متصل)
- **resource-ownership.ts**: `verifyOwnership()` موجودة
- **الحالة**: owner routes لا تستخدم الدالة

### Phase 3: DataLoader Pattern ❌ (غير متصل)
- **infrastructure/dataloader/**: موجود
- **الحالة**: repositories لا تستخدم DataLoader

### Phase 4: Validation Middleware ❌ (جزئي)
- **lib/validation/schemas.ts**: schemas موجودة
- **core/validation/**: موجود
- **الحالة**: بعض routes تستخدم Zod، بعضها لا

### Phase 5: TypeScript Types Unification ❌ (جزئي)
- **core/types/**: موجود وشامل
- **الحالة**: بعض repositories تستخدم types محلية

## Implementation Plan

### Task 1: Connect Resource Ownership to Owner Routes
**Files to modify:**
- `src/app/api/reviews/[id]/route.ts` - إضافة verifyOwnership
- `src/app/api/bookings/[id]/route.ts` - إضافة verifyOwnership  
- `src/app/api/escrow/[id]/route.ts` - إضافة verifyOwnership
- `src/app/api/disputes/[id]/route.ts` - إضافة verifyOwnership
- `src/app/api/services/[id]/route.ts` - إضافة verifyOwnership

### Task 2: Update Repositories to Use Unified Types
**Files to check:**
- جميع files في `src/features/*/infrastructure/repositories/*.ts`
- التأكد من استخدام `@/core/types` بدلاً من types محلية

### Task 3: Add Zod Validation to Remaining Routes
**Files to modify:**
- `src/app/api/community/topics/[id]/route.ts`
- `src/app/api/community/replies/route.ts`
- أي route بدون Zod validation

### Task 4: Verify and Test
- Run TypeScript compilation
- Run ESLint
- Test API endpoints manually

## Project Structure

```text
src/
├── app/api/
│   ├── reviews/[id]/route.ts     # Task 1
│   ├── bookings/[id]/route.ts    # Task 1
│   ├── escrow/[id]/route.ts      # Task 1
│   ├── disputes/[id]/route.ts    # Task 1
│   └── services/[id]/route.ts    # Task 1
├── core/
│   ├── auth/
│   │   ├── route-protection.ts   # موجود
│   │   └── resource-ownership.ts # موجود
│   └── types/
│       └── index.ts              # موجود
└── features/*/infrastructure/repositories/  # Task 2
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Resource Ownership | حماية من IDOR | كل route يتطلب نفس الكود |
