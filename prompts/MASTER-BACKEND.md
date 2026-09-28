# MASTER-BACKEND — Sparky Backend Implementation Guide

## Role

You are a senior backend engineer implementing the complete Sparky backend. Read this document before starting any backend implementation.

---

## Implementation Order

Execute prompts in this EXACT sequence. Do not skip. Do not parallelize unless explicitly allowed.

```
01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25 → 26 → 27 → 28 → 29 → 30
```

### Allowed Parallel Pairs (after dependencies met)
- `12` and `13` can run in parallel after `08`
- `17` and `18` can run in parallel after `09`
- `20` and `21` can run in parallel after `11`
- `24`, `25`, `26`, `27`, `28` can all run in parallel after `23`

---

## Before Starting Any Prompt

1. **Read `shared/01-api-contracts.md`** — every API must follow this format
2. **Read `shared/09-security-rules.md`** — every endpoint must comply
3. **Read `shared/03-authentication-contract.md`** — auth used everywhere
4. **Read the specific prompt** — fully before writing any code
5. **Read all files listed in "Read Before Coding"** section of the prompt

---

## Rules (Non-Negotiable)

### Rule 1 — One Prompt at a Time
Complete each prompt fully before starting the next. Run build after each.

### Rule 2 — Inspect Before Editing
```bash
# Before modifying any existing file, read it
# Never assume what's in an existing file
```

### Rule 3 — Never Break Existing Functionality
If you are modifying an existing file, ensure all existing tests still pass.

### Rule 4 — All Prices in Paise
```javascript
// CORRECT
const price = 34900; // ₹349

// WRONG
const price = 349.00; // Never floats
const price = 34900.5; // Never decimals
```

### Rule 5 — Server Calculates Prices
```javascript
// NEVER do this
const total = req.body.total; // ❌ Never trust client price

// ALWAYS do this
const total = await calculateBookingPrice(booking); // ✅
```

### Rule 6 — API Format
```javascript
// Success
return Response.json({ success: true, data: { ... } }, { status: 200 });

// Error
return Response.json({ success: false, error: "Human message", code: "MACHINE_CODE" }, { status: 400 });
```

### Rule 7 — Authentication
```javascript
// Every protected endpoint
const { user, error } = await requireAuth(req);
if (error) return error;

// With role check
const { user, error } = await requireRole(req, 'customer');
if (error) return error;

// Ownership check
if (booking.customerId.toString() !== user.userId) {
  return errorResponse('Not your booking', 'FORBIDDEN', 403);
}
```

### Rule 8 — Idempotency
Payment processing and webhook handling MUST be idempotent:
```javascript
// Check if already processed
const existing = await Payment.findOne({ razorpayPaymentId });
if (existing?.status === 'captured') {
  return successResponse({ already: true }); // Return success, don't reprocess
}
```

### Rule 9 — No Secrets in Code
```javascript
// WRONG
const secret = 'rzp_live_xxx123'; // ❌

// RIGHT
const secret = process.env.RAZORPAY_KEY_SECRET; // ✅
```

### Rule 10 — Error Handling
```javascript
try {
  await connectDB();
  // ... logic
} catch (error) {
  logger.error('Endpoint error', error, { endpoint: '/api/...' });
  return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
}
```

---

## After Each Prompt

```bash
# Must pass before moving to next prompt
npm run build
npm run lint
# If tests exist:
npm test
```

---

