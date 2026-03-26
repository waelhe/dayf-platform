# 📘 دليل البناء — منصة ضيف

> **اقرأ CONSTITUTION.md أولاً، ثم SYSTEMS.md، ثم هذا الملف.**

---

## 🏗️ الهيكل المعماري

```
src/
├── core/                          # النواة — لا تُعدّل إلا للأساسيات
│   ├── domain/
│   │   ├── entities/              # User, Booking, Listing, Payment, Review...
│   │   ├── value-objects/         # Money (SYP+USD), Address, Rating, TrustScore
│   │   ├── rules/                 # قواعد العمل
│   │   └── authorization/         # الصلاحيات والأدوار
│   ├── events/                    # Event Bus — التواصل الوحيد بين الوحدات
│   ├── interfaces/                # واجهات المستودعات والخدمات
│   └── types/                     # أنواع TypeScript المشتركة
│
├── modules/                       # الأنظمة الخمسة + الأساس
│   ├── reviews/                   # 🔴 النظام الأول — تحت البناء
│   ├── planning/                  # 🟠 النظام الثاني — مخطط
│   ├── guides/                    # 🟡 النظام الثالث — بيانات جاهزة
│   ├── booking-experience/        # 🟢 النظام الرابع — الأقوى
│   └── community/                 # 🟡 النظام الخامس — قاعدة جيدة
│
├── application/
│   ├── services/                  # خدمات التطبيق
│   ├── use-cases/                 # حالات الاستخدام
│   └── mappers/                   # محولات البيانات
│
├── infrastructure/
│   ├── repositories/              # Prisma — الوصول للبيانات
│   ├── services/                  # Auth, Audit, Logger
│   └── providers/
│       ├── ai/                    # z-ai-web-dev-sdk (لا استدعاء مباشر)
│       ├── storage/               # الملفات والصور
│       └── payment/               # Escrow + Payment
│
├── app/                           # Next.js 16 App Router
│   ├── api/                       # API Routes
│   │   └── socket/                # Socket.io endpoint
│   └── (routes)/                  # الصفحات — RTL إلزامي
│
└── shared/
    ├── components/                # shadcn/ui — RTL
    ├── hooks/                     # React Hooks
    └── contexts/                  # React Contexts
```

---

## 🔄 تدفق العمل

### لكل ميزة جديدة:

```
1. SPEC    ← ماذا نريد؟ (وثّق في STATUS.md)
2. CHECK   ← هل يتوافق مع الدستور الستة؟
3. SYSTEMS ← أي أنظمة تتأثر؟ (راجع SYSTEMS.md)
4. BUILD   ← ابنِ — النظام الكلاسيكي أولاً، AI ثانياً
5. EVENT   ← هل تُصدر الأحداث الصحيحة؟
6. UPDATE  ← حدّث STATUS.md
```

**قاعدة ذهبية: لا كود AI قبل أن يعمل الكود الكلاسيكي**

---

## 🚌 التواصل بين الوحدات — Event Bus فقط

### ✅ مسموح:
```typescript
// نشر حدث
await eventBus.publish('booking.completed', {
  bookingId,
  userId,
  listingId,
  completedAt: new Date()
});

// الاشتراك في حدث
eventBus.subscribe('booking.completed', async (data) => {
  await reviewService.openReviewWindow(data.bookingId);
  await loyaltyService.awardPoints(data.userId, data.bookingId);
});
```

### ❌ ممنوع:
```typescript
// استدعاء مباشر بين modules
import { BookingService } from '../booking-experience'; // ❌
import { ReviewService } from '../../modules/reviews';  // ❌
```

---

## 📡 أحداث الأنظمة الخمسة

### أحداث نظام التجربة (تُطلق الكثير):
```
booking.created      → Escrow, Notifications
booking.confirmed    → Chat channel, Document wallet, Notifications
booking.completed    → Review window, Loyalty, AI summary
booking.cancelled    → Escrow refund, Notifications
escrow.released      → Verified review status
dispute.opened       → Admin alert, Chat freeze
dispute.resolved     → Company reputation update
```

