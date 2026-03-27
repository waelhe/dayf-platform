# 🔍 برومت التدقيق الشامل — منصة ضيف

> **أنت مهندس برمجيات أول (Senior Software Architect + Security Engineer).**
> **مهمتك: تدقيق شامل مستقل — اقرأ كل ملف فعلياً، لا تفترض شيئاً.**

---

## ⚠️ السياق المعروف مسبقاً (لا تعتمد عليه — تحقق منه)

- 232 ملف TypeScript/TSX، حجم 2.2 MB
- قاعدتا بيانات نشطتان في نفس الوقت: **Prisma/SQLite (قديم) + Supabase/PostgreSQL (جديد)**
- نسبة الترحيل: **7% فقط** (2 من 28 خدمة)
- `db.ts` يشير لمسار SQLite محذوف → **Runtime سيفشل**
- الهيكل: `src/features/` (11 ميزة) + `src/core/` + `src/app/api/` (45+ endpoint)

---

## المرحلة 0 — الجرد الكامل (نفّذ أولاً)

```bash
# 0.1 — هيكل المشروع الكامل
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | \
  grep -v node_modules | grep -v .next | sort > /tmp/all-files.txt
wc -l /tmp/all-files.txt

# 0.2 — كل الـ imports من db.ts و supabase.ts
grep -rn "from.*lib/db" src/ --include="*.ts" --include="*.tsx"
grep -rn "from.*lib/supabase" src/ --include="*.ts" --include="*.tsx"
grep -rn "from.*@prisma" src/ --include="*.ts" --include="*.tsx"
grep -rn "createClient.*supabase" src/ --include="*.ts" --include="*.tsx"

# 0.3 — قراءة ملفات الاتصال بقاعدة البيانات
cat src/lib/db.ts
cat src/lib/supabase.ts

# 0.4 — Schema Prisma كاملاً
cat prisma/schema.prisma

# 0.5 — كل الـ API routes
find src/app/api -name "route.ts" | sort
# ثم اقرأ كل ملف منها

# 0.6 — package.json والـ tsconfig
cat package.json
cat tsconfig.json
cat next.config.ts 2>/dev/null || cat next.config.js 2>/dev/null || cat next.config.mjs 2>/dev/null

# 0.7 — متغيرات البيئة
cat .env.local 2>/dev/null | sed 's/=.*/=***/'
cat .env.example 2>/dev/null

# 0.8 — جميع الخدمات في features/
find src/features -name "*.ts" | grep -v ".test." | sort
# اقرأ كل ملف خدمة

# 0.9 — core/domain كاملاً
find src/core -type f | sort
# اقرأ كل ملف

# 0.10 — فحص console.log و any و TODO
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx" | wc -l
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | wc -l
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx"

# 0.11 — فحص الاختبارات
find src -name "*.test.ts" -o -name "*.spec.ts" | sort
find src -name "*.test.tsx" -o -name "*.spec.tsx" | sort

# 0.12 — بناء فعلي (سجّل كل الأخطاء)
bun run build 2>&1 | head -200
bun run lint 2>&1 | head -100
npx tsc --noEmit 2>&1 | head -100
```

**اقرأ كل مخرجات هذه الأوامر قبل الانتقال للمرحلة التالية.**

---

## المرحلة 1 — أزمة قاعدة البيانات (الأولوية القصوى)

هذه المشكلة تمنع الإنتاج. حللها أولاً.

### 1.1 — جرد الوضع الحالي

لكل خدمة في `src/features/*/`:

```
| الخدمة | تستخدم Prisma؟ | تستخدم Supabase؟ | الاثنين؟ | يعمل؟ |
|--------|--------------|-----------------|---------|-------|
```

### 1.2 — فحص db.ts

- ما المسار الذي يشير إليه؟ هل الملف موجود؟
- ما الخدمات التي تستورده؟
- ما الذي سيحدث عند تشغيل هذه الخدمات؟

### 1.3 — فحص supabase.ts

- هل الـ URL والـ KEY صحيحان في البيئة؟
- هل الـ client يُنشأ مرة واحدة (singleton) أم متعدد؟
- هل هناك فرق بين `createClient` server-side و client-side؟

### 1.4 — خريطة الترحيل الكاملة

```
| الخدمة | حالة الترحيل | يعمل الآن؟ | ما المطلوب؟ |
|--------|-------------|-----------|-----------|
| auth   |             |           |           |
| bookings|            |           |           |
| companies|           |           |           |
| ... (كل الـ 28 خدمة) |
```

### 1.5 — تقييم مخاطر الترحيل

- هل بنية Supabase tables تطابق Prisma schema؟
- هل هناك بيانات في SQLite تحتاج ترحيلاً؟
- هل RLS (Row Level Security) مُضبوط في Supabase؟
- هل الـ foreign keys صحيحة في كلا الطرفين؟

