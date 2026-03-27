# مهام التنفيذ: تكامل NodeBB

**المدخلات**: spec.md + plan.md
**الأولوية**: Phase 0 (حرج) → Phase 1 (بنية تحتية) → Phase 2 (SSO) → Phase 3 (تثبيت) → Phase 4 (اختبار)

---

## الترميز
- [P] = يعمل بالتوازي مع غيره
- 🔴 = يمنع ما بعده (blocking)
- 🟠 = عالي الأولوية
- 🟡 = متوسط الأولوية

---

## Phase 0: إصلاح الثغرات الحرجة (Blocking 🔴)

> لا يبدأ أي شيء قبل اكتمال هذه المرحلة

### T0.1 🔴 توحيد Session Token

**الملف**: `src/features/auth/infrastructure/session-service.ts`

**الوصف**: توحيد اسم cookie في كل مكان

```typescript
// إضافة const
export const TOKEN_COOKIE_NAME = 'auth_token';

// البحث عن كل استخدامات 'session_token'
// واستبدالها بـ TOKEN_COOKIE_NAME
```

**التسليم**: 
- [ ] إضافة TOKEN_COOKIE_NAME const
- [ ] تحديث جميع الملفات التي تستخدم 'session_token'
- [ ] اختبار login/logout

---

### T0.2 🔴 إنشاء Event Bus

**الملفات**: 
- `src/core/events/index.ts`
- `src/core/events/types.ts`

**الوصف**: إنشاء نظام أحداث بسيط للتواصل بين الوحدات

```typescript
// src/core/events/index.ts
class SimpleEventBus {
  private handlers: Map<string, Set<Function>> = new Map();
  
  async publish(event: string, payload: any): Promise<void>
  subscribe(event: string, handler: Function): () => void
}

export const eventBus = new SimpleEventBus();
```

**التسليم**:
- [ ] إنشاء `src/core/events/index.ts`
- [ ] إنشاء `src/core/events/types.ts` مع EVENTS constants
- [ ] تصدير من `src/core/index.ts`

---

### T0.3 🔴 إصلاح Transaction Rollback

**الملف**: `src/infrastructure/database/supabase-provider.ts`

**الوصف**: جعل rollback حقيقي وليس مجرد logging

**التسليم**:
- [ ] تحديث `createCompensatingAction` للـ insert
- [ ] تحديث `createCompensatingAction` للـ update
- [ ] تحديث `createCompensatingAction` للـ delete
- [ ] اختبار rollback scenario

---

### T0.4 🟠 إنشاء جداول مفقودة

**الوصف**: إنشاء الجداول المفقودة في Supabase

```sql
-- tours table
CREATE TABLE IF NOT EXISTS tours (...);

-- order_items table
CREATE TABLE IF NOT EXISTS order_items (...);

-- user_verifications table
CREATE TABLE IF NOT EXISTS user_verifications (...);
```

**التسليم**:
- [ ] إنشاء migration file
- [ ] تنفيذ على Supabase
- [ ] التحقق من الجداول

---

### T0.5 🟠 Escrow إلزامي في الحجوزات

**الملف**: `src/features/bookings/infrastructure/bookings-service.ts`

**الوصف**: إنشاء Escrow تلقائياً مع كل حجز

**التسليم**:
- [ ] تحديث `createBooking` لإنشاء Escrow
- [ ] نشر حدث `BOOKING_CREATED`
- [ ] اختبار إنشاء حجز جديد

---

**Checkpoint**: 
- [ ] `bun run lint` = 0 errors
- [ ] Event Bus يعمل
- [ ] Rollback يعمل
- [ ] الحجوزات تنشئ Escrow

---

## Phase 1: البنية التحتية

### T1.1 🟠 [P] تثبيت MongoDB

**الوصف**: إعداد MongoDB instance

**التسليم**:
- [ ] تثبيت MongoDB (local/Docker/Atlas)
- [ ] إنشاء database `nodebb`
- [ ] إضافة `DATABASE_URL_MONGO` للـ .env

---

### T1.2 🟠 [P] تثبيت Redis

**الوصف**: إعداد Redis instance

**التسليم**:
- [ ] تثبيت Redis (local/Docker/Cloud)
- [ ] اختبار connection
- [ ] إضافة `REDIS_URL` للـ .env

---

### T1.3 🟡 Environment Variables