### أحداث نظام المراجعة (تُغذي الكثير):
```
review.created       → TrustScore, Recommendations, Gamification
review.helpful_voted → ReviewerLevel, Gamification points
review.fake_flagged  → Admin queue, UserReputation penalty
review.ai_processed  → Listing summary update
```

### أحداث الأنظمة الأخرى:
```
itinerary.created    → Booking suggestions
listing.viewed       → Recommendation model update
community.post_created → Gamification points
user.level_up        → Notification, Badge award
```

---

## 👥 الأدوار والصلاحيات

| الدور | الصلاحيات الرئيسية |
|-------|-------------------|
| **Guest** | يتصفح، يبحث، يقرأ المراجعات |
| **User** | يحجز + يكتب مراجعات verified + يشارك في المجتمع |
| **Host** | يدير Listings + يؤكد الحجوزات + يرد على المراجعات |
| **Company** | يدير موظفين + جولات + تقارير |
| **Admin** | كل شيء + موافقة المحتوى + إدارة Disputes |
| **AI Service** | يقرأ البيانات، لا يكتب مباشرة — دائماً عبر Service |

---

## 🛠️ التقنيات

| الفئة | التقنية | الملاحظة |
|-------|---------|---------|
| Framework | Next.js 16 + TypeScript | Turbopack افتراضي |
| Runtime | Bun | أسرع من Node في التطوير |
| Database | Prisma + SQLite → PostgreSQL | راجع ADR-002 |
| Styling | Tailwind CSS 4 + shadcn/ui | RTL إلزامي |
| Validation | Zod | على كل input خارجي |
| Auth | NextAuth.js + JWT | httpOnly Cookie |
| State | Zustand + TanStack Query | |
| Real-time | Socket.io | راجع ADR-006 |
| AI | z-ai-web-dev-sdk | abstraction layer |
| AI Models | LLM + VLM + TTS | عبر SDK فقط |

---

## 📂 هيكل الوحدة (كل module يتبع هذا):

```
modules/[system-name]/
├── domain/
│   ├── entities/          # الكيانات
│   ├── value-objects/     # القيم الثابتة
│   └── rules/             # قواعد العمل
├── application/
│   ├── services/          # المنطق + AI services (مع fallback)
│   └── use-cases/         # حالات الاستخدام
├── infrastructure/
│   ├── repositories/      # Prisma queries
│   └── providers/         # AI, Storage, External
└── index.ts               # الواجهة العامة الوحيدة
```

---

## 🤖 نمط خدمة AI (إلزامي)

كل خدمة تستخدم AI يجب أن تتبع هذا النمط:

```typescript
export class ReviewSentimentService {
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      // محاولة AI أولاً
      return await this.aiProvider.analyzeSentiment(text);
    } catch (error) {
      // fallback كلاسيكي — دائماً
      logger.warn('AI sentiment failed, using keyword fallback', { error });
      return this.keywordBasedFallback(text);
    }
  }

  private keywordBasedFallback(text: string): SentimentResult {
    // نظام كلاسيكي بسيط يعمل دائماً
  }
}
```

---

## 🎯 نصائح للـ AI (عند العمل على ضيف)

1. **اقرأ CONSTITUTION.md أولاً** — 6 مواد ثابتة
2. **راجع SYSTEMS.md** — قبل أي عمل يمس أكثر من وحدة
3. **راجع DECISIONS.md** — قبل اقتراح تغيير معماري
4. **تحقق من STATUS.md** — لمعرفة ما تم وما لم يتم
5. **لا كود AI بدون fallback** — المادة II من الدستور
6. **لا استدعاء مباشر بين modules** — Event Bus فقط
7. **RTL دائماً** — المشروع سياحة عربية
8. **حدّث STATUS.md** — بعد كل إنجاز
