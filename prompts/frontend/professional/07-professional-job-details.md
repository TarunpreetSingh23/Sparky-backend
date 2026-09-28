# 07 — Professional Job Details

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the detailed view for a single job/booking.

## 3. Read Before Coding
- `src/lib/api.js`

## 4. Existing Architecture
Next.js App Router.

## 5. Requirements
- Route: `/jobs/[bookingId]`.
- Shows customer area, service, package, addons, scheduled time, earnings.
- Actions based on status.
- Cannot see customer name/phone until arrived.

## 6. Database Changes
None.

## 7. API Requirements
- `GET /api/bookings/[id]`

## 8. Business Logic
- Protect customer details pre-arrival.

## 9. Validation
- Status-driven UI.

## 10. Security
- Only assigned professional can view details.

## 11. Error Handling
- Booking not found -> 404.

## 12. Edge Cases
- Booking cancelled while viewing.

## 13. Frontend Requirements
- `app/jobs/[bookingId]/page.js`

## 14. Backend Requirements
- Data scrubbing for privacy.

## 15. Testing
- View pre and post arrival.

## 16. Files To Create
- `src/app/jobs/[bookingId]/page.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Details load correctly.
- [ ] Customer info hidden before arrival.
