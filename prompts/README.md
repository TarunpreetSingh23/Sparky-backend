# Sparky — AI Coding Agent Prompt Library

This directory contains implementation-ready prompt files for building the Sparky at-home services marketplace. Each `.md` file is a **self-contained instruction** for an AI coding agent (Claude Code, Cursor, Gemini, etc.).

---

## How To Use These Files

1. **Read `MASTER-FULLSTACK.md` first** — it explains the full implementation order.
2. **Read `DEPENDENCIES.md`** — understand what must be built before what.
3. **Implement one prompt at a time.** Do not skip ahead.
4. **Run lint + build after every prompt.** Never move to the next prompt if the build is broken.
5. **Read `shared/` contracts before implementing any feature** — they define cross-cutting rules every module must follow.

---

## Directory Structure

```
prompts/
├── README.md                    ← You are here
├── DEPENDENCIES.md              ← Dependency graph
├── TRACEABILITY-MATRIX.md       ← SRS → prompt mapping
├── MASTER-BACKEND.md            ← Backend implementation guide
├── MASTER-FRONTEND.md           ← Frontend implementation guide
├── MASTER-FULLSTACK.md          ← Complete fullstack order
│
├── backend/                     ← 30 backend prompt files
│   ├── 01-backend-foundation.md
│   ├── 02-authentication.md
│   ├── 03-users-and-roles.md
│   ├── 04-customer-addresses-location.md
│   ├── 05-service-catalogue.md
│   ├── 06-professionals.md
│   ├── 07-professional-onboarding.md
│   ├── 08-booking-engine.md
│   ├── 09-booking-state-machine.md
│   ├── 10-availability-engine.md
│   ├── 11-dispatch-engine.md
│   ├── 12-pricing-engine.md
│   ├── 13-coupons-promotions.md
│   ├── 14-payment-system.md
│   ├── 15-cancellation-refunds.md
│   ├── 16-professional-payouts.md
│   ├── 17-reviews-ratings.md
│   ├── 18-support-system.md
│   ├── 19-notification-system.md
│   ├── 20-realtime-booking.md
│   ├── 21-professional-location.md
│   ├── 22-safety-system.md
│   ├── 23-admin-backend.md
│   ├── 24-analytics.md
│   ├── 25-audit-logs.md
│   ├── 26-file-storage.md
│   ├── 27-search-filtering.md
│   ├── 28-reporting.md
│   ├── 29-security-hardening.md
│   └── 30-backend-testing.md
│
├── frontend/                    ← Customer frontend (11 files)
│   ├── 01-frontend-foundation.md
│   ├── 02-customer-authentication.md
│   ├── 03-customer-home.md
│   ├── 04-service-discovery.md
│   ├── 05-service-details.md
│   ├── 06-booking-flow.md
│   ├── 07-checkout-payment.md
│   ├── 08-booking-tracking.md
│   ├── 09-booking-history.md
│   ├── 10-customer-profile.md
│   ├── 11-customer-reviews.md
│   │
│   ├── professional/            ← Professional PWA (15 files)
│   │   ├── 01-professional-authentication.md
│   │   ├── 02-professional-dashboard.md
│   │   ├── 03-professional-onboarding.md
│   │   ├── 04-professional-kyc.md
│   │   ├── 05-professional-availability.md
│   │   ├── 06-professional-bookings.md
│   │   ├── 07-professional-job-details.md
│   │   ├── 08-professional-navigation.md
│   │   ├── 09-professional-active-job.md
│   │   ├── 10-professional-completion.md
│   │   ├── 11-professional-earnings.md
│   │   ├── 12-professional-payouts.md
│   │   ├── 13-professional-performance.md
│   │   ├── 14-professional-profile.md
│   │   └── 15-professional-notifications.md
│   │
│   └── admin/                   ← Admin panel (21 files)
│       ├── 01-admin-foundation.md
│       ├── 02-admin-dashboard.md
│       ├── 03-admin-customers.md
│       ├── 04-admin-professionals.md
│       ├── 05-admin-professional-verification.md
│       ├── 06-admin-services.md
│       ├── 07-admin-categories.md
│       ├── 08-admin-bookings.md
│       ├── 09-admin-dispatch.md
│       ├── 10-admin-payments.md
│       ├── 11-admin-refunds.md
│       ├── 12-admin-coupons.md
│       ├── 13-admin-reviews.md
│       ├── 14-admin-support.md
│       ├── 15-admin-payouts.md
│       ├── 16-admin-reports.md
│       ├── 17-admin-analytics.md
│       ├── 18-admin-notifications.md
│       ├── 19-admin-audit-logs.md
│       ├── 20-admin-settings.md
│       └── 21-admin-rbac.md
│
└── shared/                      ← Cross-cutting contracts (10 files)
    ├── 01-api-contracts.md
    ├── 02-error-handling.md
    ├── 03-authentication-contract.md
    ├── 04-booking-state-contract.md
    ├── 05-payment-contract.md
    ├── 06-notification-contract.md
    ├── 07-design-system.md
    ├── 08-validation-rules.md
    ├── 09-security-rules.md
    └── 10-analytics-events.md
```

