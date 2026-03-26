# 🗺️ خريطة الأنظمة الخمسة — منصة ضيف

> **اقرأ هذا الملف قبل أي عمل يمس أكثر من وحدة واحدة.**
> **أي تغيير في نظام يؤثر على الأنظمة المرتبطة به — راجع الخريطة أولاً.**

---

## 📊 جاهزية الأنظمة (من التشخيص الأخير)

| النظام | البنية | البيانات | الذكاء | التكامل | الأولوية |
|--------|--------|----------|--------|---------|---------|
| **1. المراجعة الذكية** | 85% | 70% | 30% | 75% | 🔴 ابدأ هنا |
| **2. تخطيط السفر الذكي** | 60% | 70% | 10% | 50% | 🟠 المرحلة الثانية |
| **3. الأدلة السياحية الذكية** | 75% | 80% | 20% | 70% | 🟡 المرحلة الثالثة |
| **4. التجربة المتكاملة** | 90% | 85% | 40% | 85% | 🟢 أقوى نظام |
| **5. المجتمع والسوق** | 80% | 75% | 25% | 65% | 🟡 المرحلة الثالثة |

---

## 🔗 خريطة التبعيات

```
نظام المراجعة (1)
│  └── يُغذي ──→ التوصيات في نظام التخطيط (2)
│  └── يُغذي ──→ Trust Score في نظام المجتمع (5)
│  └── يُغذي ──→ جودة Listings في نظام الأدلة (3)
│  └── يُحرّك ──→ مكافآت ما بعد الحجز في نظام التجربة (4)
│
نظام التخطيط والتوصية (2)
│  └── يستهلك ──→ بيانات نظام الأدلة (3)
│  └── يُحول ──→ حجوزات في نظام التجربة (4)
│
نظام الأدلة السياحية (3)
│  └── يُغذي ──→ كل الأنظمة بالبيانات (مدخل مشترك)
│
نظام التجربة المتكاملة (4)
│  └── يُنتج ──→ مراجعات في نظام المراجعة (1) [بعد الانتهاء]
│  └── يُنشئ ──→ محتوى مجتمعي في نظام المجتمع (5)
│
نظام المجتمع والسوق (5)
    └── يُعزز ──→ ظهور Listings في نظام الأدلة (3)
    └── يُؤثر على ──→ ترتيب التوصيات في نظام التخطيط (2)
```

**الاستنتاج:** نظام المراجعة (1) هو المحور — يُنشئه نظام التجربة (4) ويُغذي كل الأنظمة الأخرى.

---

## 1️⃣ نظام المراجعة الذكي

### الوحدات المعمارية:
```
src/modules/reviews/
├── domain/
│   ├── entities/Review.ts           ← criteriaRatings: JSON مطلوب
│   ├── entities/ReviewHelpful.ts    ← 🔴 مفقود — يحتاج بناء
│   └── entities/ReviewerBadge.ts   ← 🔴 مفقود — يحتاج بناء
├── application/
│   ├── services/ReviewRankingService.ts   ← 🔴 خوارزمية ذكية مطلوبة
│   ├── services/FakeDetectionService.ts  ← 🔴 AI مطلوب
│   └── services/SentimentService.ts      ← 🔴 AI مطلوب
└── infrastructure/
    └── providers/AIReviewProvider.ts     ← يستخدم z-ai-web-dev-sdk ✅
```

### الأحداث التي يُصدرها:
```
review.created         → يُغذي: TrustScore, Recommendations, Gamification
review.helpful_marked  → يُغذي: ReviewerLevel, Gamification
review.fake_detected   → يُغذي: Admin dashboard, UserReputation
review.ai_summarized   → يُغذي: Listing display
```

### الأحداث التي يستهلكها:
```
booking.completed  ← يفتح إمكانية كتابة مراجعة
escrow.released    ← يُؤكد أن الإقامة اكتملت (Verified)
```

### النماذج الناقصة (Prisma):
```prisma
model ReviewCriteria {
  reviewId    String
  cleanliness Float
  accuracy    Float
  location    Float
  value       Float
  service     Float
  // ...
}

model ReviewHelpful {
  userId    String
  reviewId  String
  isHelpful Boolean
  @@unique([userId, reviewId])
}

model ReviewerBadge {
  userId    String
  badge     BadgeType  // TOP_REVIEWER, EXPERT, VERIFIED_TRAVELER
  earnedAt  DateTime
}
```

---

## 2️⃣ نظام تخطيط السفر والتوصية الذكي

### الوحدات المعمارية:
```
src/modules/planning/
├── domain/
│   ├── entities/Itinerary.ts        ← 🔴 مفقود كلياً
│   ├── entities/ItineraryDay.ts     ← 🔴 مفقود
│   └── entities/UserPreference.ts  ← 🟡 موجود جزئياً
├── application/
│   ├── services/TripPlannerService.ts        ← 🔴 AI مطلوب
│   ├── services/RecommendationEngine.ts      ← 🔴 Core missing
│   └── services/BudgetOptimizerService.ts    ← 🔴 مطلوب
└── infrastructure/
    ├── providers/AITripPlanner.ts    ← يستخدم z-ai-web-dev-sdk ✅
    └── repositories/TrackingRepo.ts ← 🔴 سجل المشاهدات مطلوب
```

### الأحداث التي يُصدرها:
```
itinerary.created    → يُحول إلى: حجوزات في نظام التجربة (4)
recommendation.shown → يُغذي: Analytics, A/B testing
```

