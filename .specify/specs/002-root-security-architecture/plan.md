# Implementation Plan: Root Security Architecture

**Branch**: `002-root-security-architecture` | **Date**: 2025-03-27 | **Spec**: [spec.md](./spec.md)

## Summary

تنفيذ بنية أمنية جذرية تحمي التطبيق تلقائياً بدون الحاجة لإضافة كود حماية لكل route. الحلول ترتكز على مبدأ "Security by Default" من Constitution المادة VI.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 16
**Primary Dependencies**: Zod, jose (JWT), Supabase client
**Storage**: Supabase PostgreSQL
**Testing**: ESLint, TypeScript compiler, manual API testing
**Target Platform**: Web (Next.js App Router)
**Project Type**: Full-stack web application
**Performance Goals**: لا تأثير على الأداء الحالي
**Constraints**: التوافق مع الكود الموجود، لا breaking changes

## Constitution Check

| المادة | المتطلب | الحالة |
|--------|---------|--------|
| I | Escrow مطلوب | ✅ محمي بالفعل |
| VI | Auth middleware | ✅ سيُطبق جذرياً |
| VI | Zod validation | ✅ سيُطبق جذرياً |
| VI | Deny by Default | ✅ المبدأ الأساسي |

## Project Structure

### Documentation (this feature)

```text
.specify/specs/002-root-security-architecture/
├── spec.md              # المواصفات
├── plan.md              # هذا الملف
└── tasks.md             # المهام
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── auth/
│   │   ├── middleware.ts           # Next.js middleware موحد
│   │   ├── route-protection.ts     # تعريف routes المحمية
│   │   ├── resource-ownership.ts   # نظام ملكية الموارد
│   │   └── index.ts
│   ├── validation/
│   │   ├── validation-middleware.ts # Validation middleware موحد
│   │   ├── default-schemas.ts       # Schemas افتراضية
│   │   └── index.ts
│   └── types/
│       ├── entities.ts              # أنواع موحدة
│       └── api.ts                   # أنواع API
│
├── infrastructure/
│   └── repositories/
│       └── base.repository.ts       # تحديث مع DataLoader
│
└── app/
    └── api/
        └── middleware.ts            # Next.js middleware entry point
```

## Implementation Phases

### Phase 1: Route Protection System (3 hours)

**الهدف**: حماية كل routes تلقائياً بدون كود يدوي

**المخرجات**:
1. `src/core/auth/route-protection.ts` - تعريف routes المحمية والعامة
2. `src/app/middleware.ts` - Next.js middleware للتحقق من Auth
3. تحديث `src/lib/auth/middleware.ts` للتوافق

**الكود المطلوب**:

```typescript
// src/core/auth/route-protection.ts
export const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/otp',
  '/api/destinations',      // GET فقط
  '/api/activities',        // GET فقط
  '/api/services',          // GET فقط
  '/api/reviews',           // GET فقط
] as const;

export const ADMIN_ROUTES = [
  '/api/admin',
] as const;

export const OWNER_ROUTES = [
  '/api/bookings/:id',
  '/api/reviews/:id',
  '/api/escrow/:id',
] as const;

export function getRouteProtection(pathname: string): RouteProtection {
  // تحديد مستوى الحماية للـ route
}
```

```typescript
// src/app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRouteProtection, verifyToken } from '@/core/auth';

export async function middleware(request: NextRequest) {
  const protection = getRouteProtection(request.nextUrl.pathname);
  
  if (protection.level === 'public') {
    return NextResponse.next();
  }
  
  const token = request.cookies.get('auth_token')?.value;
  const user = await verifyToken(token);
  
  if (!user && protection.level !== 'public') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // إضافة user للـ request
  request.headers.set('x-user-id', user.id);
  request.headers.set('x-user-role', user.role);
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

### Phase 2: Resource Ownership Layer (2 hours)

**الهدف**: التحقق التلقائي من ملكية الموارد

**المخرجات**:
1. `src/core/auth/resource-ownership.ts` - تعريف ملكية الموارد
2. تحديث routes الموجودة لاستخدام النظام

**الكود المطلوب**:

```typescript
// src/core/auth/resource-ownership.ts
export interface ResourceConfig {
  entity: string;
  ownerField: string;
  adminOverride: boolean;
}

