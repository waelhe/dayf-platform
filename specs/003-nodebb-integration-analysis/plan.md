# خطة التنفيذ: تكامل NodeBB

**Branch**: `003-nodebb-integration`
**Date**: 2025-03-28
**Spec**: [spec.md](./spec.md)

---

## Summary

خطة تنفيذ جذريية لتكامل NodeBB مع نظام ضيف، تبدأ بإصلاح الثغرات الحرجة ثم بناء طبقة SSO ثم تثبيت NodeBB.

---

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16, Zod, Supabase
**New Dependencies**: MongoDB 6.0+, Redis 7.0+, NodeBB 3.x
**Storage**: Supabase (PostgreSQL) + MongoDB + Redis
**Target Platform**: Next.js Server (API Routes) + NodeBB Server

---

## Phase -1: Pre-Implementation Gates

### Constitutional Compliance Gate

| المادة | المتطلب | Status |
|--------|---------|--------|
| I - Escrow | إلزامي لكل حجز | ❌ غير مُطبق |
| V - Events | Event Bus للتواصل | ❌ غير موجود |
| VI - Security | Auth middleware | ⚠️ جزئي |

### Dependencies Gate

- [ ] Phase 0 من specs/002 مكتمل
- [ ] MongoDB instance جاهز
- [ ] Redis instance جاهز
- [ ] JWT_SECRET متفق عليه

---

## Phase 0: إصلاح الثغرات الحرجة (من specs/002)

### Task 0.1: توحيد Session Token

**File**: `src/features/auth/infrastructure/session-service.ts`

```typescript
// توحيد اسم cookie في كل مكان
export const TOKEN_COOKIE_NAME = 'auth_token';

// تحديث جميع routes لاستخدام نفس الاسم
// البحث عن 'session_token' واستبداله بـ 'auth_token'
```

**Verification**:
```bash
grep -r "session_token" src/ --include="*.ts"
# Expected: 0 results
```

---

### Task 0.2: إنشاء Event Bus

**File**: `src/core/events/index.ts`

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

**File**: `src/core/events/types.ts`

```typescript
export const EVENTS = {
  // Auth Events
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',
  USER_UPDATED: 'user.updated',
  
  // Booking Events
  BOOKING_CREATED: 'booking.created',
  BOOKING_COMPLETED: 'booking.completed',
  
  // SSO Events
  SSO_SYNC_REQUIRED: 'sso.sync_required',
} as const;
```

---

### Task 0.3: إصلاح Transaction Rollback

**File**: `src/infrastructure/database/supabase-provider.ts`

```typescript
private async createCompensatingAction(
  op: Omit<TransactionOperation, 'result' | 'compensatingAction'>
): Promise<() => Promise<void>> {
  switch (op.type) {
    case 'insert': {
      return async () => {
        if (op.result?.id) {
          const { error } = await this.supabase
            .from(op.table)
            .delete()
            .eq('id', op.result.id);
          if (error) {
            console.error(`Rollback failed for ${op.table}:`, error);
          }
        }
      };
    }
    case 'update': {
      return async () => {
        if (op.originalData && op.filters?.id) {
          const { error } = await this.supabase
            .from(op.table)
            .update(op.originalData)
            .eq('id', op.filters.id);
          if (error) {
            console.error(`Rollback failed for ${op.table}:`, error);
          }
        }
      };
    }
    case 'delete': {
      return async () => {
        if (op.originalData) {
          const { error } = await this.supabase
            .from(op.table)
            .insert(op.originalData);
          if (error) {
            console.error(`Rollback failed for ${op.table}:`, error);
          }
        }
      };
    }
    default:
      return async () => {};
  }
}
```

---

### Task 0.4: Escrow إلزامي في الحجوزات

**File**: `src/features/bookings/infrastructure/bookings-service.ts`

```typescript
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const bookingRepo = getBookingRepository();
  const escrowService = getEscrowService();
  
  // 1. إنشاء الحجز
  const booking = await bookingRepo.create({
    ...input,
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
  
  // 4. نشر حدث
  await eventBus.publish(EVENTS.BOOKING_CREATED, {
    bookingId: booking.id,
    escrowId: escrow.id,
  });
  
  return { ...booking, escrowId: escrow.id };
}
```

