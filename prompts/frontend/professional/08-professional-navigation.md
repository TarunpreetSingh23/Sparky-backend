# 08 — Professional Navigation

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the navigation assistance view during travel.

## 3. Read Before Coding
- `src/lib/api.js`

## 4. Existing Architecture
Next.js App Router. Mobile-first.

## 5. Requirements
- Route: `/jobs/[bookingId]/navigate`.
- NavigateButton (opens Maps), ArrivalButton.
- Location sharing: POST /api/professionals/[id]/location every 30s.

## 6. Database Changes
None.

## 7. API Requirements
- `POST /api/professionals/[id]/location`

## 8. Business Logic
- Stop tracking when ARRIVED.

## 9. Validation
- GPS permission check.

## 10. Security
- Secure location endpoints.

## 11. Error Handling
- GPS denied error handling.

## 12. Edge Cases
- Background tracking limits in browser.

## 13. Frontend Requirements
- `app/jobs/[bookingId]/navigate/page.js`

## 14. Backend Requirements
- Location update API.

## 15. Testing
- GPS permission prompt and location updates.

## 16. Files To Create
- `src/app/jobs/[bookingId]/navigate/page.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Opens native maps with coordinates.
- [ ] Posts location every 30s.
