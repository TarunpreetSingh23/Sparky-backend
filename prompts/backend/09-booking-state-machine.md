# 09 — Booking State Machine

## 1. Role
Backend Developer & Architect

## 2. Objective
Implement the highly critical 18-state booking state machine. Ensure strict transition rules, OTP validations, and automated hooks for state changes.

## 3. Read Before Coding
- `c:/RAG-frontend/mdfile/doc9_10_11_api_booking_payment.md`

## 4. Existing Architecture
- Booking model created in step 08.
- Next.js API Routes.

## 5. Requirements
- Centralized `transitionBookingStatus` function.
- APIs for specific state transitions (Arrive, Start, Complete).
- Admin override API.
- OTP validations (max 3 attempts).
- Auto-transitions.

## 6. Database Changes
- None (Booking schema already defined).

## 7. API Requirements
- `POST /api/bookings/[id]/arrive`
  Auth: Professional.
- `POST /api/bookings/[id]/start`
  Auth: Professional. Body: `{ otp }`
- `POST /api/bookings/[id]/complete`
  Auth: Professional. Body: `{ otp }` (Customer provides OTP).
- `PATCH /api/admin/bookings/[id]`
  Auth: Admin. Body: `{ status, reason }`

## 8. Business Logic
- `transitionBookingStatus(bookingId, newStatus, triggeredBy, reason)`:
  1. Validates if transition is allowed based on table (e.g. PAYMENT_CONFIRMED -> SEARCHING_PROFESSIONAL).
  2. Updates `status`.
  3. Appends strictly to `statusHistory` (DO NOT overwrite).
  4. Fires async hooks (e.g., if CANCELLED, fire refund trigger).
- OTP Validation: Start OTP required to transition to `SERVICE_STARTED`. Complete OTP required for `SERVICE_COMPLETED`.
- Max 3 invalid OTP attempts -> Alert admin.
- Auto-transitions:
  - `CUSTOMER_CONFIRMED` -> `COMPLETED` immediately.
  - `SERVICE_COMPLETED` -> `CUSTOMER_CONFIRMED` automatically after 30 mins if no action.

## 9. Validation
- State table validation strictly enforced (reject invalid paths).

## 10. Security
- Only assigned Professional can trigger arrive/start/complete.

## 11. Error Handling
- `INVALID_TRANSITION` 422
- `INVALID_OTP` 400
- `MAX_OTP_ATTEMPTS_EXCEEDED` 403

## 12. Edge Cases
- Admin forcing a status change bypassing normal flow.

## 13. Frontend Requirements
N/A

## 14. Backend Requirements
- `src/lib/bookingStateMachine.js` holding the configuration and transition function.

## 15. Testing
- Verify all happy paths in transition table.
- Verify invalid transitions are rejected.
- Test OTP hashing match.

## 16. Files To Create
- `src/lib/bookingStateMachine.js`
- `src/app/api/bookings/[id]/arrive/route.js`
- `src/app/api/bookings/[id]/start/route.js`
- `src/app/api/bookings/[id]/complete/route.js`
- `src/app/api/admin/bookings/[id]/route.js`

## 17. Files To Modify
- None

## 18. Files NOT To Modify
- Booking Schema

## 19. Completion Requirements
State machine perfectly guards the booking lifecycle and handles OTPs securely.

## Acceptance Criteria
- [ ] Central `transitionBookingStatus` function created with strict transition rules.
- [ ] History append logic ensured on every status change.
- [ ] Arrive API created.
- [ ] Start API created with startOtp bcrypt validation and max attempt tracking.
- [ ] Complete API created with completeOtp bcrypt validation.
- [ ] Admin API implemented allowing manual status overrides.
- [ ] Automated transition functions stubbed for cron/timeout events.
