# 09 — Professional Active Job

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the active job management view during service.

## 3. Read Before Coding
- `src/lib/api.js`

## 4. Existing Architecture
Next.js App Router.

## 5. Requirements
- Route: `/jobs/[bookingId]/active`.
- OTPEntryForm for START OTP (4-digit).
- ServiceTimer counts up.
- ServiceChecklist.

## 6. Database Changes
None.

## 7. API Requirements
- `POST /api/bookings/[id]/start`

## 8. Business Logic
- Move to SERVICE_STARTED on correct OTP.

## 9. Validation
- Max 3 OTP attempts.

## 10. Security
- Validate OTP server-side.

## 11. Error Handling
- Show remaining attempts on wrong OTP.

## 12. Edge Cases
- Page refresh during service.

## 13. Frontend Requirements
- `app/jobs/[bookingId]/active/page.js`

## 14. Backend Requirements
- Start API checks OTP.

## 15. Testing
- OTP flow and timer persistence.

## 16. Files To Create
- `src/app/jobs/[bookingId]/active/page.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Timer starts on correct OTP.
- [ ] Wrong OTP tracks attempts.