export const RESOURCE_CONFIGS: Record<string, ResourceConfig> = {
  bookings: { entity: 'bookings', ownerField: 'user_id', adminOverride: true },
  reviews: { entity: 'reviews', ownerField: 'author_id', adminOverride: true },
  escrows: { entity: 'escrows', ownerField: 'buyer_id', adminOverride: true },
  services: { entity: 'services', ownerField: 'host_id', adminOverride: true },
  companies: { entity: 'companies', ownerField: 'owner_id', adminOverride: true },
};

export async function verifyOwnership(
  resource: string,
  resourceId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  const config = RESOURCE_CONFIGS[resource];
  if (!config) return false;
  
  if (config.adminOverride && userRole === 'admin') return true;
  
  const repo = getRepository(config.entity);
  const record = await repo.findById(resourceId);
  
  return record?.[config.ownerField] === userId;
}
```

---

### Phase 3: DataLoader Pattern (4 hours)

**الهدف**: منع N+1 queries على مستوى البنية

**المخرجات**:
1. تحديث `base.repository.ts` مع DataLoader
2. إنشاء DataLoader registry

**الكود المطلوب**:

```typescript
// src/infrastructure/repositories/base.repository.ts
import DataLoader from 'dataloader';

export class BaseRepository<T> {
  protected loader: DataLoader<string, T>;
  
  constructor(tableName: string, provider: IDatabaseProvider) {
    this.loader = new DataLoader(async (ids: readonly string[]) => {
      const results = await provider.query(
        `SELECT * FROM ${tableName} WHERE id = ANY($1)`,
        [ids]
      );
      const map = new Map(results.map(r => [r.id, r]));
      return ids.map(id => map.get(id) || null);
    });
  }
  
  async findById(id: string): Promise<T | null> {
    return this.loader.load(id);
  }
  
  async findByIds(ids: string[]): Promise<(T | null)[]> {
    return this.loader.loadMany(ids);
  }
}
```

---

### Phase 4: Validation Middleware (2 hours)

**الهدف**: تطبيق validation تلقائياً على كل route

**المخرجات**:
1. `src/core/validation/validation-middleware.ts`
2. `src/core/validation/default-schemas.ts`

**الكود المطلوب**:

```typescript
// src/core/validation/validation-middleware.ts
export function withValidation<T extends ZodSchema>(
  schema: T,
  handler: (req: NextRequest, data: z.infer<T>) => Promise<Response>
): (req: NextRequest) => Promise<Response> {
  return async (req: NextRequest) => {
    const body = await req.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }
    
    return handler(req, result.data);
  };
}

// Default schemas للأنواع الشائعة
export const DEFAULT_SCHEMAS = {
  uuid: z.string().uuid(),
  pagination: z.object({ page: z.coerce.number().int().min(1).default(1) }),
  idParam: z.object({ id: z.string().min(1) }),
};
```

---

### Phase 5: TypeScript Types Unification (3 hours)

**الهدف**: أنواع موحدة ومتسقة

**المخرجات**:
1. `src/core/types/entities.ts` - أنواع موحدة للـ entities
2. `src/core/types/api.ts` - أنواع موحدة للـ API responses

**الكود المطلوب**:

```typescript
// src/core/types/entities.ts
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Profile extends BaseEntity {
  email: string;
  full_name: string;
  role: UserRole;
}

// تحويل تلقائي للـ JSON
export function toJson<T extends BaseEntity>(entity: T): JsonEntity<T> {
  return {
    ...entity,
    created_at: entity.created_at.toISOString(),
    updated_at: entity.updated_at.toISOString(),
    deleted_at: entity.deleted_at?.toISOString() || null,
  };
}
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| DataLoader في BaseRepository | منع N+1 جذرياً | تحسين كل query بشكل منفرد ترقيعي |
| Route Protection Config | مركزية الحماية | requireAuth في كل route ترقيعي |
| Resource Ownership Layer | حماية IDOR تلقائية | التحقق اليدوي في كل route ترقيعي |

## Dependencies

- `dataloader` - لـ batching queries
- `zod` - للـ validation (موجود)
- `jose` - للـ JWT verification (موجود)

## Testing Strategy

1. **Unit Tests**: اختبار كل مكون بشكل منفصل
2. **Integration Tests**: اختبار middleware مع routes حقيقية
3. **Security Tests**: محاولة الوصول بدون صلاحيات
4. **Performance Tests**: قياس تأثير DataLoader

## Rollback Plan

- كل phase مستقل يمكن تراجع عنه
- الكود القديم يبقى للرجوع إليه
- Feature flags للتحكم في تفعيل كل phase