## File Structure (Target)

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── send-otp/route.js
│   │   │   ├── verify-otp/route.js
│   │   │   ├── me/route.js
│   │   │   ├── logout/route.js
│   │   │   └── refresh/route.js
│   │   ├── bookings/
│   │   │   ├── route.js          (GET list, POST create)
│   │   │   └── [id]/
│   │   │       ├── route.js      (GET detail)
│   │   │       ├── cancel/route.js
│   │   │       ├── reschedule/route.js
│   │   │       ├── start/route.js
│   │   │       ├── complete/route.js
│   │   │       ├── arrive/route.js
│   │   │       ├── status/route.js
│   │   │       └── track/route.js
│   │   ├── payments/
│   │   │   ├── create-order/route.js
│   │   │   ├── verify/route.js
│   │   │   └── webhook/route.js
│   │   ├── services/
│   │   │   ├── route.js
│   │   │   └── [slug]/route.js
│   │   ├── availability/route.js
│   │   ├── home/route.js
│   │   ├── search/route.js
│   │   ├── categories/route.js
│   │   ├── cities/route.js
│   │   ├── coupons/
│   │   │   ├── validate/route.js
│   │   │   └── my-coupons/route.js
│   │   ├── reviews/route.js
│   │   ├── customers/
│   │   │   └── [id]/
│   │   │       ├── route.js
│   │   │       ├── addresses/
│   │   │       │   ├── route.js
│   │   │       │   └── [addressId]/route.js
│   │   │       ├── wallet/route.js
│   │   │       └── referral/route.js
│   │   ├── professionals/
│   │   │   ├── register/route.js
│   │   │   └── [id]/
│   │   │       ├── route.js
│   │   │       ├── kyc/route.js
│   │   │       ├── status/route.js
│   │   │       ├── location/route.js
│   │   │       ├── jobs/
│   │   │       │   ├── route.js
│   │   │       │   └── [jid]/
│   │   │       │       ├── accept/route.js
│   │   │       │       └── decline/route.js
│   │   │       ├── earnings/route.js
│   │   │       ├── payouts/route.js
│   │   │       └── availability/route.js
│   │   ├── support/
│   │   │   └── tickets/
│   │   │       ├── route.js
│   │   │       └── [id]/
│   │   │           ├── route.js
│   │   │           └── messages/route.js
│   │   ├── notifications/
│   │   │   ├── route.js
│   │   │   ├── [id]/read/route.js
│   │   │   └── fcm-token/route.js
│   │   ├── safety/
│   │   │   ├── report/route.js
│   │   │   └── emergency/route.js
│   │   ├── upload/
│   │   │   ├── public/route.js
│   │   │   └── private/route.js
│   │   ├── analytics/
│   │   │   └── event/route.js
│   │   └── admin/
│   │       ├── dashboard/route.js
│   │       ├── bookings/
│   │       ├── customers/
│   │       ├── professionals/
│   │       ├── services/
│   │       ├── categories/
│   │       ├── coupons/
│   │       ├── payments/
│   │       ├── refunds/
│   │       ├── payouts/
│   │       ├── support/
│   │       ├── reviews/
│   │       ├── reports/
│   │       ├── analytics/
│   │       ├── audit-logs/
│   │       └── notifications/
├── lib/
│   ├── mongodb.js
│   ├── apiResponse.js
│   ├── validate.js
│   ├── auth.js
│   ├── rateLimit.js
│   ├── config.js
│   ├── logger.js
│   ├── cloudinary.js
│   ├── sms.js              (MSG91)
│   ├── priceCalculator.js
│   ├── dispatch.js
│   └── notifications/
│       ├── index.js
│       ├── whatsapp.js
│       ├── sms.js
│       ├── push.js
│       └── email.js
└── models/
    ├── User.js
    ├── OtpSession.js
    ├── Customer.js
    ├── Professional.js
    ├── ProfessionalDocuments.js
    ├── ProfessionalAvailability.js
    ├── Address.js
    ├── City.js
    ├── Zone.js
    ├── Category.js
    ├── Service.js
    ├── ServicePackage.js
    ├── ServiceAddon.js
    ├── Booking.js
    ├── Payment.js
    ├── ProfessionalEarning.js
    ├── ProfessionalPayout.js
    ├── Review.js
    ├── Coupon.js
    ├── CouponUsage.js
    ├── SupportTicket.js
    ├── Notification.js
    ├── LocationHistory.js
    ├── SafetyIncident.js
    ├── AuditLog.js
    └── AnalyticsEvent.js
```

---

## Testing Strategy

After all prompts are implemented, run:
```bash
npm run test          # Unit + API tests
npm run test:coverage # Coverage report (target: >70% on business logic)
npm run build         # Production build
npm run lint          # ESLint
```

Critical test files (must exist):
- `src/__tests__/auth.test.js`
- `src/__tests__/booking.test.js`
- `src/__tests__/pricing.test.js`
- `src/__tests__/payment.test.js`
- `src/__tests__/dispatch.test.js`
- `src/__tests__/cancellation.test.js`
