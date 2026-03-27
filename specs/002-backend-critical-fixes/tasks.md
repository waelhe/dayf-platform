# Tasks: Backend Critical Fixes

**Branch**: `002-backend-critical-fixes` | **Date**: 2025-03-27
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Task Summary

| Phase | Tasks | Priority | Parallel |
|-------|-------|----------|----------|
| 0 - Database | 2 | P1 | ✅ |
| 1 - Event Bus | 3 | P0 | ⚠️ جزئي |
| 2 - Escrow | 2 | P0 | ❌ متسلسل |
| 3 - Transaction | 1 | P0 | ✅ |
| 4 - Rate Limit | 1 | P2 | ✅ |
| 5 - Service Data | 1 | P2 | ✅ |

---

## Phase 0: Database Schema

### [P] Task 0.1: إنشاء جدول tours
**Priority**: P1-HIGH
**File**: Supabase SQL Editor
**Verification**:
```bash
curl "$SUPABASE_URL/rest/v1/tours?select=id&limit=1"
# Expected: [] (not error)
```

**SQL**:
```sql
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

CREATE INDEX IF NOT EXISTS idx_tours_owner ON tours(owner_id);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);
```

---

### [P] Task 0.2: إنشاء جدول order_items
**Priority**: P1-HIGH
**File**: Supabase SQL Editor
**Verification**:
```bash
curl "$SUPABASE_URL/rest/v1/order_items?select=id&limit=1"
# Expected: [] (not error)
```

**SQL**:
```sql
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
```

---

### [P] Task 0.3: إنشاء جدول user_verifications
**Priority**: P1-HIGH
**File**: Supabase SQL Editor
**Verification**:
```bash
curl "$SUPABASE_URL/rest/v1/user_verifications?select=id&limit=1"
# Expected: [] (not error)
```

**SQL**:
```sql
CREATE TABLE IF NOT EXISTS user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  document_url TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_verifications_user ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(status);
```

---

## Phase 1: Event Bus Implementation

### [P] Task 1.1: إنشاء Event Bus الأساسي
**Priority**: P0-CRITICAL
**File**: `src/core/events/index.ts`
**Dependencies**: None
**Verification**:
```typescript
import { eventBus } from '@/core/events';
// No import errors
```

**Implementation**:
```typescript
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

---

### [P] Task 1.2: تعريف أنواع الأحداث
**Priority**: P0-CRITICAL
**File**: `src/core/events/types.ts`
**Dependencies**: None
**Verification**: TypeScript compiles without errors

**Implementation**:
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
  
  // Dispute Events
  DISPUTE_RESOLVED: 'dispute.resolved',
} as const;

export interface BookingCreatedPayload {
  bookingId: string;
  guestId: string;
  hostId: string;
  escrowId: string;
}

export interface BookingCompletedPayload {
  bookingId: string;
  guestId: string;
  serviceId: string;
}
```

---

### [S] Task 1.3: ربط الحجوزات بـ Event Bus
**Priority**: P0-CRITICAL
**File**: `src/features/bookings/infrastructure/bookings-service.ts`
**Dependencies**: Task 1.1, Task 1.2
**Verification**: Integration test

**Changes**:
1. استيراد eventBus و EVENTS
2. تعديل createBooking لإنشاء Escrow تلقائياً
3. نشر حدث booking.created
4. نشر حدث booking.completed في completeBooking

---

## Phase 2: Escrow Integration

### [S] Task 2.1: إنشاء Escrow تلقائي مع الحجز
**Priority**: P0-CRITICAL
**File**: `src/features/bookings/infrastructure/bookings-service.ts`
**Dependencies**: Task 1.3
**Verification**: Create booking, check escrowId

**Implementation**: مدمج في Task 1.3

---

### [S] Task 2.2: التحقق من Escrow قبل التأكيد
**Priority**: P0-CRITICAL
**File**: `src/features/bookings/infrastructure/bookings-service.ts`
**Dependencies**: Task 2.1
**Verification**: Try to confirm booking without funded escrow