---

## المرحلة 2 — فحص أخطاء TypeScript والبناء

### 2.1 — تصنيف أخطاء TypeScript

لكل خطأ من `tsc --noEmit`:
```
| الملف | السطر | نوع الخطأ | السبب | الإصلاح الصحيح | خطر الإصلاح الخاطئ |
|-------|-------|----------|-------|--------------|-------------------|
```

**تصنيف الأخطاء:**
- 🔴 **Type Mismatch** — قد يُخفي bug حقيقي
- 🟠 **Missing Type** — ناقص لكن قد يعمل
- 🟡 **`any` Usage** — يُضعف الـ type safety
- 🟢 **Unused Import** — تنظيف فقط

### 2.2 — فحص أخطاء Build

لكل خطأ في `bun run build`:
- هل خطأ compile-time أم runtime؟
- هل يمنع البناء أم مجرد تحذير؟
- ما الملف والسطر؟

### 2.3 — فحص ESLint

لكل تحذير في `bun run lint`:
- هل يشير لمشكلة حقيقية؟
- هل يمكن تجاهله بأمان؟

---

## المرحلة 3 — فحص التكامل بين الطبقات

### 3.1 — صحة الـ Imports

لكل ملف في `src/features/`:

```bash
# افحص كل import وتحقق أن الملف المستهدف موجود
grep -n "^import\|^export" src/features/[feature]/[file].ts
```

أنتج:
```
| الملف | Import | الملف المستهدف | موجود؟ | النوع المُصدَّر صحيح؟ |
|-------|--------|--------------|--------|-------------------|
```

### 3.2 — تسلسل الـ Dependencies

```
feature/auth → يستورد من → ?
feature/bookings → يستورد من → ?
feature/escrow → يستورد من → ?
```

هل هناك **circular dependencies**؟
```bash
# فحص دائري
npx madge --circular src/ 2>/dev/null || \
grep -rn "from.*features" src/features/ --include="*.ts" | \
  awk -F: '{print $1, $3}' | sort
```

### 3.3 — توافق الطبقات

لكل service في `src/features/*/`:
- هل تستورد من `src/core/` بشكل صحيح؟
- هل تستخدم الـ types المُعرَّفة في `core/domain/`؟
- هل هناك تضارب بين types في features مختلفة؟

### 3.4 — فحص الـ API Routes ↔ Services

لكل route في `src/app/api/`:
- ما الـ service التي تستدعيها؟
- هل الـ service موجودة وتُصدِّر الـ function المطلوبة؟
- هل الـ response type متوافق مع ما يتوقعه الـ frontend؟

---

## المرحلة 4 — الفحص الأمني الشامل

### 4.1 — المصادقة

اقرأ كل ملف في `src/features/auth/` و `src/app/api/auth/`:

```
□ هل NextAuth مُضبوط بشكل صحيح؟ (اقرأ [...nextauth]/route.ts)
□ هل الـ session strategy: "jwt" أم "database"؟
□ هل JWT secret قوي وفي .env؟
□ هل tokens تُحفَظ في httpOnly Cookie؟ (ابحث عن localStorage.setItem)
□ هل هناك OTP implementation؟ كيف يُولَّد وأين يُخزَّن؟
□ هل OTP له expiry؟ كم دقيقة؟
□ هل هناك rate limiting على /api/auth/*؟
```

**فحص محدد:**
```bash
grep -rn "localStorage" src/ --include="*.ts" --include="*.tsx"
grep -rn "sessionStorage" src/ --include="*.ts" --include="*.tsx"
grep -rn "jwt\|JWT\|token" src/features/auth/ --include="*.ts"
grep -rn "bcrypt\|hash" src/features/auth/ --include="*.ts"
```

### 4.2 — التحكم في الوصول

لكل API route:
```
□ هل هناك middleware يتحقق من الهوية؟
□ هل getServerSession() مُستخدَمة أم getSession() (client-side - خطر)؟
□ هل هناك resource-level check؟ (المستخدم يعدّل بياناته فقط)
□ هل Admin routes محمية بـ role check؟
```

```bash
# فحص routes بدون auth
grep -rn "getServerSession\|getSession\|auth()" src/app/api/ --include="*.ts" -l
# قارن بقائمة كل routes
```

أنتج:
```
| Route | يتحقق من Auth؟ | يتحقق من Role؟ | يتحقق من Ownership؟ | الخطر |
|-------|--------------|--------------|-------------------|-------|
```

### 4.3 — التحقق من المدخلات

```bash
# Routes بدون Zod
grep -rn "zod\|z\." src/app/api/ --include="*.ts" -l
```