---

## Phase 1: البنية التحتية

### Task 1.1: تثبيت MongoDB

```bash
# Option A: Local MongoDB
sudo apt-get install mongodb-org

# Option B: Docker
docker run -d --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:6.0

# Option C: MongoDB Atlas (Cloud)
# Create free cluster at mongodb.com
```

**Environment Variable**:
```env
DATABASE_URL_MONGO=mongodb://admin:password@localhost:27017/nodebb?authSource=admin
```

---

### Task 1.2: تثبيت Redis

```bash
# Option A: Local Redis
sudo apt-get install redis-server

# Option B: Docker
docker run -d --name redis \
  -p 6379:6379 \
  redis:7.0-alpine

# Option C: Redis Cloud (Free tier)
# Create at redis.com
```

**Environment Variable**:
```env
REDIS_URL=redis://localhost:6379
```

---

### Task 1.3: تحديث Caddyfile

```caddyfile
# Caddyfile - إضافة NodeBB
{
    email admin@daif.com
}

# ضيف الرئيسي
localhost {
    reverse_proxy localhost:3000
}

# NodeBB Forum
forum.localhost {
    reverse_proxy localhost:4567
}
```

---

## Phase 2: SSO Integration Layer

### Task 2.1: SSO Endpoint

**File**: `src/app/api/auth/sso/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/middleware';
import { generateNodeBBToken } from '@/lib/nodebb-auth';
import { eventBus } from '@/core/events';
import { EVENTS } from '@/core/events/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصادق' },
        { status: 401 }
      );
    }
    
    // إنشاء JWT token للـ NodeBB
    const nodebbToken = await generateNodeBBToken(user);
    
    // نشر حدث للمزامنة
    await eventBus.publish(EVENTS.SSO_SYNC_REQUIRED, {
      userId: user.id,
      action: 'login',
    });
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      token: nodebbToken,
    });
  } catch (error) {
    console.error('SSO error:', error);
    return NextResponse.json(
      { error: 'خطأ في SSO' },
      { status: 500 }
    );
  }
}
```

---

### Task 2.2: JWT Token Generation

**File**: `src/lib/nodebb-auth.ts`

```typescript
import jwt from 'jsonwebtoken';
import { AuthUser } from '@/lib/auth/middleware';

const JWT_SECRET = process.env.JWT_SECRET!;
const NODEBB_URL = process.env.NODEBB_URL || 'http://localhost:4567';

export interface NodeBBTokenPayload {
  userId: string;
  email: string | null;
  displayName: string;
  role: string;
  iat: number;
  exp: number;
}

export async function generateNodeBBToken(user: AuthUser): Promise<string> {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
    JWT_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'daif',
      audience: 'nodebb',
    }
  );
}

export function verifyNodeBBToken(token: string): NodeBBTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'daif',
      audience: 'nodebb',
    }) as NodeBBTokenPayload;
  } catch {
    return null;
  }
}

export function getNodeBBUrl(): string {
  return NODEBB_URL;
}
```

---

### Task 2.3: Webhook Endpoint

**File**: `src/app/api/webhooks/user/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { eventBus } from '@/core/events';
import { EVENTS } from '@/core/events/types';

// استقبال webhooks من NodeBB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, data } = body;
    
    // التحقق من الـ signature (للأمان)
    const signature = request.headers.get('x-webhook-signature');
    // TODO: verify signature
    
    switch (action) {
      case 'user.updated':
        // مزامنة التحديثات مع Supabase
        await eventBus.publish(EVENTS.USER_UPDATED, {
          userId,
          data,
        });
        break;
        
      case 'user.deleted':
        // معالجة حذف المستخدم
        // TODO: soft delete in Supabase
        break;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'خطأ في Webhook' },
      { status: 500 }
    );
  }
}
```

---

### Task 2.4: NodeBB SSO Plugin