### الأحداث التي يستهلكها:
```
review.created       ← يُحدّث خوارزمية التوصية
booking.completed    ← يُحدّث User preferences
listing.viewed       ← يُحدّث Recommendation model
```

### النماذج الناقصة:
```prisma
model Itinerary {
  id        String    @id @default(cuid())
  userId    String
  title     String
  startDate DateTime
  endDate   DateTime
  budget    Float?
  days      ItineraryDay[]
  status    ItineraryStatus // DRAFT, CONFIRMED, COMPLETED
}

model ItineraryDay {
  id           String  @id @default(cuid())
  itineraryId  String
  dayNumber    Int
  date         DateTime
  activities   ItineraryActivity[]
  accommodation String? // Listing ID
}

model ViewTracking {
  userId     String?
  listingId  String?
  tourId     String?
  activityId String?
  duration   Int      // seconds
  source     String   // search, recommendation, direct
  viewedAt   DateTime @default(now())
}
```

---

## 3️⃣ نظام المعلومات والأدلة السياحية الذكية

### الوحدات المعمارية:
```
src/modules/guides/
├── domain/
│   └── entities/ — كل النماذج موجودة ✅ (Destination, Activity, Tour)
├── application/
│   ├── services/SemanticSearchService.ts  ← 🔴 مطلوب
│   ├── services/ContentEnrichService.ts   ← 🔴 AI مطلوب
│   └── services/AIGuideService.ts         ← 🔴 Chatbot مطلوب
└── infrastructure/
    └── providers/ — z-ai-web-dev-sdk ✅ + VLM ✅ + TTS ✅
```

### الأحداث التي يُصدرها:
```
content.enriched     → يُحدّث: Listings quality score
search.performed     → يُغذي: Recommendation Engine (2)
guide.session_ended  → يُغذي: User preferences (2)
```

### **ملاحظة مهمة:** هذا النظام بيانات غنية (80%) لكن الذكاء منخفض (20%). القيمة الأكبر هنا من السيمانتيك سيرش وليس الـ chatbot.

---

## 4️⃣ نظام الحجز والتجربة السياحية المتكاملة

### الحالة: الأقوى في المنصة (90% بنية، 85% بيانات)

```
src/modules/booking-experience/
├── ✅ Pre-booking   — بحث، مقارنة، توفر، أسعار
├── ✅ Booking       — نموذج الحجز، Escrow، تأكيد
├── ✅ Management    — إدارة الحجوزات، Disputes
├── 🔴 Chat/Comms   — Socket.io مطلوب
├── 🔴 Check-in     — QR + Timeline مطلوب
├── 🔴 Notifications — Smart reminders مطلوب
└── 🔴 Post-booking — Reviews trigger، Loyalty مطلوب
```

### الأحداث التي يُصدرها (الأهم في المنصة):
```
booking.created     → يُطلق: Escrow creation
booking.confirmed   → يُفتح: Chat channel, Document wallet
booking.completed   → يُطلق: Review request, Loyalty points, AI journey summary
escrow.released     → يُؤكد: Verified review eligibility
dispute.resolved    → يُغذي: Company reputation score
```

### الفجوات الحرجة:
```
🔴 Chat/Messaging     — Socket.io لم يُبنَ بعد
🔴 Check-in System    — QR code flow مفقود
🔴 Smart Notifications — وقت التذكير الذكي مفقود
🔴 Post-stay Journey  — Review prompt + Loyalty مفقود
```

---

## 5️⃣ نظام المجتمع والسوق القائم على المراجعة

### الحالة: قاعدة جيدة (70%) لكن الربط بالمراجعات مفقود

```
src/modules/community/
├── ✅ Forums        — Topic + Reply موجود
├── ✅ Marketplace   — Product + Cart + Order موجود
├── ✅ Verification  — UserVerification موجود
├── 🔴 Trust Score  — يحتاج بناء من المراجعات
├── 🔴 Gamification — نقاط + شارات + مستويات مفقود
└── 🔴 Community Content — Tips/Photos من المستخدمين مفقود
```

### الأحداث التي يستهلكها (كلها من نظام المراجعة):
```
review.created        ← يحسب: Trust Score
review.helpful_marked ← يكسب: Gamification points
booking.completed     ← يكسب: Loyalty points
```

### حساب Trust Score (خوارزمية مقترحة):
```typescript
TrustScore = (
  reviewsWritten * 10 +
  helpfulVotes * 5 +
  verifiedBookings * 20 +
  communityReplies * 3 +
  reportedFakes * -50   // عقوبة
) / totalDays * 30      // normalized to 30 days
```

---

## 🚦 قواعد العمل عبر الأنظمة

### قبل بناء أي ميزة ذكاء اصطناعي:
```
□ هل النظام الكلاسيكي يعمل أولاً؟ (المادة II من الدستور)
□ هل الـ fallback محدد ومُختبر؟
□ هل AI Provider مجرّد في interface قابل للتبديل؟
```

### قبل إضافة event جديد:
```
□ هل الاسم يتبع النمط: entity.action ؟ (مثل: booking.completed)
□ هل الأنظمة المستهلكة موثقة هنا؟
□ هل الـ payload محدد في TypeScript interface؟
```

### قبل تعديل خوارزمية ترتيب/توصية:
```
□ هل القرار موثق في DECISIONS.md؟
□ هل التأثير على الأنظمة الأخرى محسوب؟
□ هل هناك A/B test plan؟
```
