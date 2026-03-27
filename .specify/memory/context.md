# CONTEXT.md — مرجع السياق

> ⚠️ يُقرأ هذا الملف أولاً عند استئناف العمل

---

## آخر تحديث: 2025-03-26

---

## 1. المشروع

| البند | القيمة |
|-------|--------|
| **الاسم** | ضيف (Dayf) |
| **النوع** | منصة سياحية سورية متكاملة |
| **التقنيات** | Next.js 16, React 19, TypeScript, Supabase |
| **الحالة** | 🔴 غير قابل للتشغيل (Runtime Failure) |
| **حجم الكود** | 232 ملف TypeScript/TSX |

---

## 2. المشكلة الحالية

```
🔴 BLOCKER: ترحيل ناقص من Prisma/SQLite إلى Supabase

الوضع:
• 26 من 28 خدمة تستخدم Prisma (مُحذوف من المشروع)
• db.ts يشير لملف SQLite غير موجود
• Runtime سيفشل فوراً عند أي استعلام

السبب الجذري:
• حُذفت ملفات Prisma لكن لم تُرحّل الخدمات
• لم تُنشأ طبقة تجريد (Repository Pattern)
```

---

## 3. التقدم (Progress Tracker)

| المرحلة | الحالة | النسبة | المخرجات |
|---------|--------|--------|----------|
| الجرد الكامل (DEEP-AUDIT Phase 0) | ✅ مكتمل | 100% | لوحة القيادة، قائمة الفجوات |
| إنشاء Spec-Kit Structure | ✅ مكتمل | 100% | constitution.md, context.md |
| طبقة التجريد (Repository Pattern) | ⏳ التالي | 0% | - |
| ترحيل Auth Services | ⏳ | 0% | - |
| ترحيل Business Services | ⏳ | 0% | - |
| إصلاح الأمان (Auth + Zod) | ⏳ | 0% | - |
| Cleanup نهائي | ⏳ | 0% | - |

---

## 4. Blockers (تمنع التشغيل)

| # | المشكلة | الملفات | الأولوية |
|---|---------|---------|----------|
| 1 | Prisma غير مُهيأ | db.ts + 26 service | 🔴 P0 |
| 2 | SQLite file محذوف | .env → custom.db | 🔴 P0 |
| 3 | Routes بدون Auth | 53 من 55 routes | 🔴 P0 |

---

## 5. Critical Issues (تمنع الإنتاج)

| # | المشكلة | الخطورة |
|---|---------|---------|
| 1 | Escrow بدون transactions | 💰 مالي |
| 2 | Admin routes بدون حماية | 🔐 أمني |
| 3 | Bookings بدون Auth | 🔐 أمني |
| 4 | Cross-feature import (disputes→escrow) | 🏗️ معماري |

---

## 6. الإحصائيات

```
┌─────────────────────────────────────────────┐
│  الملفات: 232 TypeScript/TSX               │
│  الخدمات: 28 service                       │
│  API Routes: 55 endpoint                   │
│                                             │
│  Services تستخدم Prisma: 26 (93%) ❌      │
│  Services تستخدم Supabase: 2 (7%) ✅      │
│                                             │
│  Routes بدون Auth: 53 (96%) ❌            │
│  Routes بدون Zod: 51 (93%) ❌             │
│                                             │
│  Tests: 0 ❌                               │
│  any types: 29 ⚠️                         │
│  TODOs: 28 ⚠️                             │
│  console.log: 3 ⚠️                        │
│                                             │
│  الجاهزية للإنتاج: 15%                     │
└─────────────────────────────────────────────┘
```

---

## 7. Supabase Configuration

| البند | القيمة |
|-------|--------|
| **Project URL** | `jqzpxxsrdcdgimiimbqx.supabase.co` |
| **Pooler Host** | `aws-1-eu-central-1.pooler.supabase.com:6543` |
| **Region** | `eu-central-1` |
| **Tables Created** | 24 جدول |
| **RLS Policies** | غير معروف (يحتاج فحص) |

---

## 8. الملفات المرجعية

| الملف | الغرض | الموقع |
|-------|-------|--------|
| DEEP-AUDIT-PROMPT.md | منهجية التدقيق | `upload/` |
| AGENT-PROMPT.md | منهجية التنفيذ Spec-Kit | `upload/` |
| tagred.md | خطة الترحيل المعمارية | `upload/` |
| constitution.md | مبادئ المشروع | `.specify/memory/` |
| context.md | هذا الملف | `.specify/memory/` |

---

## 9. الخطوة التالية

```
📋 المرحلة: طبقة التجريد (Repository Pattern)

المهام:
1. [ ] إنشاء src/core/database/interface.ts
       - IRepository<T> interface
       - IDatabaseProvider interface
       - Query types

2. [ ] إنشاء src/infrastructure/database/supabase-provider.ts
       - SupabaseProvider implementation
       - Connection pooling

3. [ ] إنشاء src/infrastructure/repositories/base.repository.ts
       - BaseRepository<T> abstract class
       - Common CRUD operations

4. [ ] إنشاء repositories لـ Auth feature
       - UserRepository
       - SessionRepository
       - OTPRepository
```

---

## 10. الأوامر المتاحة (Spec-Kit)

| الأمر | الوظيفة |
|-------|---------|
| `/speckit.constitution` | إنشاء/تحديث مبادئ المشروع |
| `/speckit.specify` | إنشاء مواصفة ميزة جديدة |
| `/speckit.plan` | إنشاء خطة تقنية |
| `/speckit.tasks` | إنشاء قائمة مهام |
| `/speckit.implement` | تنفيذ المهام |

---

## 11. ملاحظات مهمة

1. **Architecture Guardian مُفعّل دائماً** — لا تُعطّله إلا بأمر صريح
2. **الترتيب مهم** — لا تتجاوز مرحلة قبل إكمال السابقة
3. **تحديث هذا الملف** — بعد كل مرحلة مكتملة
4. **اللغة الأساسية** — العربية، RTL
5. **لا تكتب tests** — حالياً الأولوية للترحيل

---

## 12. سجل التحديثات

| التاريخ | التحديث |
|---------|---------|
| 2025-03-26 | إنشاء الملف - بداية المرحلة 0 |
