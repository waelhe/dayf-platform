# 📕 المحظورات — منصة ضيف

> **إذا رأيت نفسك على وشك فعل أي من هذه — توقف وفكر.**

---

## ❌ البنية المعمارية

| ❌ ممنوع | ✅ البديل | السبب |
|----------|-----------|-------|
| استدعاء مباشر بين modules | Event Bus | يقتل الاستقلالية |
| Business Logic في Infrastructure | Domain/Application layer | يخلط المسؤوليات |
| AI call بدون fallback | try/catch + كلاسيكي | المادة II من الدستور |
| تعديل `core/` بدون ضرورة | أضف في الـ module | يكسر الأساس |
| استدعاء AI provider مباشرة | عبر `z-ai-web-dev-sdk` فقط | ADR-005 |
| تجاوز Escrow في الحجوزات | Escrow إلزامي دائماً | ADR-001 |

---

## ❌ الأمان

| ❌ ممنوع | ✅ البديل | الخطر |
|----------|-----------|-------|
| Token في localStorage | httpOnly Cookie | XSS theft |
| SQL خام `${input}` | Prisma queries | SQL Injection |
| API بدون Zod validation | Zod schema على كل input | Injection attacks |
| Secrets في الكود | .env فقط | تسريب المفاتيح |
| `dangerouslySetInnerHTML` | sanitize-html أولاً | XSS |
| إرجاع stack trace للمستخدم | رسالة عامة + logger تفصيلي | تسريب معلومات |
| Rate limiting غير موجود | Rate limit على كل endpoint عام | DDoS/Abuse |

---

## ❌ البيانات السياحية

| ❌ ممنوع | ✅ البديل | السبب |
|----------|-----------|-------|
| حذف حقيقي للمراجعات المؤكدة | isHidden + audit log | المادة IV من الدستور |
| حذف حقيقي للبيانات المالية | Soft Delete دائماً | المادة I من الدستور |
| نشر Destination بدون موافقة | Admin approval flow | المادة III من الدستور |
| AI يُنشئ بيانات وجهات | مراجعة بشرية إلزامية | المادة III من الدستور |
| تخزين سعر بعملة واحدة | SYP + USD دائماً | السياق السوري |

---

## ❌ الكود

| ❌ ممنوع | ✅ البديل | السبب |
|----------|-----------|-------|
| `any` في TypeScript | `unknown` + type guard | يفقد فائدة TypeScript |
| `console.log` في الإنتاج | `logger.info/warn/error` | أداء + أمان |
| كود مكرر | استخرج دالة/hook | صعوبة الصيانة |
| دالة أطول من 50 سطر | قسمها | صعوبة القراءة |
| ملف أكبر من 300 سطر | قسمه | صعوبة التتبع |
| مجلد بدون `index.ts` | أضف `index.ts` | imports فوضوية |
| Import من داخل module آخر | من `index.ts` فقط | اقتران مخفي |

---

## ❌ نظام المراجعات (قواعد خاصة)

| ❌ ممنوع | ✅ البديل | السبب |
|----------|-----------|-------|
| مراجعة بدون حجز مؤكد | تحقق من Booking status | منع المراجعات المزيفة |
| المضيف يحذف مراجعة | المضيف يرد فقط | المادة IV من الدستور |
| تغيير خوارزمية الترتيب | وثّق في DECISIONS.md أولاً | ADR-004 |
| مراجعة واحدة لكل حجز | enforce @@unique | منع التكرار |

---

## ❌ الذكاء الاصطناعي

| ❌ ممنوع | ✅ البديل | السبب |
|----------|-----------|-------|
| عرض خطأ AI للمستخدم | عرض النظام الكلاسيكي | تجربة مستخدم + أمان |
| AI بدون تسجيل التكلفة | logger.ai(cost, duration) | إدارة التكاليف |
| AI يكتب في DB مباشرة | AI يُعيد نتيجة → Service يكتب | Audit trail |
| LLM بدون max_tokens محدد | حدد دائماً | تكلفة غير متوقعة |
| Prompt يحتوي بيانات حساسة | anonymize أولاً | خصوصية البيانات |

---

## ❌ الواجهة (Frontend)

| ❌ ممنوع | ✅ البديل | السبب |
|----------|-----------|-------|
| بدون `dir="rtl"` | `dir="rtl"` دائماً | المشروع عربي |
| API call بدون loading state | loading + error + success | تجربة مستخدم |
| نسيان error boundary | ErrorBoundary على كل قسم | لا crash كامل |
| صورة بدون lazy loading | `loading="lazy"` | أداء |
| نص عربي بخط لاتيني | Noto Sans Arabic / IBM Plex Arabic | قابلية القراءة |

---

## 🚨 علامات تحذيرية — توقف فكر

```
⚠️ "سأستدعي هذا الـ service مباشرة بدل Event..."
⚠️ "لا حاجة للـ fallback هنا، AI لن يفشل..."
⚠️ "سأحذف المراجعة لأن المضيف طلب..."
⚠️ "سأستخدم any لأن النوع معقد..."
⚠️ "هذا مؤقت فقط..." (المؤقت يصبح دائماً)
⚠️ "سأتجاوز Escrow لأن الحجز صغير..."
⚠️ "لا حاجة لـ validation هنا، المستخدم موثوق..."
⚠️ "سأنسخ هذا الكود وأعدل عليه..."
⚠️ "سأبني AI أولاً ثم أضيف الكلاسيكي..."
```

---

## ✅ قائمة التحقق قبل كل commit

```
□ لا يوجد any
□ لا يوجد console.log
□ كل API input مُتحقق منه بـ Zod
□ الأخطاء مُعالجة (try/catch)
□ كل AI call له fallback
□ لا استدعاء مباشر بين modules
□ لا حذف حقيقي لبيانات حساسة
□ الواجهة تدعم RTL
□ Tests تمر (إذا وُجدت)
□ STATUS.md محدّث
```

---

## 📋 جدول البدائل السريع

| ❌ ممنوع | ✅ البديل |
|----------|-----------|
| استدعاء مباشر بين modules | Event Bus |
| `any` | `unknown` + type guard |
| `console.log` | `logger` service |
| كود مكرر | استخرج دالة |
| SQL خام | Prisma queries |
| `dangerouslySetInnerHTML` | sanitize-html |
| Token في localStorage | httpOnly Cookie |
| API بدون تحقق | Zod + middleware |
| خطأ AI للمستخدم | fallback كلاسيكي |
| حذف مراجعة | isHidden + audit |
| تجاوز Escrow | Escrow إلزامي |
| AI بدون fallback | try/catch + كلاسيكي |

---

**تذكر: هذه القواعد لحماية منصة ضيف ومستخدميها، وليست لتعقيد العمل.**
