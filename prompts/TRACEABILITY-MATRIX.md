# Sparky — Traceability Matrix

Maps every major SRS requirement to the implementation prompt(s) that satisfy it.

> **Legend:** ✅ = Covered | ⚠️ = Partial | ❌ = Not in MVP scope

---

## Authentication Requirements

| Req ID | Requirement | Backend Prompt | Frontend Prompt | API | Database | Test |
|---|---|---|---|---|---|---|
| FR-001 | Send 6-digit OTP to Indian mobile | `backend/02` | `frontend/02`, `professional/01` | POST /api/auth/send-otp | otpSessions | `auth.test.js` |
| FR-002 | Verify OTP within 10 minutes | `backend/02` | `frontend/02` | POST /api/auth/verify-otp | otpSessions (TTL) | `auth.test.js` |
| FR-003 | Issue JWT in httpOnly cookie | `backend/02` | — | — | — | `auth.test.js` |
| FR-004 | Lock account after 5 failed attempts | `backend/02` | `frontend/02` | — | users.loginAttempts | `auth.test.js` |

---

## Discovery Requirements

| Req ID | Requirement | Backend Prompt | Frontend Prompt | API | Database | Test |
|---|---|---|---|---|---|---|
| FR-005 | Detect customer city | `backend/04` | `frontend/03` | GET /api/cities | cities | — |
| FR-006 | Service categories by city | `backend/05` | `frontend/03`, `frontend/04` | GET /api/categories | categories | — |
| FR-007 | Service packages with prices | `backend/05` | `frontend/05` | GET /api/services/[slug] | servicePackages | `pricing.test.js` |

---

## Booking Requirements

| Req ID | Requirement | Backend Prompt | Frontend Prompt | API | Database | Test |
|---|---|---|---|---|---|---|
| FR-008 | Server-side coupon validation | `backend/13` | `frontend/06` | POST /api/coupons/validate | coupons, couponUsage | `booking.test.js` |
| FR-009 | Server-side price calculation | `backend/12` | — | POST /api/bookings | bookings.pricing | `pricing.test.js` |
| FR-010 | Razorpay payment verification | `backend/14` | `frontend/07` | POST /api/payments/verify | payments | `payment.test.js` |
| FR-011 | Razorpay webhook idempotency | `backend/14` | — | POST /api/payments/webhook | payments | `payment.test.js` |
| FR-012 | PAYMENT_CONFIRMED → SEARCHING | `backend/09`, `backend/11` | — | (internal) | bookings | `dispatch.test.js` |
| FR-013 | Professional scoring algorithm | `backend/11` | — | (internal) | professionals | `dispatch.test.js` |
| FR-014 | Notify professional of booking | `backend/11`, `backend/19` | `professional/06` | POST .../jobs/[id]/accept | — | `dispatch.test.js` |
| FR-015 | 3-minute acceptance timeout | `backend/11` | `professional/06` | — | bookings.responseDeadline | `dispatch.test.js` |
| FR-016 | Retry next professional on timeout | `backend/11` | — | (internal) | — | `dispatch.test.js` |
| FR-017 | Escalate after 3 failures | `backend/11`, `backend/23` | `admin/09` | (internal + admin) | — | `dispatch.test.js` |
| FR-018 | Auto-cancel if no pro in 15 min | `backend/11`, `backend/15` | `frontend/08` | (internal) | — | `dispatch.test.js` |
| FR-019 | Professional marks Arrived | `backend/09` | `professional/08` | POST /api/bookings/[id]/arrive | bookings | `booking.test.js` |
| FR-020 | OTP required to start service | `backend/09` | `professional/09`, `frontend/08` | POST /api/bookings/[id]/start | bookings.startOtpHash | `booking.test.js` |
| FR-021 | OTP required to complete service | `backend/09` | `professional/10`, `frontend/08` | POST /api/bookings/[id]/complete | bookings.completeOtpHash | `booking.test.js` |
| FR-022 | Invoice via WhatsApp + email | `backend/19` | — | (event-triggered) | — | — |
| FR-023 | Review prompt 30 min after completion | `backend/19` | `frontend/11` | (scheduled) | — | — |
| FR-024 | Professional rating updated on review | `backend/17` | — | POST /api/reviews | professionals.rating | `reviews.test.js` |
| FR-025 | Professional registration | `backend/07` | `professional/03` | POST /api/professionals/register | professionals | — |
| FR-026 | KYC document upload | `backend/07`, `backend/26` | `professional/04` | POST /api/professionals/[id]/kyc | professionalDocuments | — |
| FR-027 | Admin reviews and approves KYC | `backend/23` | `admin/05` | PATCH /api/admin/professionals/[id]/verify | professionals | — |
| FR-028 | Professional sees verification status | `backend/06` | `professional/02` | GET /api/professionals/[id] | professionals | — |
| FR-029 | Online/offline toggle | `backend/06` | `professional/02` | PATCH /api/professionals/[id]/status | professionals.isOnline | — |
| FR-030 | Admin manual dispatch | `backend/23` | `admin/09` | PATCH /api/admin/bookings/[id]/assign | bookings | — |
| FR-031 | Free cancellation > 4h before | `backend/15` | `frontend/08` | POST /api/bookings/[id]/cancel | bookings, payments | `cancellation.test.js` |
| FR-032 | 20% fee if < 4h before | `backend/15` | `frontend/08` | POST /api/bookings/[id]/cancel | payments | `cancellation.test.js` |
| FR-033 | Auto-refund if no professional | `backend/15` | — | (internal) | payments | `cancellation.test.js` |
| FR-034 | Customer creates support ticket | `backend/18` | `frontend/10` | POST /api/support/tickets | supportTickets | — |
| FR-035 | Admin manages support with SLA | `backend/23` | `admin/14` | PATCH /api/admin/support/tickets/[id] | supportTickets | — |
| FR-036 | Admin manages service catalogue | `backend/23` | `admin/06` | POST/PATCH /api/admin/services | services, servicePackages | — |
| FR-037 | Admin manages coupons | `backend/23` | `admin/12` | POST/PATCH /api/admin/coupons | coupons | — |
| FR-038 | WhatsApp notifications all events | `backend/19` | — | (event-triggered) | notifications | — |
| FR-039 | SMS OTP primary + fallback | `backend/02` | — | POST /api/auth/send-otp | — | — |
| FR-040 | FCM push for job offer | `backend/19` | `professional/06` | (push) | — | — |
| FR-041 | Professional sets availability | `backend/06` | `professional/05` | PATCH /api/professionals/[id]/availability | professionalAvailability | — |
| FR-042 | Prevent booking in unavailable slots | `backend/10` | `frontend/06` | GET /api/availability | — | `booking.test.js` |
| FR-043 | Customer saves multiple addresses | `backend/04` | `frontend/10` | POST /api/customers/[id]/addresses | addresses | — |
| FR-044 | Human-readable booking number | `backend/08` | — | POST /api/bookings | bookings.bookingNumber | — |
| FR-045 | Admin live bookings dashboard | `backend/23` | `admin/02` | GET /api/admin/dashboard | — | — |
| FR-046 | Admin action audit logging | `backend/25` | `admin/19` | GET /api/admin/audit-logs | auditLogs | — |
| FR-047 | Professional sees earnings | `backend/16` | `professional/11` | GET /api/professionals/[id]/earnings | professionalEarnings | — |
| FR-048 | Weekly payout settlement | `backend/16` | `admin/15` | POST /api/admin/payouts/run-weekly | professionalPayouts | — |
| FR-049 | Auto-suspend low-rated professional | `backend/17` | — | (triggered on review) | professionals | — |
| FR-050 | Customer shares booking tracking link | `backend/20` | `frontend/08` | GET /api/bookings/[id]/track | bookings.shareToken | — |