**Implementation**:
```typescript
export async function confirmBooking(bookingId: string): Promise<Booking> {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) throw new Error('الحجز غير موجود');
  
  if (!booking.escrowId) {
    throw new Error('Escrow مطلوب لتأكيد الحجز');
  }
  
  const escrow = await escrowRepo.findById(booking.escrowId);
  if (!escrow || escrow.status !== EscrowStatus.FUNDED) {
    throw new Error('Escrow يجب أن يكون ممولاً');
  }
  
  return updateBookingStatus(bookingId, BookingStatus.CONFIRMED);
}
```

---

## Phase 3: Transaction Rollback

### [P] Task 3.1: إصلاح Compensating Actions
**Priority**: P0-CRITICAL
**File**: `src/infrastructure/database/supabase-provider.ts`
**Dependencies**: None
**Verification**: Integration test with deliberate failure

**Changes**:
```typescript
private async createCompensatingAction(
  op: Omit<TransactionOperation, 'result' | 'compensatingAction'>
): Promise<() => Promise<void>> {
  switch (op.type) {
    case 'insert': {
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

## Phase 4: Rate Limiting

### [P] Task 4.1: تطبيق Rate Limiter في Middleware
**Priority**: P2-MEDIUM
**File**: `src/middleware.ts`
**Dependencies**: None
**Verification**: Send 100 requests, expect 429

---

## Phase 5: Service Data

### [P] Task 5.1: جلب بيانات Service في الحجوزات
**Priority**: P2-MEDIUM
**File**: `src/features/bookings/infrastructure/bookings-service.ts`
**Dependencies**: None
**Verification**: GET /api/bookings, verify service.title not empty

---

## Execution Order

### Parallel Group 1 (يمكن تنفيذها معاً):
- [ ] Task 0.1 - جدول tours
- [ ] Task 0.2 - جدول order_items
- [ ] Task 0.3 - جدول user_verifications
- [ ] Task 1.1 - Event Bus
- [ ] Task 1.2 - Event Types
- [ ] Task 3.1 - Rollback Fix
- [ ] Task 4.1 - Rate Limit
- [ ] Task 5.1 - Service Data

### Sequential Group (بعد Group 1):
- [ ] Task 1.3 - ربط الحجوزات بالـ Events
- [ ] Task 2.1 - Escrow تلقائي (مدمج في 1.3)
- [ ] Task 2.2 - التحقق من Escrow

---

## Progress Tracking

| Task | Status | Assignee | Completed |
|------|--------|----------|-----------|
| 0.1 | ⏳ Manual | - | - |
| 0.2 | ⏳ Manual | - | - |
| 0.3 | ⏳ Manual | - | - |
| 1.1 | ✅ DONE | Main Agent | 2025-03-27 |
| 1.2 | ✅ DONE | Main Agent | 2025-03-27 |
| 1.3 | ✅ DONE | Main Agent | 2025-03-27 |
| 2.1 | ✅ DONE | Main Agent | 2025-03-27 (مدمج في 1.3) |
| 2.2 | ✅ DONE | Main Agent | 2025-03-27 |
| 3.1 | ✅ DONE | Main Agent | 2025-03-27 |
| 4.1 | ⏳ Pending | - | - |
| 5.1 | ✅ DONE | Main Agent | 2025-03-27 |

---

## Final Verification

```bash
# 1. TypeScript
bun run lint    # Expected: 0 errors

# 2. Database
curl "$SUPABASE_URL/rest/v1/tours?select=id&limit=1"           # []
curl "$SUPABASE_URL/rest/v1/order_items?select=id&limit=1"     # []
curl "$SUPABASE_URL/rest/v1/user_verifications?select=id&limit=1" # []

# 3. Event Bus
grep -r "eventBus" src/core/events/    # Should find files

# 4. Integration Test
# Create booking → verify escrowId NOT null
# Confirm booking without funded escrow → expect error
# Complete booking → verify event published
```

---

## Constitutional Compliance After Completion

| المادة | Current | After Fix |
|--------|---------|-----------|
| I - Escrow | 🔴 غير مُمتثل | ✅ مُمتثل |
| II - AI | ⚪ غير قابل | ⚪ غير قابل |
| III - البيانات | 🟡 جزئي | ✅ مُمتثل |
| IV - المراجعات | 🟡 جزئي | ✅ مُمتثل |
| V - الأحداث | 🔴 غير مُمتثل | ✅ مُمتثل |
| VI - الأمان | 🟢 مُمتثل | ✅ مُمتثل |
