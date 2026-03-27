# Implementation Plan: Integration & Binding

**Branch**: `003-integration-binding` | **Date**: 2025-03-27

## Tech Stack

- **Framework**: Next.js 16 App Router
- **Language**: TypeScript 5
- **Database**: Supabase PostgreSQL
- **Validation**: Zod
- **Auth**: JWT + httpOnly Cookies

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Middleware (src/middleware.ts)        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. Check Route Protection Level                             ││
│  │    - PUBLIC → Pass through                                  ││
│  │    - AUTHENTICATED → Verify JWT                             ││
│  │    - OWNER → Verify JWT + Extract Resource ID               ││
│  │    - ADMIN → Verify JWT + Check Role                        ││
│  │                                                              ││
│  │ 2. Add Headers: x-user-id, x-user-email, x-user-role        ││
│  │ 3. Return 401/403 for unauthorized                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Route Handler                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ // Before (Patch):                                          ││
│  │ const user = await requireAuth(request); // Manual          ││
│  │                                                             ││
│  │ // After (Root):                                            ││
│  │ const userId = request.headers.get('x-user-id'); // Auto    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Validation Layer                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ // Option 1: HOF                                            ││
│  │ export const POST = withValidation(schema, handler);        ││
│  │                                                             ││
│  │ // Option 2: Direct                                         ││
│  │ const result = await validateBody(request, schema);         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Resource Ownership (if owner route)           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ const { userId, resourceId } = await requireOwner(          ││
│  │   request,                                                  ││
│  │   'bookings'                                                ││
│  │ );                                                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Repository Layer                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ // Uses Unified Types from @/core/types                     ││
│  │ // Uses DataLoader for batching                             ││
│  │ // Uses Soft Delete for safety                              ││
│  │                                                             ││
│  │ const booking = await bookingRepository.findById(id);       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Order

### Phase 1: Bind Middleware (Day 1)
**Files to modify**: 
- `src/middleware.ts` (verify matcher)
- `src/app/api/*/route.ts` (remove manual requireAuth)

**Breaking changes**: None (middleware already protects)

### Phase 2: Bind Types (Day 1-2)
**Files to modify**:
- All `features/*/domain/interfaces/*.ts`
- All `features/*/types.ts`

**Breaking changes**: Type imports only

### Phase 3: Bind DataLoader (Day 2)
**Files to modify**:
- `src/infrastructure/repositories/base.repository.ts`

**Breaking changes**: None (internal optimization)

### Phase 4: Bind Validation (Day 2-3)
**Files to modify**:
- All `src/app/api/*/route.ts`

**Breaking changes**: None (adds validation)

### Phase 5: Bind Ownership (Day 3)
**Files to modify**:
- Owner routes: bookings, reviews, escrow, services, companies

**Breaking changes**: None (adds security)

## Testing Strategy

### Unit Tests
- Each repository method with unified types
- DataLoader batching behavior
- Validation schemas

### Integration Tests
- Full request flow through middleware
- Owner route with different users
- Admin override

### Manual Tests
- Create new route → verify auto-protection
- Access another user's resource → verify 403
- Send invalid data → verify 400

## Rollback Plan

If issues arise:
1. Middleware can be disabled by removing matcher
2. Types can be reverted to local imports
3. DataLoader can be disabled by using `findByIdDirect()`
4. Validation can be disabled per-route
5. Ownership can be disabled per-route

## Dependencies

- No new packages required
- All infrastructure already in place
- Only binding/integration needed
