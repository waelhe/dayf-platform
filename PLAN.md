# Implementation Plan - Phase 4: EXECUTE

## Architectural Impact Assessment

### Areas Affected
```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURAL LAYERS                      │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer                                          │
│  ├── app/api/auth/* (4 files - Zod fix)                     │
│  ├── app/api/services/* (2 files - Type fix)                │
│  ├── app/companies/[slug]/* (2 files - Type fix)            │
│  └── features/*/components/* (4 files - Type fix)           │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                        │
│  ├── features/tourism/infrastructure/* (2 files - Remove    │
│  │   Prisma-specific code)                                  │
│  └── features/reviews/* (2 files - Export conflict)         │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer                                                │
│  └── core/types/* (Types need consolidation)                │
└─────────────────────────────────────────────────────────────┘
```

### Extension Points Added
1. **auth-helpers.ts** - Centralized auth functions (✅ created)
2. **Type consolidation** - Unified CompanyResponse, ReviewStats

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Breaking changes in auth flow | Keep backward compatibility with query params |
| Type conflicts after changes | Run tsc after each batch |
| Prisma references remaining | Grep search before commit |

---

## Execution Batches

### Batch 1: Zod v4 API Fixes (4 files, ~2 min)
**Risk: LOW** | **Impact: HIGH**

```
Files:
├── src/app/api/auth/login/route.ts
├── src/app/api/auth/register/route.ts
├── src/app/api/auth/otp/send/route.ts
└── src/app/api/auth/otp/verify/route.ts

Change:
  - error.errors[0].message → error.issues[0].message
```

### Batch 2: Service Type Fixes (3 files, ~3 min)
**Risk: MEDIUM** | **Impact: MEDIUM**

```
Files:
├── src/app/api/services/route.ts
├── src/app/api/services/seed/route.ts
└── src/features/services/components/ServiceForm.tsx

Changes:
  - Add missing fields: views, isSuperhost, isPopular
  - Fix form submit handler type
  - Fix seed route type
```

### Batch 3: Company Types (2 files, ~2 min)
**Risk: LOW** | **Impact: MEDIUM**

```
Files:
├── src/app/companies/[slug]/page.tsx
└── src/app/companies/[slug]/team/page.tsx

Changes:
  - Add totalBookings to CompanyResponse
  - Fix EmployeeRole type assertion
```

### Batch 4: Reviews Module (2 files, ~2 min)
**Risk: MEDIUM** | **Impact: MEDIUM**

```
Files:
├── src/features/reviews/index.ts
└── src/features/reviews/components/ReviewList.tsx

Changes:
  - Resolve ReviewStats export conflict
  - Fix type import
```

### Batch 5: Tourism Services (2 files, ~3 min)
**Risk: HIGH** | **Impact: HIGH**

```
Files:
├── src/features/tourism/infrastructure/activity-service.ts
└── src/features/tourism/infrastructure/destination-service.ts

Changes:
  - Remove Prisma-specific ReviewWhereInput
  - Use Supabase query syntax
  - Fix avgRating undefined check
```

### Batch 6: Component Fixes (3 files, ~2 min)
**Risk: LOW** | **Impact: LOW**

```
Files:
├── src/components/dayf/PropertyListings.tsx
├── src/features/reviews/components/RatingStars.tsx
└── src/features/reviews/components/ReviewCard.tsx (if needed)

Changes:
  - Fix toggleFavorite type signature
  - Fix JSX Element array type
```

### Batch 7: Cleanup (5 min)
**Risk: LOW** | **Impact: LOW**

```
Actions:
├── Remove console.log statements (3 files)
├── Remove unused Prisma dependencies from package.json
├── Delete examples/ and skills/ from TS config
└── Run final tsc and lint
```

---

## Verification Checkpoints

After each batch:
1. `npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "skills/\|examples/" | wc -l`
2. If errors increase, rollback and fix

Final verification:
1. TypeScript: 0 errors
2. ESLint: 0 errors (warnings acceptable)
3. Manual test: Login, Register, Services pages

---

## Future Architecture Improvements (Post-Execution)

1. **Abstract Database Layer**
   - Create `core/database/interface.ts`
   - Implement for Supabase, allow future adapters

2. **Event System**
   - Add `core/events/` for cross-feature communication
   - Decouple booking → escrow → disputes

3. **Plugin Architecture**
   - Allow features to register routes, components
   - Enable/disable features without code changes

---

## Estimated Time
- **Batch 1-6**: ~15 minutes
- **Batch 7**: ~5 minutes
- **Total**: ~20 minutes
