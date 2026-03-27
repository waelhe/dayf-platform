# Implementation Plan: Backend Critical Fixes

**Branch**: `002-backend-critical-fixes` | **Date**: 2025-03-27 | **Spec**: [spec.md](./spec.md)

---

## Summary

إصلاح جذري للثغرات التي تكسر مواد الدستور. الفحص كان **فعلياً** وليس نظرياً - تم التحقق من كل نقطة بالاختبار المباشر.

---

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16, Zod, Supabase
**Storage**: Supabase (PostgreSQL)
**Testing**: Integration tests + Manual API testing
**Target Platform**: Next.js Server (API Routes)

---

## Phase -1: Pre-Implementation Gates

### Constitutional Compliance Gate

| المادة | المتطلب | Status |
|--------|---------|--------|
| I - Escrow | إلزامي لكل حجز | ❌ غير مُطبق |
| V - Events | Event Bus للتواصل | ❌ غير موجود |
| VI - Security | Rate Limiting | ⚠️ موجود غير مستخدم |

### Simplicity Gate

- [x] استخدام البنية الموجودة (لا إعادة بناء)
- [x] حلول جذرية وليست ترقيعية

---

## Phase 0: Database Schema (Supabase)

### Task 0.1: إنشاء الجداول المفقودة

```sql
-- tours table
CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'multi_day',
  duration_days INT DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'SYP',
  max_participants INT DEFAULT 10,
  destination_ids TEXT[],
  itinerary JSONB,
  images TEXT[],
  cover_image TEXT,
  status TEXT DEFAULT 'draft',
  owner_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_verifications table
CREATE TABLE IF NOT EXISTS user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'email', 'phone', 'identity'
  status TEXT DEFAULT 'pending',
  document_url TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tours_owner ON tours(owner_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_user ON user_verifications(user_id);
```

**Verification**:
```bash
curl "$SUPABASE_URL/rest/v1/tours?select=id&limit=1" -H "apikey: $ANON_KEY"
# Expected: [] (not error)
```

---

## Phase 1: Event Bus Implementation (P0)

### Task 1.1: إنشاء Event Bus الأساسي

**File**: `src/core/events/index.ts`

```typescript
// Event Bus بسيط وفعال
type EventHandler<T = unknown> = (payload: T) => Promise<void> | void;

interface EventBus {
  publish<T>(event: string, payload: T): Promise<void>;
  subscribe<T>(event: string, handler: EventHandler<T>): () => void;
}

class SimpleEventBus implements EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  async publish<T>(event: string, payload: T): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    
    await Promise.all(
      Array.from(handlers).map(h => h(payload))
    );
  }

  subscribe<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    
    return () => this.handlers.get(event)?.delete(handler);
  }
}

export const eventBus = new SimpleEventBus();
```

### Task 1.2: تعريف الأحداث المطلوبة

**File**: `src/core/events/types.ts`

```typescript
export const EVENTS = {
  // Booking Events
  BOOKING_CREATED: 'booking.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_COMPLETED: 'booking.completed',
  BOOKING_CANCELLED: 'booking.cancelled',
  
  // Escrow Events
  ESCROW_CREATED: 'escrow.created',
  ESCROW_FUNDED: 'escrow.funded',
  ESCROW_RELEASED: 'escrow.released',
  ESCROW_REFUNDED: 'escrow.refunded',
  
  // Review Events
  REVIEW_CREATED: 'review.created',
  REVIEW_HELPFUL_VOTED: 'review.helpful_voted',
  
  // Dispute Events
  DISPUTE_RESOLVED: 'dispute.resolved',
} as const;
```

### Task 1.3: ربط الحجوزات بـ Event Bus

**File**: `src/features/bookings/infrastructure/bookings-service.ts`

```typescript
import { eventBus } from '@/core/events';
import { EVENTS } from '@/core/events/types';

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const bookingRepo = getBookingRepository();
  const escrowService = getEscrowService();
  
  // 1. إنشاء الحجز
  const booking = await bookingRepo.create({
    guestId: input.guestId,
    hostId: input.hostId,
    serviceId: input.serviceId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    totalPrice: input.totalPrice,
    status: BookingStatus.PENDING,
    escrowId: null,
  });
  
  // 2. إنشاء Escrow تلقائياً (المادة I)
  const escrow = await escrowService.createEscrow({
    buyerId: input.guestId,
    providerId: input.hostId,
    amount: input.totalPrice,
    referenceType: 'BOOKING',
    referenceId: booking.id,
  });
  
  // 3. تحديث الحجز بـ escrowId
  await bookingRepo.update(booking.id, { escrowId: escrow.id });
  
  // 4. نشر حدث (المادة V)
  await eventBus.publish(EVENTS.BOOKING_CREATED, {
    bookingId: booking.id,
    guestId: input.guestId,
    hostId: input.hostId,
    escrowId: escrow.id,
  });
  
  return { ...booking, escrowId: escrow.id };
}

export async function completeBooking(bookingId: string): Promise<Booking> {
  const booking = await updateBookingStatus(bookingId, BookingStatus.COMPLETED);
  
  // نشر حدث الاكتمال
  await eventBus.publish(EVENTS.BOOKING_COMPLETED, {
    bookingId,
    guestId: booking.guestId,
    serviceId: booking.serviceId,
  });
  
  return booking;
}
```

---

## Phase 2: Escrow Integration (P0)

### Task 2.1: ربط Escrow تلقائي بالحجز

**Already covered in Task 1.3**

### Task 2.2: التحقق من Escrow قبل تأكيد الحجز

**File**: `src/features/bookings/infrastructure/bookings-service.ts`

