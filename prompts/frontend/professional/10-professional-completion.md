# 10 — Professional Completion

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the service completion flow.

## 3. Read Before Coding
- `src/lib/api.js`

## 4. Existing Architecture
Next.js App Router.

## 5. Requirements
- Route: `/jobs/[bookingId]/complete`.
- Ask for customer completion code.
- CustomerOTPEntry (4-digit).
- Auto-confirm if customer unreachable (30 min).

## 6. Database Changes
None.

## 7. API Requirements
- `POST /api/bookings/[id]/complete`

## 8. Business Logic
- Success shows earnings earned.

## 9. Validation
- OTP exactly 4 digits.

## 10. Security
- Validate completion OTP server-side.

## 11. Error Handling
- Wrong OTP alert.

## 12. Edge Cases
- Customer not home to give OTP.

## 13. Frontend Requirements
- `app/jobs/[bookingId]/complete/page.js`

## 14. Backend Requirements
- Complete API verifies OTP.

## 15. Testing
- OTP validation.

## 16. Files To Create
- `src/app/jobs/[bookingId]/complete/page.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Submits OTP correctly.
- [ ] Shows earnings upon success.
