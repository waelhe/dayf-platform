# Tasks: Database Migration (Prisma → Supabase)

**Feature**: 001-database-migration
**Created**: 2025-03-26
**Status**: Ready for Implementation

---

## Task Legend

- `[P]` = Can run in parallel
- `[US1/2/3]` = User Story reference
- `🔴` = Blocking (must complete first)
- `⏳` = In Progress
- `✅` = Completed

---

## Phase 1: Infrastructure Layer (Foundation) 🔴

> Must complete before any other work

### T001: Core Database Interface 🔴
- [ ] Create `src/core/database/interface.ts`
  - [ ] `IRepository<T>` interface with CRUD methods
  - [ ] `IDatabaseProvider` interface
  - [ ] `FilterQuery`, `PaginationOptions`, `SortOptions` types
- [ ] Create `src/core/database/types.ts`
  - [ ] Common database types
  - [ ] Error types
- [ ] Create `src/core/database/index.ts`
  - [ ] Export all public interfaces

**Files to create**:
```
src/core/database/interface.ts
src/core/database/types.ts
src/core/database/index.ts
```

---

### T002: Supabase Provider 🔴 [P]
- [ ] Update `src/lib/supabase.ts`
  - [ ] Add connection pooling configuration
  - [ ] Add admin client with service role
  - [ ] Add proper error handling
  - [ ] Remove inline types (use shared types)
- [ ] Create `src/infrastructure/database/supabase-provider.ts`
  - [ ] Implement `IDatabaseProvider`
  - [ ] Add transaction support
  - [ ] Add connection health check

**Files to update/create**:
```
src/lib/supabase.ts (update)
src/infrastructure/database/supabase-provider.ts (new)
```

---

### T003: Base Repository 🔴 [P]
- [ ] Create `src/infrastructure/repositories/base.repository.ts`
  - [ ] Abstract `BaseRepository<T>` class
  - [ ] Implement common CRUD operations
  - [ ] Add error handling and logging
  - [ ] Add soft delete support
- [ ] Create `src/infrastructure/repositories/index.ts`
  - [ ] Export all repositories

**Files to create**:
```
src/infrastructure/repositories/base.repository.ts
src/infrastructure/repositories/index.ts
```

---

**Checkpoint 1**: Infrastructure layer ready ✅
- Can connect to Supabase
- Repository interface defined
- Base CRUD operations work

---

## Phase 2: Auth Feature Migration

### T004: Auth Repository Interfaces
- [ ] Create `src/features/auth/domain/interfaces/`
  - [ ] `user.repository.interface.ts`
  - [ ] `session.repository.interface.ts`
  - [ ] `otp.repository.interface.ts`

---

### T005: User Repository [US1]
- [ ] Create `src/features/auth/infrastructure/user.repository.ts`
  - [ ] Implement `IUserRepository`
  - [ ] findById, findByEmail, create, update
  - [ ] Role management methods
- [ ] Update `src/features/auth/infrastructure/auth-service.ts`
  - [ ] Inject repository via constructor
  - [ ] Replace all `db.user.*` calls

---

### T006: Session Repository [US1]
- [ ] Create `src/features/auth/infrastructure/session.repository.ts`
  - [ ] Implement `ISessionRepository`
  - [ ] Create, findValid, invalidate, invalidateAll
- [ ] Update session-service.ts to use repository

---

### T007: OTP Repository [US1]
- [ ] Create `src/features/auth/infrastructure/otp.repository.ts`
  - [ ] Implement `IOtpRepository`
  - [ ] create, findValid, markUsed, deleteExpired
- [ ] Update otp-service.ts to use repository

---

### T008: Auth API Routes [US1]
- [ ] Update `src/app/api/auth/login/route.ts`
  - [ ] Use new service methods
  - [ ] Add Zod validation
- [ ] Update `src/app/api/auth/register/route.ts`
  - [ ] Use new service methods
  - [ ] Add Zod validation
