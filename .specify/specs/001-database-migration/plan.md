# Implementation Plan: Database Migration (Prisma → Supabase)

**Feature**: 001-database-migration
**Created**: 2025-03-26
**Status**: Draft

---

## Constitutional Gates

### Repository Pattern Gate (Article I)
- [ ] All DB access through IRepository interface
- [ ] Services depend on interfaces, not implementations
- [ ] No direct Supabase client calls in services

### Architecture Gate (Article II)
- [ ] Clean Architecture layers respected
- [ ] No business logic in infrastructure
- [ ] Dependency Inversion principle followed

### Security Gate (Article IV)
- [ ] Auth middleware on ALL protected routes
- [ ] Zod validation on ALL inputs
- [ ] No sensitive data in responses

---

## Technical Architecture

### Layer Structure

```
src/
├── core/
│   ├── database/
│   │   ├── interface.ts           # IRepository, IDatabaseProvider
│   │   ├── types.ts               # Query types, Filter types
│   │   └── errors.ts              # Database errors
│   ├── domain/
│   │   └── entities/              # Domain entities (existing)
│   └── types/                     # Shared types
│
├── infrastructure/
│   ├── database/
│   │   ├── supabase-client.ts     # Supabase client singleton
│   │   └── supabase-provider.ts   # IDatabaseProvider implementation
│   └── repositories/
│       ├── base.repository.ts     # Abstract base repository
│       └── supabase.repository.ts # Generic Supabase repository
│
├── features/
│   ├── auth/
│   │   ├── domain/
│   │   │   └── interfaces/
│   │   │       ├── user.repository.interface.ts
│   │   │       ├── session.repository.interface.ts
│   │   │       └── otp.repository.interface.ts
│   │   └── infrastructure/
│   │       ├── user.repository.ts
│   │       ├── session.repository.ts
│   │       └── otp.repository.ts
│   │
│   ├── companies/
│   │   ├── domain/interfaces/
│   │   │   ├── company.repository.interface.ts
│   │   │   └── employee.repository.interface.ts
│   │   └── infrastructure/
│   │       ├── company.repository.ts
│   │       └── employee.repository.ts
│   │
│   └── [other features]/
│       └── (same structure)
│
└── lib/
    └── di/
        └── container.ts           # Dependency injection container
```

---

## Migration Phases

### Phase 1: Infrastructure Layer (Foundation)

**Duration**: 1 hour

**Tasks**:
1. Create `core/database/interface.ts`
   - `IRepository<T>` interface
   - `IDatabaseProvider` interface
   - Query and Filter types

2. Create `infrastructure/database/supabase-client.ts`
   - Singleton Supabase client
   - Connection pooling support
   - Environment configuration

3. Create `infrastructure/repositories/base.repository.ts`
   - Abstract class with common CRUD
   - Error handling
   - Logging

4. Update `lib/supabase.ts`
   - Remove inline types (use generated types)
   - Add admin client support

**Checkpoint**: Can connect to Supabase via repository interface

---

### Phase 2: Auth Feature Migration

**Duration**: 1-2 hours

**Services to migrate**:
- `auth-service.ts`
- `otp-service.ts`
- `session-service.ts`

**Tasks**:
1. Create repository interfaces
2. Implement Supabase repositories
3. Update services to use repositories
4. Update API routes
5. Test auth flow

**Checkpoint**: User can register, login, logout

---

### Phase 3: Core Business Features

**Duration**: 2-3 hours

**Services to migrate**:
- `company-service.ts`
- `employee-service.ts`
- `bookings-service.ts`
- `orders-service.ts`
- `services-service.ts` (already done, verify)

**Tasks**:
1. Create repository interfaces for each
2. Implement repositories
3. Update services
4. Update API routes

**Checkpoint**: Core business flows work

---

### Phase 4: Financial Features (Escrow)

**Duration**: 1 hour

**Critical**: Must add transactions!

**Tasks**:
1. Create EscrowRepository with transaction support
2. Wrap all financial operations in transactions
3. Add idempotency keys
4. Add audit logging

**Checkpoint**: Escrow operations are safe

---

### Phase 5: Supporting Features

**Duration**: 2 hours

**Services to migrate**:
- `review-service.ts`
- `dispute-service.ts`
- `community-service.ts`
- `marketplace-service.ts`
- `activity-service.ts`
- `destination-service.ts`

**Tasks**:
1. Create repositories
2. Update services
3. Update API routes

**Checkpoint**: All features work

---

### Phase 6: Security Hardening

**Duration**: 1 hour

**Tasks**:
1. Add auth middleware to all protected routes
2. Add Zod validation to all inputs
3. Add rate limiting
4. Remove all `any` types
5. Clean up console.log

**Checkpoint**: Security issues resolved

---

### Phase 7: Cleanup

**Duration**: 30 minutes

**Tasks**:
1. Remove Prisma from package.json
2. Delete `lib/db.ts`
3. Delete `prisma/` folder
4. Update `.env` with Supabase only
5. Run final lint and build

**Checkpoint**: Clean build, zero errors

---

## API Routes Update

### Routes requiring Auth Middleware

```
All routes except:
- /api/auth/login
- /api/auth/register
- /api/auth/otp/send
- /api/auth/otp/verify
- /api/services (GET only)
- /api/destinations (GET only)
- /api/activities (GET only)
```

### Routes requiring Zod Validation

```
All POST/PUT/PATCH routes need input validation:
- /api/auth/*
- /api/bookings/*
- /api/orders/*
- /api/companies/*
- /api/reviews/*
- /api/escrow/*
- /api/disputes/*
```

---

## Supabase Schema Verification

### Tables to verify exist:

| Table | Purpose | Status |
|-------|---------|--------|
| users | User accounts | Need to verify |
| sessions | Auth sessions | Need to verify |
| otp_codes | OTP verification | Need to verify |
| companies | Business entities | Need to verify |
| company_employees | Employee relations | Need to verify |
| services | Tourism services | Need to verify |
| bookings | Reservations | Need to verify |
| orders | Product orders | Need to verify |
| escrow | Financial escrow | Need to verify |
| escrow_transactions | Transaction log | Need to verify |
| reviews | User reviews | Need to verify |
| disputes | Dispute cases | Need to verify |
| community_topics | Forum topics | Need to verify |
| community_replies | Forum replies | Need to verify |
| products | Marketplace products | Need to verify |
| cart_items | Shopping cart | Need to verify |
| wishlist_items | User wishlist | Need to verify |
| activities | Tourist activities | Need to verify |
| destinations | Tourist destinations | Need to verify |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during migration | SQLite data not critical (dev only) |
| Breaking API changes | Keep same response formats |
| Auth session issues | Test all auth flows thoroughly |
| Escrow transactions | Add comprehensive logging |
| Performance issues | Use connection pooling |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| TypeScript errors | 0 |
| Runtime errors on startup | 0 |
| Auth flow completion rate | 100% |
| API route coverage with auth | 100% |
| Services using Supabase | 28/28 |