**File**: `nodebb-plugin-sso-daif/library.js`

```javascript
'use strict';

const User = require.main.require('./src/user');
const Groups = require.main.require('./src/groups');
const jwt = require('jsonwebtoken');

const DaifSSO = {
  // التحقق من JWT token من ضيف
  parseToken: async function(token) {
    const JWT_SECRET = process.env.JWT_SECRET;
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'daif',
      audience: 'nodebb',
    });
  },

  // العثور على المستخدم أو إنشاؤه
  findOrCreateUser: async function(userData) {
    let uid = await User.getUidByEmail(userData.email);
    
    if (!uid) {
      uid = await User.create({
        username: userData.displayName || `user_${userData.userId}`,
        email: userData.email,
        picture: userData.avatar,
      });
    }
    
    return uid;
  },

  // تسجيل الدخول عبر SSO
  login: async function(req, res) {
    try {
      const token = req.query.token;
      const userData = await this.parseToken(token);
      const uid = await this.findOrCreateUser(userData);
      
      req.login({ uid: uid }, function() {
        res.redirect('/');
      });
    } catch (error) {
      console.error('SSO login error:', error);
      res.redirect('/login?error=sso_failed');
    }
  },

  // تسجيل الخروج
  logout: async function(req, res) {
    req.logout();
    res.redirect('/login');
  },
};

module.exports = DaifSSO;
```

---

## Phase 3: NodeBB Installation

### Task 3.1: Clone and Setup

```bash
# Clone NodeBB
cd /home/z/my-project
git clone https://github.com/NodeBB/NodeBB.git nodebb
cd nodebb

# Install dependencies
npm install

# Setup (interactive)
./nodebb setup
# - Database: MongoDB
# - Database host: localhost:27017
# - Database name: nodebb
# - Redis host: localhost:6379
```

---

### Task 3.2: Arabic Language Pack

```bash
# Install Arabic language
./nodebb install nodebb-plugin-ar
# Or manually:
# Download from https://github.com/NodeBB/nodebb-plugin-ar
```

---

### Task 3.3: Install SSO Plugin

```bash
# Copy SSO plugin
mkdir -p node_modules/nodebb-plugin-sso-daif
cp -r /path/to/sso-plugin/* node_modules/nodebb-plugin-sso-daif/

# Activate in NodeBB admin panel
# Or via CLI:
./nodebb activate nodebb-plugin-sso-daif
```

---

### Task 3.4: Configure SSO

**File**: `nodebb/config.json`

```json
{
  "url": "http://forum.localhost",
  "database": "mongo",
  "mongo": {
    "host": "localhost",
    "port": "27017",
    "username": "admin",
    "password": "password",
    "database": "nodebb"
  },
  "redis": {
    "host": "localhost",
    "port": "6379"
  },
  "sso:daif": {
    "enabled": true,
    "url": "http://localhost:3000/api/auth/sso",
    "secret": "JWT_SECRET_HERE"
  }
}
```

---

## Phase 4: Testing

### Task 4.1: Test SSO Flow

```bash
# 1. Login in Daif
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+963912345678","password":"password"}'

# 2. Get SSO token
curl http://localhost:3000/api/auth/sso \
  -H "Cookie: auth_token=TOKEN"

# 3. Verify NodeBB login
curl http://forum.localhost/api/user \
  -H "Cookie: express.sid=SESSION"
```

---

### Task 4.2: Test Event Bus

```bash
# Publish test event
curl -X POST http://localhost:3000/api/test/events \
  -H "Content-Type: application/json" \
  -d '{"event":"user.updated","payload":{"userId":"123"}}'
```

---

## Project Structure After Integration