```typescript
export async function confirmBooking(bookingId: string): Promise<Booking> {
  const bookingRepo = getBookingRepository();
  const escrowRepo = getEscrowRepository();
  
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) throw new Error('الحجز غير موجود');
  
  // التحقق من وجود Escrow ممول (المادة I)
  if (!booking.escrowId) {
    throw new Error('Escrow مطلوب لتأكيد الحجز');
  }
  
  const escrow = await escrowRepo.findById(booking.escrowId);
  if (!escrow || escrow.status !== EscrowStatus.FUNDED) {
    throw new Error('Escrow يجب أن يكون ممولاً لتأكيد الحجز');
  }
  
  return updateBookingStatus(bookingId, BookingStatus.CONFIRMED);
}
```

---

## Phase 3: Transaction Rollback Fix (P0)

### Task 3.1: إصلاح Compensating Actions

**File**: `src/infrastructure/database/supabase-provider.ts`

```typescript
private async createCompensatingAction(
  op: Omit<TransactionOperation, 'result' | 'compensatingAction'>
): Promise<() => Promise<void>> {
  switch (op.type) {
    case 'insert': {
      // Compensating: delete the inserted record
      return async () => {
        if (op.result?.id) {
          await this.supabase
            .from(op.table)
            .delete()
            .eq('id', op.result.id);
        }
      };
    }
    case 'update': {
      // Compensating: restore original values
      return async () => {
        if (op.originalData) {
          await this.supabase
            .from(op.table)
            .update(op.originalData)
            .eq('id', op.filters?.id);
        }
      };
    }
    case 'delete': {
      // Compensating: re-insert the deleted record
      return async () => {
        if (op.originalData) {
          await this.supabase
            .from(op.table)
            .insert(op.originalData);
        }
      };
    }
    default:
      return async () => {};
  }
}
```

---

## Phase 4: Rate Limiting Integration (P2)

### Task 4.1: تطبيق Rate Limiter في Middleware

**File**: `src/middleware.ts`

```typescript
import { rateLimiters } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Apply rate limiting
  if (path.startsWith('/api/')) {
    const ip = request.ip ?? 'unknown';
    const limiter = path.includes('/auth/') 
      ? rateLimiters.auth 
      : rateLimiters.api;
    
    const result = await limiter.check(ip);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  }
  
  // ... rest of middleware
}
```

---

## Phase 5: Service Data in Bookings (P2)

### Task 5.1: جلب بيانات Service في الحجوزات

**File**: `src/features/bookings/infrastructure/bookings-service.ts`

```typescript
export async function getUserBookings(guestId: string): Promise<BookingWithService[]> {
  const bookingRepo = getBookingRepository();
  const serviceRepo = getServiceRepository();
  
  const bookings = await bookingRepo.findByGuest(guestId);
  
  // جلب بيانات الخدمات
  const serviceIds = [...new Set(bookings.map(b => b.serviceId))];
  const services = await Promise.all(
    serviceIds.map(id => serviceRepo.findById(id))
  );
  
  const serviceMap = new Map(services.map(s => [s?.id, s]));
  
  return bookings.map(booking => {
    const service = serviceMap.get(booking.serviceId);
    return {
      ...booking,
      service: {
        id: booking.serviceId,
        title: service?.title ?? 'خدمة غير متوفرة',
        images: service?.images ?? '',
        location: service?.location ?? '',
        price: service?.price ?? 0,
      },
    };
  });
}
```

---

## Project Structure

```text
src/
├── core/
│   ├── events/
│   │   ├── index.ts          # Task 1.1 - Event Bus
│   │   └── types.ts          # Task 1.2 - Event Types
│   └── types/
│       └── enums.ts          # موجود
├── features/
│   ├── bookings/
│   │   └── infrastructure/
│   │       └── bookings-service.ts  # Task 1.3, 2.2, 5.1
│   └── escrow/
│       └── infrastructure/
│           └── escrow-service.ts    # موجود
├── infrastructure/
│   └── database/
│       └── supabase-provider.ts     # Task 3.1
└── middleware.ts                    # Task 4.1
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Event Bus | المادة V تطلب فصل الوحدات | Direct imports = coupling |
| Escrow Integration | المادة I تطلب Escrow إلزامي | Optional Escrow = no protection |

---

## Verification Checklist

### After Each Phase:

```bash
# Phase 0: Database
curl "$SUPABASE_URL/rest/v1/tours?select=id&limit=1"

# Phase 1: Event Bus
grep -r "eventBus" src/core/events/

# Phase 2: Escrow
curl -X POST /api/bookings (verify escrowId)

# Phase 3: Transaction
# Integration test with deliberate failure

# Phase 4: Rate Limit
curl -X GET /api/test (100 times, expect 429)

# Phase 5: Service Data
curl /api/bookings (verify service.title not empty)
```

### Final Verification:

```bash
bun run lint    # 0 errors
bun run build   # successful
```

---

## Dependencies Between Tasks

```
Task 0.1 (Database) ─────────────────────────────────────┐
                                                          │
Task 1.1 (Event Bus) ──┬── Task 1.3 (Booking Events) ────┤
                       │                                  │
Task 1.2 (Event Types)┘                                  │
                                                          │
Task 2.1 (Escrow Link) ── Task 2.2 (Escrow Check) ───────┤
                                                          │
Task 3.1 (Rollback Fix) ─────────────────────────────────┤
                                                          │
Task 4.1 (Rate Limit) ───────────────────────────────────┤
                                                          │
Task 5.1 (Service Data) ──────────────────────────────────┘
                                                          │
                                                    ┌─────┴─────┐
                                                    │  Verify   │
                                                    └───────────┘
```

**Parallel Tasks**: 0.1, 1.1, 1.2, 3.1, 4.1 يمكن تنفيذها بالتوازي
**Sequential Tasks**: 1.1/1.2 → 1.3 → 2.2