لكل route بدون Zod:
- ما البيانات التي يقبلها؟
- ما الخطر؟

```bash
# فحص SQL Injection (raw queries)
grep -rn "\.query\|\.execute\|\$queryRaw\|\$executeRaw" src/ --include="*.ts"

# فحص XSS
grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx"
grep -rn "innerHTML" src/ --include="*.tsx"

# فحص CORS
cat src/middleware.ts 2>/dev/null
grep -rn "Access-Control\|cors" src/ --include="*.ts"
```

### 4.4 — نظام Escrow (أحرج نقطة مالية)

اقرأ كل ملف في `src/features/escrow/` و `src/app/api/escrow/`:

```
□ هل عمليات الإنشاء/الإفراج/الاسترداد تستخدم database transactions؟
□ هل هناك double-spending protection؟
□ هل المبالغ تُتحقق منها server-side؟ (لا client-side فقط)
□ هل هناك audit log لكل عملية مالية؟
□ هل يمكن لمستخدم إفراج escrow لا يملكه؟
□ هل هناك idempotency keys لمنع الطلبات المكررة؟
```

### 4.5 — البيانات الحساسة

```bash
# بيانات حساسة في responses
grep -rn "password\|hash\|secret\|key" src/app/api/ --include="*.ts" | \
  grep -v "// " | grep "return\|json\|res\."

# Secrets في الكود
grep -rn "sk_\|pk_\|api_key\|apiKey" src/ --include="*.ts" | grep -v ".env"
```

---

## المرحلة 5 — فحص Runtime والأخطاء الحية

### 5.1 — فحص الملفات المُشار إليها وغير الموجودة

```bash
# كل import وهل الملف موجود
grep -rn "from '\.\." src/ --include="*.ts" --include="*.tsx" | \
  awk -F"'" '{print $2}' | sort -u | while read path; do
    [ ! -f "$path.ts" ] && [ ! -f "$path.tsx" ] && [ ! -f "$path/index.ts" ] && \
    echo "MISSING: $path"
  done
```

### 5.2 — فحص المتغيرات البيئية

لكل `process.env.X` في الكود:
```
| المتغير | الملف | موجود في .env؟ | له قيمة افتراضية؟ | ماذا يحدث إذا غاب؟ |
|---------|-------|--------------|-----------------|------------------|
```

```bash
grep -rn "process\.env\." src/ --include="*.ts" --include="*.tsx" | \
  grep -v node_modules | awk -F'process.env.' '{print $2}' | \
  tr -d '\"'"'"')\s' | sort -u
```

### 5.3 — أخطاء التهيئة (Initialization Errors)

```bash
# ملفات تُنفَّذ عند startup
cat src/lib/db.ts
cat src/lib/supabase.ts
cat src/app/layout.tsx
cat src/middleware.ts 2>/dev/null
```

- هل أي منها يُلقي exception عند التحميل؟
- هل `db.ts` يحاول فتح SQLite غير موجود؟

---

## المرحلة 6 — آلية الإصلاح الآمن

### 6.1 — مبادئ الإصلاح الصحيح

**قبل أي إصلاح، أجب:**
```
□ هل هذا الإصلاح يحل مشكلة حقيقية أم مجرد تنظيف؟
□ هل يمكن أن يكسر شيئاً آخر؟ (تحقق من كل مكان يُستخدم فيه)
□ هل هناك tests ستفشل بعده؟
□ هل يغير الـ API contract (قد يكسر الـ frontend)؟
□ هل يتعلق بـ Escrow أو Auth؟ (تعامل بحذر مضاعف)
```

### 6.2 — تصنيف الإصلاحات

**إصلاحات آمنة (نفّذ مباشرة):**
- إضافة missing import موجود في الكود
- إضافة type annotation ناقصة
- حذف unused import
- إصلاح typo في string

**إصلاحات تحتاج مراجعة:**
- تغيير type من `any` إلى محدد (قد يكشف مشاكل خفية)
- إضافة Zod validation (قد يرفض بيانات كانت تمر)
- تغيير async/await pattern
- إعادة هيكلة import paths

**إصلاحات خطيرة — استشر أولاً:**
- أي تغيير في `src/features/escrow/`
- أي تغيير في JWT/session handling
- أي تغيير في database schema أو queries
- أي تغيير يمس أكثر من 3 ملفات

### 6.3 — الإصلاحات الزائدة الشائعة وعلاجها