```
/home/z/my-project/
├── src/
│   ├── core/
│   │   ├── events/
│   │   │   ├── index.ts          # Event Bus
│   │   │   └── types.ts          # Event Types
│   │   └── types/
│   │       └── enums.ts          # Shared Enums
│   ├── features/
│   │   ├── auth/
│   │   │   └── infrastructure/
│   │   │       └── session-service.ts  # Unified token
│   │   └── bookings/
│   │       └── infrastructure/
│   │           └── bookings-service.ts # Escrow mandatory
│   ├── lib/
│   │   ├── auth/
│   │   │   └── middleware.ts     # Auth utilities
│   │   └── nodebb-auth.ts        # JWT for NodeBB
│   ├── app/api/
│   │   ├── auth/
│   │   │   └── sso/
│   │   │       └── route.ts      # SSO endpoint
│   │   └── webhooks/
│   │       └── user/
│   │           └── route.ts      # Webhooks
│   └── infrastructure/
│       └── database/
│           └── supabase-provider.ts  # Fixed rollback
├── nodebb/                       # NodeBB installation
│   ├── config.json
│   └── node_modules/
│       └── nodebb-plugin-sso-daif/  # SSO plugin
├── mini-services/
│   ├── mongodb/                  # MongoDB service
│   └── redis/                    # Redis service
└── specs/
    ├── 002-backend-critical-fixes/
    └── 003-nodebb-integration-analysis/
```

---

## Environment Variables

```env
# .env.local

# Supabase (Existing)
NEXT_PUBLIC_SUPABASE_URL=jqzpxxsrdcdgimiimbqx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# MongoDB (New)
DATABASE_URL_MONGO=mongodb://admin:password@localhost:27017/nodebb

# Redis (New)
REDIS_URL=redis://localhost:6379

# JWT (Shared)
JWT_SECRET=your_super_secret_key_here_same_in_both_systems

# NodeBB
NODEBB_URL=http://forum.localhost:4567
```

---

## Dependencies Between Tasks

```
Phase 0 (Critical Fixes)
├── T0.1 Session Token ─────────────────────────────┐
├── T0.2 Event Bus ─────────────────────┐           │
├── T0.3 Transaction Rollback           │           │
├── T0.4 Escrow Mandatory               │           │
└── T0.5 Missing Tables                 │           │
                                        │           │
Phase 1 (Infrastructure)                │           │
├── T1.1 MongoDB ───────────────────────┤           │
├── T1.2 Redis ─────────────────────────┤           │
├── T1.3 Environment Variables ─────────┤           │
└── T1.4 Reverse Proxy ─────────────────┤           │
                                        │           │
Phase 2 (SSO Layer)                     │           │
├── T2.1 SSO Endpoint ◄─────────────────┴───────────┤
├── T2.2 JWT Auth ◄─────────────────────┘           │
├── T2.3 Webhooks                                   │
└── T2.4 NodeBB Plugin                              │
                                                    │
Phase 3 (NodeBB Setup)                              │
├── T3.1 Clone & Setup ◄────────────────────────────┘
├── T3.2 Arabic Pack
├── T3.3 Install SSO Plugin
└── T3.4 Configure SSO

Phase 4 (Testing)
├── T4.1 Test SSO
├── T4.2 Test Events
├── T4.3 Test Webhooks
└── T4.4 Test Rollback
```

**Parallel Tasks**: 
- T0.2, T0.3, T0.5 يمكن تنفيذها بالتوازي
- T1.1, T1.2 يمكن تنفيذها بالتوازي

**Sequential Dependencies**:
- T0.1 → T2.1 (SSO يحتاج unified token)
- T0.2 → T2.3 (Webhooks تحتاج Event Bus)
- T1.1, T1.2 → T3.1 (NodeBB يحتاج MongoDB + Redis)

---

## Verification Checklist

### After Phase 0:
```bash
bun run lint  # 0 errors
grep -r "session_token" src/  # 0 results
grep -r "eventBus" src/core/events/  # exists
```

### After Phase 1:
```bash
mongosh --eval "db.stats()"  # MongoDB running
redis-cli ping  # Redis running
```

### After Phase 2:
```bash
curl http://localhost:3000/api/auth/sso  # Returns JWT
```

### After Phase 3:
```bash
curl http://forum.localhost/api/config  # NodeBB running
```

### After Phase 4:
- SSO login works
- Events sync works
- Webhooks work
