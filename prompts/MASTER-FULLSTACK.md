# MASTER-FULLSTACK — Complete Sparky Implementation Guide

## Overview

This document defines the complete implementation order for the entire Sparky system: backend API, customer frontend, professional frontend, and admin frontend.

---

## Phase 0: Read First (Day 1)

Before writing a single line of code, read these:

1. `prompts/shared/01-api-contracts.md` — API format every module must follow
2. `prompts/shared/03-authentication-contract.md` — how auth works
3. `prompts/shared/04-booking-state-contract.md` — all booking states
4. `prompts/shared/05-payment-contract.md` — payment flow
5. `prompts/shared/07-design-system.md` — UI design tokens
6. `prompts/shared/09-security-rules.md` — security rules
7. `prompts/DEPENDENCIES.md` — what depends on what

---

## Phase 1: Core Infrastructure (Week 1–2)

**Target: Authentication working end-to-end**

| Order | Prompt | What gets built | Test |
|---|---|---|---|
| 1 | `backend/01` | DB connection, utils, security headers | `npm run build` |
| 2 | `backend/02` | OTP auth, JWT, sessions | OTP flow end-to-end |
| 3 | `backend/03` | User, Customer, Professional, Admin models, RBAC | Role checks pass |
| 4 | `frontend/01` | Customer app foundation, layout, API client | App loads |
| 5 | `frontend/02` | Login, OTP, signup screens | Full auth flow UI |
| 6 | `professional/01` | Professional auth | Pro can log in |

**Phase 1 Complete When:** A new customer can sign up via OTP. A professional can log in.

---

## Phase 2: Service Discovery (Week 2–3)

**Target: Customer can browse services**

| Order | Prompt | What gets built |
|---|---|---|
| 7 | `backend/05` | Service catalogue, categories, packages, addons |
| 8 | `backend/04` | Addresses, Google Maps integration |
| 9 | `backend/27` | Search and filtering |
| 10 | `frontend/03` | Homepage with categories + popular services |
| 11 | `frontend/04` | Service listing, search, filters |
| 12 | `frontend/05` | Service detail page with packages, addons, reviews |

**Phase 2 Complete When:** Customer can browse, search, and view service details.

---

## Phase 3: Professional Setup (Week 3–4)

**Target: Professionals can register and be verified**

| Order | Prompt | What gets built |
|---|---|---|
| 13 | `backend/06` | Professional profile management |
| 14 | `backend/07` | Professional onboarding and KYC flow |
| 15 | `backend/26` | File storage (Cloudinary) |
| 16 | `backend/10` | Availability engine (slot checking) |
| 17 | `professional/02` | Professional dashboard |
| 18 | `professional/03` | Onboarding wizard |
| 19 | `professional/04` | KYC document upload |
| 20 | `professional/05` | Availability settings |

**Phase 3 Complete When:** Professional can register, upload documents, admin can verify, professional can set availability.

---

## Phase 4: Booking Core (Week 4–5)

**Target: Customer can create a booking**

| Order | Prompt | What gets built |
|---|---|---|
| 21 | `backend/12` | Pricing engine (server-side calculation) |
| 22 | `backend/13` | Coupons system |
| 23 | `backend/08` | Booking creation engine |
| 24 | `backend/09` | Booking state machine |
| 25 | `frontend/06` | Booking flow (select → date → address → price) |
| 26 | `professional/06` | Professional job list |
| 27 | `professional/07` | Job detail view |

**Phase 4 Complete When:** Customer can create a booking draft with correct server-calculated price.

---

## Phase 5: Payments (Week 5–6)

**Target: Customer can pay; booking is confirmed**

| Order | Prompt | What gets built |
|---|---|---|
| 28 | `backend/14` | Razorpay order creation, verification, webhooks |
| 29 | `frontend/07` | Checkout and payment UI |
| 30 | `backend/15` | Cancellation and refunds |

**Phase 5 Complete When:** Customer pays via Razorpay, booking confirms, refunds work.

---

## Phase 6: Dispatch + Service Lifecycle (Week 6–7)

**Target: Professional receives and completes jobs**

| Order | Prompt | What gets built |
|---|---|---|
| 31 | `backend/11` | Dispatch engine (scoring + assignment) |
| 32 | `backend/21` | Professional location tracking |
| 33 | `backend/20` | Real-time booking status (polling) |
| 34 | `professional/08` | Navigation screen |
| 35 | `professional/09` | Active job screen (OTP start) |
| 36 | `professional/10` | Completion screen (completion OTP) |
| 37 | `frontend/08` | Customer booking tracker |