- [ ] Update `src/app/api/auth/otp/send/route.ts`
- [ ] Update `src/app/api/auth/otp/verify/route.ts`
- [ ] Update `src/app/api/auth/me/route.ts`
- [ ] Update `src/app/api/auth/logout/route.ts`

---

**Checkpoint 2**: Auth flows work ✅
- User can register
- User can login with OTP
- Session management works

---

## Phase 3: Company Feature Migration

### T009: Company Repository [US2]
- [ ] Create company repository interface
- [ ] Create company.repository.ts
- [ ] Update company-service.ts
- [ ] Update employee-service.ts

### T010: Company API Routes [US2]
- [ ] Update `/api/companies/*` routes
- [ ] Add auth middleware
- [ ] Add Zod validation

---

## Phase 4: Booking & Orders Migration

### T011: Booking Repository [US2]
- [ ] Create booking repository
- [ ] Update bookings-service.ts
- [ ] Update booking API routes

### T012: Orders Repository [US2]
- [ ] Create orders repository
- [ ] Update orders-service.ts
- [ ] Update orders API routes

---

## Phase 5: Escrow Migration (Critical)

### T013: Escrow Repository with Transactions 🔴
- [ ] Create escrow repository interface
- [ ] Implement with transaction support
  - [ ] Use Supabase RPC for atomic operations
  - [ ] Add idempotency key support
  - [ ] Add audit logging
- [ ] Update escrow-service.ts
- [ ] Add comprehensive error handling

### T014: Escrow API Routes
- [ ] Update all escrow routes
- [ ] Add auth middleware
- [ ] Add request/response logging

---

## Phase 6: Supporting Features

### T015: Reviews Migration
- [ ] Create review repository
- [ ] Update review-service.ts
- [ ] Update review API routes

### T016: Disputes Migration
- [ ] Create dispute repository
- [ ] Update dispute-service.ts
- [ ] Remove cross-feature import (use events)

### T017: Community Migration
- [ ] Create community repository
- [ ] Update community-service.ts

### T018: Marketplace Migration
- [ ] Create marketplace repository
- [ ] Update marketplace-service.ts
- [ ] Update cart/wishlist routes

### T019: Tourism Migration
- [ ] Create activity repository
- [ ] Create destination repository
- [ ] Update tourism services

---

## Phase 7: Security Hardening

### T020: Auth Middleware
- [ ] Create auth middleware function
- [ ] Apply to all protected routes
- [ ] Add role-based access for admin routes

### T021: Input Validation
- [ ] Create Zod schemas for all inputs
- [ ] Apply to all POST/PUT/PATCH routes
- [ ] Add error formatting

### T022: Rate Limiting
- [ ] Add rate limiting to auth endpoints
- [ ] Add rate limiting to OTP endpoints

---

## Phase 8: Cleanup

### T023: Remove Prisma
- [ ] Remove `@prisma/client` from package.json
- [ ] Remove `prisma` from package.json
- [ ] Delete `src/lib/db.ts`
- [ ] Delete `prisma/` folder
- [ ] Update `.env` file

### T024: Final Cleanup
- [ ] Remove all console.log (use logger)
- [ ] Fix all `any` types
- [ ] Run `bun run lint`
- [ ] Run `bun run build`
- [ ] Update context.md

---

## Parallel Execution Opportunities

```
After Phase 1 complete:
  Developer A → Phase 2 (Auth)
  Developer B → Phase 3 (Companies)
  Developer C → Phase 6 partial (Reviews, Community)
  Then merge for Phase 5 (Escrow - needs Auth)
```

---

## Dependency Graph

```
T001 (Interface) ──┬──► T005-007 (Auth Repos)
                   │
T002 (Provider) ───┤
                   │
T003 (Base Repo) ──┘

T005-008 (Auth) ──────► T011-012 (Booking/Orders)
                       │
                       └──► T013-014 (Escrow)

T009-010 (Companies) ──► T013-014 (Escrow)

T015-019 (Supporting) ──► T020-022 (Security)

All ──► T023-024 (Cleanup)
```
