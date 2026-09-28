# Sparky — Prompt Dependency Graph

## Critical Path (Must be sequential)

```
[01] Backend Foundation
  └─► [02] Authentication
        └─► [03] Users & Roles
              ├─► [04] Addresses & Location
              │     └─► [05] Service Catalogue
              │           ├─► [06] Professionals
              │           │     └─► [07] Professional Onboarding
              │           └─► [08] Booking Engine
              │                 ├─► [09] Booking State Machine
              │                 ├─► [10] Availability Engine
              │                 │     └─► [11] Dispatch Engine ◄── CRITICAL
              │                 ├─► [12] Pricing Engine
              │                 │     └─► [13] Coupons & Promotions
              │                 └─► [14] Payment System ◄── CRITICAL
              │                       └─► [15] Cancellation & Refunds
              │                             └─► [16] Professional Payouts
              └─► [17] Reviews & Ratings
              └─► [18] Support System
              └─► [19] Notification System ◄── feeds all above
              └─► [20] Real-Time Booking Updates
              └─► [21] Professional Location Tracking
              └─► [22] Safety System
              └─► [23] Admin Backend
                    ├─► [24] Analytics
                    ├─► [25] Audit Logs
                    ├─► [26] File Storage
                    ├─► [27] Search & Filtering
                    └─► [28] Reporting
[29] Security Hardening (runs OVER everything — last backend pass)
[30] Backend Testing (runs OVER everything — last validation)
```

---

## Parallel Work Opportunities

| Group | Prompts | Can run simultaneously after... |
|---|---|---|
| A | `12-pricing-engine` + `13-coupons` | `08-booking-engine` |
| B | `17-reviews` + `18-support` | `09-booking-state-machine` |
| C | `20-realtime` + `21-location` | `11-dispatch-engine` |
| D | `24-analytics` + `25-audit-logs` + `26-file-storage` + `27-search` + `28-reporting` | `23-admin-backend` |
| E | `professional/03-onboarding` + `professional/04-kyc` | `backend/07-professional-onboarding` |

---

## Frontend → Backend Dependencies

| Frontend Prompt | Required Backend Prompts |
|---|---|
| `frontend/01-frontend-foundation` | `backend/01-backend-foundation` |
| `frontend/02-customer-authentication` | `backend/02-authentication` |
| `frontend/03-customer-home` | `backend/05-service-catalogue` |
| `frontend/04-service-discovery` | `backend/05-service-catalogue`, `backend/27-search-filtering` |
| `frontend/05-service-details` | `backend/05-service-catalogue`, `backend/17-reviews-ratings` |
| `frontend/06-booking-flow` | `backend/08-booking-engine`, `backend/10-availability-engine`, `backend/12-pricing-engine`, `backend/13-coupons` |
| `frontend/07-checkout-payment` | `backend/14-payment-system` |
| `frontend/08-booking-tracking` | `backend/09-booking-state-machine`, `backend/20-realtime-booking`, `backend/21-location` |
| `frontend/09-booking-history` | `backend/08-booking-engine` |
| `frontend/10-customer-profile` | `backend/03-users-and-roles`, `backend/04-addresses` |
| `frontend/11-customer-reviews` | `backend/17-reviews-ratings` |
| `professional/01-authentication` | `backend/02-authentication` |
| `professional/02-dashboard` | `backend/06-professionals`, `backend/08-booking-engine` |
| `professional/03-onboarding` + `04-kyc` | `backend/07-professional-onboarding`, `backend/26-file-storage` |
| `professional/05-availability` | `backend/10-availability-engine` |
| `professional/06-07-bookings` | `backend/08-booking-engine`, `backend/11-dispatch-engine` |
| `professional/08-navigation` | `backend/21-professional-location` |
| `professional/09-10-active-job` | `backend/09-booking-state-machine` |
| `professional/11-12-earnings-payouts` | `backend/16-professional-payouts` |
| `admin/*` | `backend/23-admin-backend`, `backend/25-audit-logs` |

---

## Shared Contracts (Read Before Starting)

These must be read by EVERY coding agent before implementing any feature:

| Shared File | Read Before Implementing |
|---|---|
| `shared/01-api-contracts.md` | Any API endpoint |
| `shared/02-error-handling.md` | Any API endpoint |
| `shared/03-authentication-contract.md` | Any authenticated feature |
| `shared/04-booking-state-contract.md` | Any booking-related feature |
| `shared/05-payment-contract.md` | Any payment-related feature |
| `shared/06-notification-contract.md` | Any notification |
| `shared/07-design-system.md` | Any frontend component |
| `shared/08-validation-rules.md` | Any input field |
| `shared/09-security-rules.md` | Any API, form, or file upload |
| `shared/10-analytics-events.md` | Any user-facing interaction |

---

## Minimum Viable Prompt Set (Fastest Path to Working MVP)

If you want to reach a working booking flow as fast as possible, implement in this order:

1. `backend/01` → `backend/02` → `backend/03`
2. `backend/05` (seed service data)
3. `backend/04` (addresses)
4. `backend/06` + `backend/07` (professionals)
5. `backend/08` + `backend/09` + `backend/10` (booking core)
6. `backend/12` (pricing)
7. `backend/14` (payment — Razorpay)
8. `backend/11` (dispatch)
9. `backend/19` (notifications — WhatsApp + push)
10. `frontend/01` → `frontend/02` → `frontend/03` → `frontend/04` → `frontend/05`
11. `frontend/06` → `frontend/07` → `frontend/08`
12. `professional/01` → `professional/02` → `professional/06` → `professional/09` → `professional/10`
13. `admin/01` → `admin/02` → `admin/05` → `admin/08` → `admin/09`

This gives you: **Login → Browse → Book → Pay → Dispatch → Service → Complete.**