| الإصلاح الزائد الشائع | لماذا خطير؟ | العلاج الصحيح |
|---------------------|------------|--------------|
| تحويل `any` لـ `unknown` في كل مكان | يكسر الكود الذي يعتمد على dynamic access | غيّر فقط في الـ API boundaries |
| إضافة `!` (non-null assertion) لإسكات TypeScript | يُخفي null errors حقيقية | أضف null check حقيقي |
| `// @ts-ignore` لحل خطأ | يُخفي المشكلة | أفهم السبب الجذري |
| حذف field من response لتجنب خطأ | قد يكسر الـ frontend | تحقق من كل consumer |
| إضافة `try/catch` فارغ | يبتلع الأخطاء | سجّل دائماً في catch |
| تغيير `==` لـ `===` | قد يغير السلوك في type coercion | تحقق من السياق |

### 6.4 — مراجعة الإصلاحات (Audit Checklist)

لكل إصلاح مُقترَح:
```
□ ما المشكلة التي يحلها؟ (محددة)
□ ما الملفات المتأثرة؟ (أكثر من 1 = راجع)
□ هل الـ imports بعده صحيحة؟
□ هل الـ exports لم تتغير (أو تغيرت وتم تحديث كل consumers)؟
□ هل ترتيب الـ dependencies لم يتأثر؟
□ هل يتوافق مع Supabase (وليس Prisma القديم)؟
```

---

## المرحلة 7 — الجاهزية للإنتاج

### 7.1 — Supabase Setup

```
□ هل RLS مُفعَّل على كل الجداول؟
□ هل الـ policies تسمح بالقراءة/الكتابة للـ role الصحيح؟
□ هل هناك policy تمنع المستخدم من رؤية بيانات غيره؟
□ هل الـ service_role key محمي (server-only فقط)؟
□ هل الـ anon key لا يُعطي صلاحيات زائدة؟
```

### 7.2 — الترحيل الكامل (Migration Plan)

للخدمات الـ 26 الباقية:
```
| الخدمة | الخطوات | المخاطر | الاختبار المطلوب |
|--------|---------|---------|----------------|
```

**ترتيب الترحيل المقترح:**
1. الخدمات التي لا تمس بيانات مالية (أقل خطراً)
2. الخدمات المالية (escrow, orders, bookings) بعد التحقق الكامل

### 7.3 — قائمة ما يمنع الإنتاج

```
🔴 BLOCKERS (يجب حلها قبل أي نشر):
□ 
□ 
□ 

🟠 CRITICAL (يجب حلها في أول 24 ساعة من الإنتاج):
□ 
□ 

🟡 IMPORTANT (يجب حلها في أول أسبوع):
□ 
□ 
```

---

## المخرجات المطلوبة

### 📊 لوحة القيادة

```
┌─────────────────────────────────────────────────────┐
│ إجمالي الملفات المفحوصة:          ___              │
│ أخطاء TypeScript:                  ___              │
│ Routes بدون Auth:                  ___ من ___       │
│ Routes بدون Validation:            ___ من ___       │
│ Services تستخدم Prisma:            ___ من 28        │
│ Services تستخدم Supabase:          ___ من 28        │
│ Services تستخدم الاثنين:           ___              │
│ console.log في الكود:              ___              │
│ استخدامات any:                     ___              │
│ ملفات بدون أي test:                ___ من ___       │
│ Escrow transactions آمنة؟:         ✅ / ❌           │
│ Auth tokens في httpOnly Cookie؟:   ✅ / ❌           │
│ الجاهزية للإنتاج:                  ____%            │
└─────────────────────────────────────────────────────┘
```

### 📋 قائمة الفجوات مرتبة بالأولوية

```
| # | الفجوة | النظام | الخطورة | الملف | السطر | الإصلاح الصحيح |
|---|--------|--------|---------|-------|-------|--------------|
```

### 🗺️ خارطة طريق الإصلاح

```
اليوم 1 (Blockers):
  1. [إصلاح محدد + الملف + الخطوات]

اليوم 2-3 (Security):
  1. [إصلاح محدد + الملف + الخطوات]

الأسبوع 1 (Migration):
  1. [خطة ترحيل الـ 26 خدمة]

الأسبوع 2-4 (Hardening):
  1. [تحسينات الأداء والأمان]
```

### 🔧 تحديث STATUS.md و DECISIONS.md

بناءً على ما وجدته فعلاً — لا على ما تتوقعه.

---

## تعليمات الأسلوب

1. **دليل لكل ادعاء:** اسم الملف + رقم السطر + مقتطف الكود
2. **فرّق بين:** غائب (لم يُبنَ) / معطوب (موجود لكن خاطئ) / زائد (موجود ويُسبب مشكلة)
3. **الإصلاح الزائد أسوأ من الخطأ الأصلي** — نبّه عليه صراحةً
4. **Escrow وAuth:** تعامل معهما بحذس مضاعف — كل تغيير يحتاج تبريراً
5. **ابدأ بما يمنع التشغيل (🔴) ثم ما يمنع الإنتاج ثم التحسينات**