**الوصف**: إعداد جميع المتغيرات البيئية المطلوبة

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# New for NodeBB
DATABASE_URL_MONGO=mongodb://...
REDIS_URL=redis://...
JWT_SECRET=shared_secret_here
NODEBB_URL=http://forum.localhost:4567
```

**التسليم**:
- [ ] إضافة MongoDB URL
- [ ] إضافة Redis URL
- [ ] إضافة JWT_SECRET
- [ ] إضافة NODEBB_URL

---

### T1.4 🟡 Reverse Proxy Configuration

**الملف**: `Caddyfile`

**الوصف**: إضافة NodeBB للـ reverse proxy

**التسليم**:
- [ ] تحديث Caddyfile
- [ ] إعادة تحميل Caddy

---

**Checkpoint**:
- [ ] MongoDB يعمل (`mongosh --eval "db.stats()"`)
- [ ] Redis يعمل (`redis-cli ping`)
- [ ] Environment variables مضبوطة

---

## Phase 2: SSO Integration Layer

### T2.1 🟠 SSO Endpoint

**الملف**: `src/app/api/auth/sso/route.ts`

**الوصف**: إنشاء endpoint لـ SSO

**التسليم**:
- [ ] إنشاء GET /api/auth/sso
- [ ] التحقق من auth
- [ ] إنشاء JWT token
- [ ] إرجاع user data + token

---

### T2.2 🟠 JWT Auth Library

**الملف**: `src/lib/nodebb-auth.ts`

**الوصف**: مكتبة إنشاء والتحقق من JWT tokens

**التسليم**:
- [ ] `generateNodeBBToken(user)` function
- [ ] `verifyNodeBBToken(token)` function
- [ ] `getNodeBBUrl()` function

---

### T2.3 🟡 Webhook Endpoint

**الملف**: `src/app/api/webhooks/user/route.ts`

**الوصف**: استقبال webhooks من NodeBB

**التسليم**:
- [ ] إنشاء POST /api/webhooks/user
- [ ] معالجة `user.updated`
- [ ] معالجة `user.deleted`
- [ ] نشر أحداث في Event Bus

---

### T2.4 🟡 NodeBB SSO Plugin

**المجلد**: `nodebb-plugin-sso-daif/`

**الوصف**: كتابة plugin لـ NodeBB

**التسليم**:
- [ ] إنشاء `library.js`
- [ ] `parseToken()` function
- [ ] `findOrCreateUser()` function
- [ ] `login()` endpoint
- [ ] `logout()` endpoint

---

**Checkpoint**:
- [ ] GET /api/auth/sso يعود بـ JWT
- [ ] Webhook endpoint يستقبل
- [ ] Plugin مكتوب

---

## Phase 3: NodeBB Installation

### T3.1 🟠 Clone & Setup NodeBB

**الوصف**: تثبيت NodeBB الأساسي

**التسليم**:
- [ ] Clone NodeBB repository
- [ ] `npm install`
- [ ] `./nodebb setup` مع MongoDB + Redis
- [ ] `./nodebb start`

---

### T3.2 🟡 Arabic Language Pack

**الوصف**: تثبيت الدعم العربي

**التسليم**:
- [ ] تثبيت nodebb-plugin-ar
- [ ] تفعيل RTL
- [ ] اختبار العربية

---

### T3.3 🟡 Install SSO Plugin

**الوصف**: تثبيت plugin المخصص

**التسليم**:
- [ ] نسخ plugin لمجلد node_modules
- [ ] `./nodebb activate nodebb-plugin-sso-daif`
- [ ] `./nodebb restart`

---

### T3.4 🟡 Configure SSO

**الملف**: `nodebb/config.json`

**الوصف**: تكوين SSO في NodeBB

**التسليم**:
- [ ] إضافة sso:daif config
- [ ] تحديث URL
- [ ] إعادة تشغيل NodeBB

---

**Checkpoint**:
- [ ] NodeBB يعمل على forum.localhost
- [ ] العربية تعمل
- [ ] SSO plugin مفعل

---

## Phase 4: Integration Testing

### T4.1 🟠 Test SSO Login Flow

**التسليم**:
- [ ] تسجيل دخول في ضيف
- [ ] الانتقال لـ NodeBB
- [ ] التحقق من تسجيل الدخول التلقائي
- [ ] تسجيل الخروج

---

### T4.2 🟠 Test Event Bus

**التسليم**:
- [ ] نشر حدث booking.created
- [ ] التحقق من استقباله
- [ ] التحقق من آثار الحدث

---

### T4.3 🟡 Test Webhooks

**التسليم**:
- [ ] تحديث profile في NodeBB
- [ ] التحقق من webhook لضيف
- [ ] تحديث profile في ضيف
- [ ] التحقق من webhook لـ NodeBB

---

### T4.4 🟡 Test Rollback

**التسليم**:
- [ ] محاكاة فشل في معاملة
- [ ] التحقق من rollback
- [ ] التحقق من عدم وجود بيانات جزئية

---

**Checkpoint Final**:
- [ ] SSO يعمل في كلا الاتجاهين
- [ ] Events تتزامن
- [ ] Webhooks تعمل
- [ ] Rollback يعمل
- [ ] `bun run lint` = 0 errors
- [ ] لا توجد أخطاء في dev.log

---

## الفرص المتوازية

```
بعد Phase 0:
  Developer A → T1.1 (MongoDB)
  Developer B → T1.2 (Redis)
  Developer C → T2.1, T2.2 (SSO Layer)

بعد Phase 1 + 2:
  Developer A → T3.1, T3.3 (NodeBB Setup)
  Developer B → T4.1, T4.2 (Testing)
```

---

## نقاط التوقف للتحقق

1. **بعد Phase 0**: كل الثغرات مُصلحة؟
2. **بعد Phase 1**: MongoDB + Redis يعملان؟
3. **بعد Phase 2**: SSO endpoint يعود بـ JWT؟
4. **بعد Phase 3**: NodeBB يعمل ومتصل؟
5. **بعد Phase 4**: كل شيء متكامل؟