---

## Non-Functional Requirements

| Requirement | Implementation | Prompt |
|---|---|---|
| API response < 500ms (p95) | MongoDB indexes, lean queries | `backend/27`, `backend/29` |
| Homepage < 2s on 4G | ISR/SSG, image optimization, CDN cache | `frontend/03` |
| 99.5% uptime | Vercel + MongoDB Atlas M2 | Deployment config |
| Rate limiting | `src/lib/rateLimit.js` | `backend/01`, `backend/29` |
| PII encryption | Mongoose field-level + Cloudinary private | `backend/26`, `backend/29` |
| DPDP Act 2023 compliance | Data minimization, consent, deletion flow | `backend/29`, legal review |
| Webhook idempotency | Event ID check + DB flag | `backend/14`, `backend/19` |
| IDOR prevention | Ownership checks on all resources | `backend/29` |
| Input sanitization | Zod validation + mongo operator stripping | `backend/01`, `backend/29` |
| No stack traces in errors | Error handler | `backend/01` |

---

## Business Requirements

| Requirement | Prompt(s) |
|---|---|
| 75% professional payout | `backend/12`, `backend/16` |
| ₹29 convenience fee | `backend/12` |
| Dispatch in < 5 minutes | `backend/11` |
| 3-minute professional response window | `backend/11` |
| WhatsApp for all booking events | `backend/19` |
| One review per booking | `backend/17` |
| Cancellation fee policy | `backend/15` |
| Manual dispatch on escalation | `backend/11`, `admin/09` |
| Professional KYC before activation | `backend/07`, `admin/05` |
| Admin RBAC | `backend/23`, `admin/21` |
| Audit log immutability | `backend/25` |
| Weekly professional payouts | `backend/16`, `admin/15` |

---

## Out of Scope (Not in Any Prompt)

| Feature | Reason |
|---|---|
| Live map tracking (V1) | Use polling instead (simpler for Vercel) |
| Wallet / loyalty | V2 feature |
| Referral system | V2 feature |
| Multi-city | V2 feature |
| React Native | V3 — PWA first |
| WebSockets/SSE | Not compatible with Vercel serverless in MVP |
| Microservices | Not needed until 50k+ bookings/month |
| Elasticsearch | MongoDB text search sufficient for MVP |
| Redis/BullMQ | In-memory rate limit + DB polling for dispatch (MVP) |
| DigiLocker Aadhaar verification | Future integration |
| Wedding package flow | V2 |
| Subscription/membership | V2 |
