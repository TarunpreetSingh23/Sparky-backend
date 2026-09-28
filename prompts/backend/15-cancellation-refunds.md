# 15 — Cancellation & Refunds

## 1. Role
You are a backend engineer handling order cancellations and refund flows.

## 2. Objective
Implement robust cancellation policies and integrate automated Razorpay refunds.

## 3. Read Before Coding
- `doc12_16_admin_safety_notifications_marketing_mvp.md`
- `MASTER_IMPLEMENTATION_BLUEPRINT.md`

## 4. Existing Architecture
- Razorpay API integration in Next.js.
- MongoDB Models (Booking, Payment).

## 5. Requirements
- Customer APIs and Admin APIs to cancel bookings.
- Cancellation policy: 
  - >4h before = 100% refund
  - <4h before = 80% refund
  - <1h before = 50% refund
- Professional cancels = 100% refund + ₹50 wallet credit.
- No professional found = 100% refund.
- Anyone can cancel before `SERVICE_STARTED` (Admin anytime).
- Refund flow uses Razorpay SDK `razorpay.payments.refund(paymentId, {amount, reason})`.
- Refund failures retry 3 times.

## 6. Database Changes
- Wallet updates if using wallet credit.
- `Payment.refunds` array for tracking refund records.
- Professional model `cancellationRate` tracking.

## 7. API Requirements
- `POST /api/bookings/[id]/cancel` (Auth: Customer/Professional)
- `PATCH /api/admin/bookings/[id]/cancel` (Auth: Admin)

## 8. Business Logic
- Calculate exact difference in hours from `now()` to `bookingStartTime`.
- Calculate `refundAmount` in paise based on policy.
- Hit Razorpay Refund API. Update status to `REFUND_PENDING`.
- Webhook `refund.processed` moves it to `REFUNDED`.

## 9. Validation
- Prevent cancellation if `status === SERVICE_STARTED` (except Admin).

## 10. Security
- Verify user owns the booking.

## 11. Error Handling
- Cannot cancel: `400 CANCELLATION_NOT_ALLOWED`
- Refund fail: Alert admin, log failure.

## 12. Edge Cases
- Free bookings (no payment to refund).
- Razorpay API downtime (need retry mechanism or manual fallback).

## 13. Frontend Requirements (if applicable)
- N/A

## 14. Backend Requirements (if applicable)
- `src/services/cancellationService.js`
- `src/services/refundService.js`

## 15. Testing
- Mock time to test different cancellation windows.

## 16. Files To Create
- `src/app/api/bookings/[id]/cancel/route.js`
- `src/app/api/admin/bookings/[id]/cancel/route.js`
- `src/services/cancellationService.js`
- `src/services/refundService.js`

## 17. Files To Modify
- `src/models/Payment.js`
- `src/models/User.js` (for wallet/cancellationRate)

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- Full cancellation policy correctly applies percentages.

## Acceptance Criteria
- [ ] >4h returns 100%, <4h returns 80%, <1h returns 50%
- [ ] Razorpay refund API is called correctly
- [ ] Refund status flows PENDING -> REFUNDED via webhook
