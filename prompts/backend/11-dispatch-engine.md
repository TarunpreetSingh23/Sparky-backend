# 11 — Dispatch Engine

## 1. Role
You are a senior backend engineer implementing the core dispatch engine for the Sparky marketplace.

## 2. Objective
Build the automated professional assignment system triggered after payment confirmation, utilizing a weighted scoring algorithm to dispatch jobs sequentially.

## 3. Read Before Coding
- `doc9_10_11_api_booking_payment.md`
- `MASTER_IMPLEMENTATION_BLUEPRINT.md`

## 4. Existing Architecture
- Next.js App Router API route structure
- MongoDB Atlas with Mongoose

## 5. Requirements
- Implement the exact scoring algorithm:
  `ProfessionalScore = (DistanceScore×0.30) + (AvailabilityScore×0.20) + (SkillScore×0.15) + (RatingScore×0.20) + (ReliabilityScore×0.10) + (WorkloadScore×0.05) × PriorityMultiplier`
- Exact score functions must match doc9.
- Dispatch flow:
  1. Query eligible professionals (city match, skill match, online, verified/active, not busy).
  2. Score and sort top candidates.
  3. Send job notification to #1, set 3-minute timeout via `setTimeout` + DB polling (poll `responseDeadline` flag every 5 seconds for up to 180s). Do NOT use Redis/BullMQ.
  4. If accepted → `PROFESSIONAL_ACCEPTED`.
  5. If declined/timeout → try next.
  6. After 3 failures → `escalateToManualDispatch()`.
  7. After 15min total → `NO_PROFESSIONAL_AVAILABLE` + auto-refund.
- Manual dispatch: admin API to manually assign professional.
- No-professional flow: full refund + WhatsApp notification.
- Dispatch is triggered by `dispatchBooking(bookingId)` from payment verification.

## 6. Database Changes
- Booking Model:
  - Add `responseDeadline` (Date)
  - Add `dispatchAttempts` (Number)

## 7. API Requirements
- `POST /api/professionals/[id]/jobs/[jid]/accept`
- `POST /api/professionals/[id]/jobs/[jid]/decline`
- `POST /api/admin/bookings/[id]/manual-dispatch`

## 8. Business Logic
- `waitForResponse` implementation: poll DB every 5 seconds checking if booking status changed.
- Calculate scores strictly based on defined weights.

## 9. Validation
- Professional must be the one assigned when accepting/declining.

## 10. Security
- Only assigned professional can accept/decline. JWT required.

## 11. Error Handling
- Professional not found: `404 PRO_NOT_FOUND`
- Job not found or already assigned: `400 JOB_UNAVAILABLE`

## 12. Edge Cases
- Professional goes offline during dispatch.
- Server restart during `setTimeout` (will fail gracefully to manual dispatch upon manual check, but for MVP keep it simple).

## 13. Frontend Requirements (if applicable)
- N/A

## 14. Backend Requirements (if applicable)
- Create `src/services/dispatchService.js`.
- Create `src/services/scoringService.js`.

## 15. Testing
- Test scoring algorithm math.
- Test 3-minute timeout flow.
- Test 3 failures escalating to manual.

## 16. Files To Create
- `src/services/dispatchService.js`
- `src/services/scoringService.js`
- `src/app/api/professionals/[id]/jobs/[jid]/accept/route.js`
- `src/app/api/professionals/[id]/jobs/[jid]/decline/route.js`
- `src/app/api/admin/bookings/[id]/manual-dispatch/route.js`

## 17. Files To Modify
- `src/models/Booking.js`

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- Build passes.
- Unit tests for score algorithm.

## Acceptance Criteria
- [ ] Scoring algorithm implemented exactly as specified
- [ ] Dispatch waits 3 minutes using DB polling
- [ ] Fails over to manual dispatch after 3 attempts
- [ ] Admin manual dispatch API works
