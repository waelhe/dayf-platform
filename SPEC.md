# ضيف (Dayf) - Syrian Tourism Platform Specification

## Project Overview
منصة سياحية سورية متكاملة تتيح حجز الخدمات السياحية، المنتجات، وإدارة الشركات.

---

## Current State Analysis

### ✅ Working Components
| Component | Status | Notes |
|-----------|--------|-------|
| Supabase Connection | ✅ Active | Pooler connection working |
| Services API | ✅ Working | CRUD operations |
| Destinations API | ✅ Working | CRUD operations |
| Reviews System | ✅ Working | With stats & helpful votes |
| Wishlist | ✅ Working | Add/Remove/Check |
| Companies | ✅ Working | Registration & management |
| Cart | ✅ Working | Local storage based |
| UI Components | ✅ Complete | shadcn/ui + custom |

### ❌ Known Issues (19 TypeScript Errors)

#### Category A: Zod v4 API Changes (4 errors)
```
Files: auth/login, auth/register, auth/otp/send, auth/otp/verify
Error: Property 'errors' does not exist on type 'ZodError'
Fix: Change error.errors to error.issues
```

#### Category B: Type Mismatches (15 errors)
```
1. services/route.ts - Service creation type
2. services/seed/route.ts - Type 'true' not assignable
3. companies/[slug]/page.tsx - totalBookings missing
4. companies/[slug]/team/page.tsx - EmployeeRole mismatch
5. PropertyListings.tsx - toggleFavorite type
6. RatingStars.tsx - JSX Element type
7. ReviewList.tsx - ReviewStats type conflict
8. reviews/index.ts - Duplicate export ReviewStats
9. ServiceForm.tsx - Form data type mismatch
10-15. activity-service.ts & destination-service.ts - Prisma-specific code
```

---

## Architecture Layers

```
src/
├── app/                    # Next.js App Router (Presentation Layer)
│   ├── (auth)/            # Auth pages (login, register)
│   ├── api/               # API Routes (Controllers)
│   └── [features]/        # Feature pages
│
├── features/              # Feature Modules (Business Logic)
│   ├── auth/
│   │   ├── infrastructure/  # External services (Supabase)
│   │   ├── components/      # Feature-specific UI
│   │   └── types.ts         # Domain types
│   ├── bookings/
│   ├── companies/
│   ├── disputes/
│   ├── escrow/
│   ├── marketplace/
│   ├── orders/
│   ├── reviews/
│   ├── services/
│   └── tourism/
│
├── core/                  # Shared Domain Layer
│   ├── services/         # Shared business services
│   └── types/            # Shared types & enums
│
├── components/           # Shared UI Components
│   ├── ui/              # shadcn/ui components
│   └── dayf/            # Platform-specific components
│
├── lib/                  # Infrastructure Layer
│   ├── supabase.ts      # Database client
│   └── auth-helpers.ts  # Auth utilities
│
├── contexts/            # React Contexts
└── hooks/               # Shared Hooks
```

---

## Critical TODOs

### Authentication (Priority: HIGH)
- [ ] Connect login/register pages to AuthService
- [ ] Implement SMS sending (currently console.log only)
- [ ] Password reset flow
- [ ] Session management in UI

### API Routes (Priority: HIGH)
- [ ] Replace all `return null` in getCurrentUser functions
- [ ] Add permission checks to protected routes
- [ ] Admin routes protection

### Missing Features (Priority: MEDIUM)
- [ ] Payment integration
- [ ] File upload service
- [ ] Notifications system
- [ ] Real-time updates (WebSocket)

---

## Database Schema (Supabase)

### Core Tables
- users, profiles, sessions
- services, destinations, activities
- bookings, orders, escrow
- reviews, disputes
- companies, employees
- wishlist, cart_items

---

## Dependencies Analysis

### Used & Required
- @supabase/supabase-js (implicit via custom client)
- next, react, react-dom
- zod (validation)
- bcryptjs (password hashing)
- zustand (state)
- @tanstack/react-query (server state)

### Unused (Candidates for Removal)
- @prisma/client (migrated to Supabase)
- prisma (migrated to Supabase)
- next-intl (not used)
- @reactuses/core (not used)
- react-syntax-highlighter (not used)

### Unused (Keep for Future)
- @dnd-kit/* (drag & drop - future use)
- @mdxeditor/editor (content editing - future use)

---

## Success Criteria

1. **Zero TypeScript Errors** - All 19 errors resolved
2. **Working Authentication** - Login/Register/Session working end-to-end
3. **Protected Routes** - All API routes with proper auth checks
4. **Clean Codebase** - No unused dependencies, no console.log in production code
5. **Testable** - Each feature can be tested independently