**Phase 6 Complete When:** Full booking lifecycle works: payment → dispatch → professional travels → OTP start → service → OTP complete.

---

## Phase 7: Notifications (Week 7)

**Target: All parties receive correct notifications**

| Order | Prompt | What gets built |
|---|---|---|
| 38 | `backend/19` | WhatsApp, SMS, push, email notifications |
| 39 | `professional/15` | Professional notification center |
| 40 | `frontend/10` | Customer profile + notification settings |

**Phase 7 Complete When:** Customer gets WhatsApp on booking confirmation, professional gets push for new job, customer gets WhatsApp when pro arrives.

---

## Phase 8: Reviews, Support, Safety (Week 8)

| Order | Prompt | What gets built |
|---|---|---|
| 41 | `backend/17` | Reviews and ratings |
| 42 | `backend/18` | Support tickets |
| 43 | `backend/22` | Safety system |
| 44 | `frontend/11` | Customer review submission |
| 45 | `professional/13` | Professional performance dashboard |

---

## Phase 9: Earnings and Payouts (Week 8–9)

| Order | Prompt | What gets built |
|---|---|---|
| 46 | `backend/16` | Professional earnings and payout settlement |
| 47 | `professional/11` | Earnings overview |
| 48 | `professional/12` | Payout history |

---

## Phase 10: Admin Panel (Week 9–10)

| Order | Prompt | What gets built |
|---|---|---|
| 49 | `backend/23` | All admin APIs with RBAC |
| 50 | `backend/25` | Audit logs |
| 51 | `admin/01` | Admin foundation and layout |
| 52 | `admin/02` | Dashboard |
| 53 | `admin/05` | Professional KYC verification (most important) |
| 54 | `admin/08` | Booking management |
| 55 | `admin/09` | Manual dispatch panel |
| 56 | `admin/10` | Payments |
| 57 | `admin/11` | Refunds |
| 58 | `admin/12` | Coupons |
| 59 | `admin/14` | Support queue |
| 60 | `admin/03` | Customers |
| 61 | `admin/04` | Professionals |
| 62 | `admin/06` | Services management |
| 63 | `admin/07` | Categories |
| 64 | `admin/13` | Reviews moderation |
| 65 | `admin/15` | Payouts |
| 66 | `admin/21` | RBAC team management |
| 67 | `admin/19` | Audit logs viewer |

---

## Phase 11: Polish + Launch Readiness (Week 10–12)

| Order | Prompt | What gets built |
|---|---|---|
| 68 | `backend/24` | Analytics event tracking |
| 69 | `backend/28` | Reports |
| 70 | `admin/16` | Reports page |
| 71 | `admin/17` | Analytics dashboard |
| 72 | `admin/18` | Notifications/broadcasts |
| 73 | `admin/20` | Settings (cities, zones, surge) |
| 74 | `frontend/09` | Booking history (customer) |
| 75 | `professional/14` | Professional profile |
| 76 | `backend/29` | Security hardening pass |
| 77 | `backend/30` | Backend testing |
| 78 | `admin/admin/rbac` | Final RBAC audit |

---

## Launch Checklist

Before going live in Amritsar:

- [ ] All backend prompts implemented (01-30)
- [ ] All customer frontend prompts implemented (01-11)
- [ ] Professional prompts 01-10, 15 implemented (core job flow)
- [ ] Admin prompts 01, 02, 05, 08, 09 implemented (minimum ops)
- [ ] Razorpay live mode credentials configured
- [ ] WhatsApp templates approved by Meta
- [ ] DLT SMS templates registered
- [ ] MongoDB Atlas M2 production cluster live
- [ ] Vercel production deployments configured
- [ ] All environment variables set in Vercel
- [ ] Google Maps API key restricted to production domain
- [ ] Sentry error tracking configured
- [ ] 10+ professionals onboarded and verified in Amritsar
- [ ] 15+ services seeded with real Amritsar pricing
- [ ] First coupon created: SPARKY100
- [ ] Smoke test: founder completes full booking end-to-end
- [ ] Load test: 100 concurrent API calls pass

---

## Minimum Viable Implementation

If resources are constrained, implement ONLY these prompts for the absolute minimum working Sparky:

**Backend (MVP):** 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 14, 19, 23 (partial)

**Customer (MVP):** 01, 02, 03, 04, 05, 06, 07, 08

**Professional (MVP):** 01, 02, 03, 04, 06, 09, 10

**Admin (MVP):** 01, 02, 05, 08, 09

This delivers: Browse → Book → Pay → Dispatch → Service → Complete.

Everything else is iteration.