---

## Backend Implementation Order

Implement in this exact sequence. Each depends on the previous.

```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10
→ 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19
→ 20 → 21 → 22 → 23 → 24 → 25 → 26 → 27 → 28
→ 29 → 30
```

**Parallel work allowed:**
- `13` (Coupons) can be done alongside `12` (Pricing)
- `17` (Reviews) can be done alongside `18` (Support)
- `20` (Realtime) and `21` (Location) can run in parallel
- `24`, `25`, `26`, `27`, `28` can run in parallel after `23`

---

## Frontend Implementation Order

**Always implement corresponding backend prompt first.**

### Customer Frontend
```
backend/01 → frontend/01 (foundation)
backend/02 → frontend/02 (auth)
backend/05 → frontend/03, 04, 05 (home, discovery, service detail)
backend/08 → frontend/06 (booking flow)
backend/14 → frontend/07 (checkout + payment)
backend/09 → frontend/08 (booking tracking)
backend/08 → frontend/09 (booking history)
backend/03 → frontend/10 (customer profile)
backend/17 → frontend/11 (reviews)
```

### Professional Frontend
```
backend/07 → professional/01, 02, 03, 04 (auth, dashboard, onboarding, kyc)
backend/10 → professional/05 (availability)
backend/08 → professional/06, 07 (bookings, job details)
backend/21 → professional/08 (navigation)
backend/09 → professional/09, 10 (active job, completion)
backend/16 → professional/11, 12 (earnings, payouts)
backend/17 → professional/13 (performance)
backend/06 → professional/14 (profile)
backend/19 → professional/15 (notifications)
```

### Admin Frontend
```
backend/23 → admin/01–21 (all admin features)
```

---

## Rules Every AI Agent Must Follow

### Rule 1 — Inspect Before Editing
Never overwrite files without reading them first.

### Rule 2 — Preserve Existing Functionality
Do not break existing features.

### Rule 3 — Follow Existing Conventions
Match naming, folder structure, API response format, auth, database conventions.

### Rule 4 — No Fake Implementations
Do not use fake APIs, hardcoded payments, or fake booking success.

### Rule 5 — Backend Is Authoritative
Never trust frontend-sent price, role, user ID, or payment status.

### Rule 6 — Idempotency
Payment, booking, refund, webhook handling must be idempotent.

### Rule 7 — Security
Never expose OTPs, secrets, private documents, or payment credentials.

### Rule 8 — Error Handling
Every API must return predictable, structured errors.

### Rule 9 — Validation
Frontend validation = UX. Backend validation = correctness + security.

### Rule 10 — Production Quality
No TODOs, no hardcoded secrets, no commented-out code, no unused imports.
