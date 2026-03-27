# Feature Specification: Database Migration (Prisma → Supabase)

**Feature Branch**: `001-database-migration`
**Created**: 2025-03-26
**Status**: In Progress
**Input**: Migrate from Prisma/SQLite to Supabase with Repository Pattern

---

## User Scenarios & Testing

### User Story 1 - Application Runs Without Errors (Priority: P1)

As a developer, I want the application to run without database connection errors so that users can access the platform.

**Why this priority**: Without this, nothing else matters. The application is currently broken.

**Independent Test**: Application starts successfully and responds to HTTP requests without crashing.

**Acceptance Scenarios**:

1. **Given** the application is started, **When** a request is made to any endpoint, **Then** the application responds without crashing
2. **Given** the database layer is initialized, **When** a query is executed, **Then** it connects to Supabase successfully

---

### User Story 2 - Auth Services Work (Priority: P1)

As a user, I want to be able to register, login, and manage my session so that I can access protected features.

**Why this priority**: Auth is fundamental to all protected features.

**Independent Test**: User can complete full auth flow: register → verify OTP → login → access protected route.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they register with valid data, **Then** an account is created in Supabase
2. **Given** a registered user, **When** they request OTP, **Then** OTP is stored and can be verified
3. **Given** a verified user, **When** they login with correct credentials, **Then** a session is created

---

### User Story 3 - Business Services Work (Priority: P2)

As a business owner, I want to manage my company, services, and bookings so that I can operate my tourism business.

**Why this priority**: Core business functionality after auth.

**Independent Test**: Company owner can create company, add services, receive bookings.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a company, **Then** it's stored in Supabase
2. **Given** a company owner, **When** they add a service, **Then** it's linked to their company
3. **Given** a customer, **When** they make a booking, **Then** escrow is created correctly

---

### User Story 4 - Security Fixed (Priority: P2)

As a platform admin, I want all routes to have proper authentication so that unauthorized access is prevented.

**Why this priority**: Critical for production security.

**Independent Test**: Unauthenticated requests to protected routes return 401.

**Acceptance Scenarios**:

1. **Given** an unauthenticated request, **When** accessing protected route, **Then** 401 is returned
2. **Given** an authenticated non-admin, **When** accessing admin route, **Then** 403 is returned

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST connect to Supabase PostgreSQL database
- **FR-002**: System MUST use Repository Pattern for all database access
- **FR-003**: All 28 services MUST be migrated from Prisma to Supabase
- **FR-004**: System MUST maintain backward compatibility with existing API contracts
- **FR-005**: System MUST support transactions for financial operations (Escrow)
- **FR-006**: System MUST have proper authentication middleware on all protected routes
- **FR-007**: System MUST validate all inputs with Zod
- **FR-008**: System MUST support RTL and Arabic language

### Non-Functional Requirements

- **NFR-001**: Database queries MUST complete within 500ms
- **NFR-002**: Connection pooling MUST be used for production
- **NFR-003**: All database errors MUST be logged with context
- **NFR-004**: Sensitive data MUST not be logged

### Key Entities

- **User**: Core user entity with auth info, preferences, roles
- **Company**: Business entity with employees, services, products
- **Service**: Tourism service with pricing, availability, bookings
- **Booking**: Reservation with payment status, escrow reference
- **Escrow**: Financial transaction holder with status lifecycle
- **Review**: User feedback with ratings, photos, verification

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Application starts without errors (currently fails)
- **SC-002**: All 28 services successfully query Supabase
- **SC-003**: All 55 API routes have proper auth middleware
- **SC-004**: All financial operations use database transactions
- **SC-005**: Zero TypeScript errors in build
- **SC-006**: Zero runtime errors in basic user flows

---

## Architecture Constraints

1. **Repository Pattern Required**: No direct Supabase calls in services
2. **Interface Segregation**: Separate repository per aggregate root
3. **Dependency Injection**: Services receive repositories via constructor
4. **Event-Driven**: Features communicate via events, not direct imports
5. **Clean Architecture**: Domain → Application → Infrastructure layers
