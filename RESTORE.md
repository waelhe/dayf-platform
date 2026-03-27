# 🔄 ملف الاستعادة - منصة ضيف

> **أرسل هذا الملف في بداية أي جلسة جديدة**
> **آخر تحديث تلقائي: سيتم تحديثه بعد كل إنجاز**

---

## 🎯 المشروع

```
الاسم: منصة "ضيف" (Dayf)
النوع: منصة سياحية سورية متكاملة
Framework: Next.js 16 + TypeScript
Runtime: Bun
Port: 3000
```

---

## 📊 حالة قاعدة البيانات

```
الحالية: SQLite + Prisma (تعمل محلياً)
المستهدف: Supabase (PostgreSQL)
URL: jqzpxxsrdcdgimiimbqx.supabase.co
```

---

## 🔴🔴🔴 أوامر فحص الواقع الحقيقي (نفذها قبل الإرسال)

> **هذه الأوامر تُظهر الحقيقة وليس المسجل**

### 1. آخر 50 سطر من السيرفر:
```bash
tail -50 /home/z/my-project/dev.log
```

### 2. سجل العمل:
```bash
cat /home/z/my-project/worklog.md
```

### 3. حالة الأنظمة:
```bash
cat /home/z/my-project/.specify/memory/status.md
```

### 4. فحص الأخطاء:
```bash
grep -i "error" /home/z/my-project/dev.log | tail -20
```

---

## 📁 الملفات الأساسية (اقرأها بالترتيب)

### 1. الدستور (أهم ملف)
```
.specify/memory/constitution.md
```

### 2. حالة المشروع
```
.specify/memory/status.md
```

### 3. المحظورات
```
.specify/rules/RULES.md
```

### 4. خريطة الأنظمة
```
.specify/systems/SYSTEMS.md
```

### 5. القرارات المعمارية
```
.specify/decisions/DECISIONS.md
```

### 6. دليل البناء
```
.specify/guide/GUIDE.md
```

### 7. سجل العمل
```
worklog.md
```

---

## 🔴 الأولويات الحالية

```
1. الهجرة إلى Supabase (ADR-002)
2. نظام المراجعة الذكي (ADR-004)
3. إضافة Auth لـ 53 route بدون حماية
```

---

## ⚠️ قواعد مهمة

1. **اقرأ قبل أن تكتب** - دائماً استخدم Read قبل Write/Edit
2. **لا أي** - لا تستخدم `any` في TypeScript
3. **RTL دائماً** - المشروع عربي
4. **AI له fallback** - لا كود AI بدون بديل كلاسيكي
5. **Event Bus فقط** - لا استدعاء مباشر بين modules
6. **Escrow إلزامي** - لا تجاوزه في الحجوزات

---

## 🔗 روابط خارجية

- smart.zip: https://github.com/waelhe/run/blob/main/smart.zip
- spec-kit: https://github.com/waelhe/run/blob/main/spec-kit-main.zip

---

## 📝 آخر تحديث

```
التاريخ: 2025-03-26
آخر عمل: تثبيت نظام التوجيه الذكي (smart.zip)
العقبة: الهجرة إلى Supabase
```

---

## 📤 كيفية الاستعادة

### الخطوة 1: نفذ أوامر الفحص
```bash
tail -50 /home/z/my-project/dev.log
cat /home/z/my-project/worklog.md
```

### الخطوة 2: أرسل لي
```
[نتيجة أوامر الفحص]
[محتوى RESTORE.md]

استمر من حيث توقفت
```

---

**ملاحظة للمستخدم: إذا حدثت تغييرات، أخبرني بها قبل المتابعة**
