# 14 — Payment System (Razorpay)

## 1. Role
You are a senior backend security and payments engineer integrating Razorpay.

## 2. Objective
Build a secure, idempotent payment integration using Razorpay to handle order creation, verification, and webhooks.

## 3. Read Before Coding
- `doc9_10_11_api_booking_payment.md`
- `doc8_database_specification.md`

## 4. Existing Architecture
- Next.js API Routes.
- Prices in paise.
- Payment model per doc8.

## 5. Requirements
- 3 core APIs: Order Create, Verify, Webhook.
- Re-calculate price on server before creating Razorpay order. NEVER trust client total.
- Create Razorpay order via SDK, save `razorpayOrderId` to Payment document. Return `{razorpayOrderId, amount, currency, keyId}` (NEVER return `keySecret`).
- Verify HMAC: `SHA256(orderId + '|' + paymentId, keySecret)`.
- Webhook HMAC must use RAW BODY.
- Idempotency is crucial for Verify and Webhook.
- Trigger `dispatchBooking()` upon successful capture.

## 6. Database Changes
- Create/Ensure `Payment` model has `razorpayOrderId`, `razorpayPaymentId`, `status`, `refunds` array.

## 7. API Requirements
- `POST /api/payments/create-order`
  - Body: `{ bookingId }`
  - Auth: Customer
- `POST /api/payments/verify`
  - Body: `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`
- `POST /api/payments/webhook`
  - Headers: `X-Razorpay-Signature`

## 8. Business Logic
- `verify`: Check signature. If success -> status 'captured' -> `Booking` status `PAYMENT_CONFIRMED` -> trigger `dispatchBooking()`.
- `webhook`: Handle `payment.captured`, `payment.failed`, `refund.processed`.

## 9. Validation
- Verify ownership of booking in `create-order`.

## 10. Security
- Raw body parsing for webhook. Next.js config `export const dynamic = 'force-dynamic'` and stream readers for raw body.
- Secret keys handled via env variables.

## 11. Error Handling
- Signature mismatch: `400 INVALID_SIGNATURE`
- Invalid state transition: `400 INVALID_STATE`

## 12. Edge Cases
- Webhook arrives before client verification (idempotency handles this by checking if already 'captured').

## 13. Frontend Requirements (if applicable)
- N/A

## 14. Backend Requirements (if applicable)
- `src/services/paymentService.js`
- `src/lib/razorpay.js`

## 15. Testing
- Mock Razorpay SDK and test signature validation logic.

## 16. Files To Create
- `src/app/api/payments/create-order/route.js`
- `src/app/api/payments/verify/route.js`
- `src/app/api/payments/webhook/route.js`
- `src/services/paymentService.js`
- `src/lib/razorpay.js`

## 17. Files To Modify
- None

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- Payment flow works securely.

## Acceptance Criteria
- [ ] create-order never exposes keySecret
- [ ] verify strictly checks HMAC
- [ ] webhook reads raw body and handles idempotency
- [ ] dispatchBooking is triggered on payment confirmation
