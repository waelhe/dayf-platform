## 🏗️ **خطة الترحيل المعمارية الصحيحة**

### **تقييم معماري قبل البدء:**

| البعد | الوضع الحالي | الوضع المطلوب |
|-------|--------------|---------------|
| **البنية** | Coupled - خدمات مربوطة مباشرة بـ Prisma | Decoupled - طبقة تجريد |
| **قابلية التبديل** | ❌ صعب - 29 ملفاً مرتبط | ✅ سهل - via interfaces |
| **الصيانة** | ❌ تغيير DB = إعادة كتابة كاملة | ✅ تغيير implementation فقط |
| **الاختبار** | ❌ لا يمكن mock | ✅ Easy to mock |

---

## 📐 **المعمارية المقترحة:**

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  (Services / Features - لا تعرف شيئاً عن DB)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                             │
│  (Interfaces / Types / Business Rules)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  IRepository<T>  │  IUserRepository  │  ICompany... │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                       │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │ SupabaseRepo     │    │ Future: MongoRepo│              │
│  │ (Implementation) │    │ (Implementation) │              │
│  └──────────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 **خطة التنفيذ المعمارية:**

### **المرحلة 0: التحضير والبنية التحتية**
```
src/
├── core/
│   ├── database/
│   │   ├── interface.ts         # IRepository, IDatabaseProvider
│   │   ├── provider.ts          # Database provider factory
│   │   └── types.ts             # Database types
│   └── repositories/
│       └── base.repository.ts   # Abstract base repository
```

### **المرحلة 1: إنشاء طبقة التجريد**

#### 1.1 Repository Interface
```typescript
// core/database/interface.ts
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filter?: FilterQuery): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}
```

#### 1.2 Supabase Repository Implementation
```typescript
// infrastructure/repositories/supabase.repository.ts
export class SupabaseRepository<T> implements IRepository<T> {
  constructor(
    protected client: SupabaseClient,
    protected tableName: string
  ) {}
  
  // Implementation of all methods
}
```

### **المرحلة 2: ترحيل الميزات (Feature by Feature)**

لكل ميزة:
```
features/
├── companies/
│   ├── domain/
│   │   ├── types.ts           # Company types
│   │   └── interfaces.ts      # ICompanyRepository
│   ├── infrastructure/
│   │   └── company.repository.ts  # Supabase implementation
│   ├── application/
│   │   └── company.service.ts     # Business logic
│   └── index.ts
```

### **المرحلة 3: الترحيل التدريجي**

| الدفعة | الميزات | الملفات | الأولوية |
|--------|---------|---------|----------|
| **P0** | Auth (core) | 4 | عالية - أساسية |
| **P1** | Companies | 2 | عالية - أعمال |
| **P2** | Bookings, Orders | 4 | عالية - أعمال |
| **P3** | Reviews, Disputes | 3 | متوسطة |
| **P4** | Tourism, Community | 3 | متوسطة |
| **P5** | API Routes | 14 | متوسطة |
| **P6** | Cleanup | - | منخفضة |

---

## 🔄 **مبدأ Dependency Inversion:**

### **قبل (خاطئ):**
```typescript
// ❌ Service مربوط مباشرة بـ Prisma
class CompanyService {
  async getCompany(id: string) {
    return db.company.findUnique({ where: { id } });
  }
}
```

### **بعد (صحيح):**
```typescript
// ✅ Service يعتمد على Interface
class CompanyService {
  constructor(private repository: ICompanyRepository) {}
  
  async getCompany(id: string) {
    return this.repository.findById(id);
  }
}

// Infrastructure layer provides implementation
class SupabaseCompanyRepository implements ICompanyRepository {
  async findById(id: string) {
    return supabase.from('companies').select('*').eq('id', id).single();
  }
}
```

---

## 📊 **تقييم المخاطر والحلول:**

| المخاطر | التأثير | الحل |
|---------|---------|------|
| وقت أطول للتنفيذ | متوسط | البنية ستوفر وقتاً هائلاً مستقبلاً |
| تغيير كثير من الملفات | عالي | ترحيل تدريجي دفعة بدفعة |
| أخطاء أثناء الترحيل | متوسط | اختبار كل دفعة قبل الانتقال |
| منحنى تعلم للفريق | منخفض | الكود واضح وموثق |

---

## 📁 **هيكل الملفات النهائي:**

```
src/
├── core/
│   ├── database/
│   │   ├── interface.ts           # IRepository, IDatabaseProvider
│   │   ├── provider.ts            # Database provider factory
│   │   └── types.ts               # Query types
│   └── types/                     # Shared domain types
│
├── infrastructure/
│   ├── database/
│   │   ├── supabase-client.ts     # Supabase client
│   │   └── supabase-provider.ts   # Supabase provider
│   └── repositories/
│       ├── base.repository.ts     # Base implementation
│       └── supabase.repository.ts # Generic Supabase repo
│
├── features/
│   ├── auth/
│   │   ├── domain/
│   │   │   ├── types.ts
│   │   │   └── interfaces.ts
│   │   ├── infrastructure/
│   │   │   ├── user.repository.ts
│   │   │   └── session.repository.ts
│   │   └── application/
│   │       └── auth.service.ts
│   │
│   ├── companies/
│   │   ├── domain/
│   │   ├── infrastructure/
│   │   └── application/
│   │
│   └── [other features]/
│
└── lib/
    └── di/                        # Dependency Injection container
```

---

## ⏱️ **الجدول الزمني المقترح:**

| المرحلة | المدة | المحتوى |
|---------|-------|---------|
| **0** | 30 دقيقة | إنشاء طبقة التجريد الأساسية |
| **1** | ساعة | Auth feature |
| **2** | ساعة | Companies feature |
| **3** | ساعة | Bookings + Orders |
| **4** | 30 دقيقة | Reviews + Disputes |
| **5** | 30 دقيقة | Tourism + Community |
| **6** | ساعة | API Routes |
| **7** | 30 دقيقة | Cleanup + Tests |

---

## ✅ **نقاط التوسع المستقبلية:**

1. **إضافة MongoDB:** فقط `MongoRepository` جديد
2. **إضافة Redis Cache:** Decorator pattern على Repository
3. **إضافة Logging:** Decorator pattern
4. **اختبارات الوحدة:** Mock repositories بسهولة
5. **Multi-tenancy:** عبر DatabaseProvider

---

## 🤔 **هل توافق على هذه المعمارية؟**

**الخيارات:**
1. **موافق** - نبدأ بالمرحلة 0 (إنشاء طبقة التجريد)
2. **تعديل** - اقترح تعديلات على المعمارية
3. **مبسط** - نسخة أبسط بدون Repository pattern كامل