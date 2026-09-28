# 06 — Professional Bookings

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the job list and booking management view.

## 3. Read Before Coding
- `src/lib/api.js`

## 4. Existing Architecture
Next.js App Router.

## 5. Requirements
- Route: `/jobs`.
- JobTabs: New Offer, Upcoming, Active, Completed, Cancelled.
- JobCard: service, time, area, earnings.
- New job offer: countdown (3 min), accept/decline. Show area only, not full address.
- Poll every 5s for new offers when online.

## 6. Database Changes
None.

## 7. API Requirements
- `GET /api/professionals/[id]/jobs`
- `POST /api/bookings/[id]/accept`

## 8. Business Logic
- Acceptance shows full address.

## 9. Validation
- Offer expires after 3 minutes.

## 10. Security
- Protected route.

## 11. Error Handling
- Accept failure (e.g. taken by another).

## 12. Edge Cases
- App closed during offer.

## 13. Frontend Requirements
- `app/jobs/page.js`

## 14. Backend Requirements
- API handles accept status correctly.

## 15. Testing
- Polling for offers.

## 16. Files To Create
- `src/app/jobs/page.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Tabs filter correctly.
- [ ] Offers poll every 5s.
