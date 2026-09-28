# 28 - Reporting

## 1. Role
Backend Developer

## 2. Objective
Create downloadable reports (CSV/JSON) for admins for bookings, payments, earnings, and cancellations.

## 3. Read Before Coding
- Admin dashboard requirements.

## 4. Existing Architecture
- Next.js App Router
- MongoDB aggregation framework

## 5. Requirements
- Report endpoints for Bookings, Payments, Earnings, Cancellations, Retention.
- Support JSON (in-page) and CSV (download) formats via `format` query param.
- Rate limit: 1 report / minute / admin.
- Use simple template strings for CSV generation.
- Use Next.js streaming for large CSV payloads.

## 6. Database Changes
None.

## 7. API Requirements
Example: `GET /api/admin/reports/bookings?from=ISO&to=ISO&format=csv`
- Auth: Admin only
- Response: Streamed CSV file or JSON array.

## 8. Business Logic
- Use Mongoose `aggregate` or `find().cursor()` for large datasets.
- Earnings: calculate gross, commission (25%), net payout (75%), and convenience fees.

## 9. Validation
- `from` and `to` date validation.

## 10. Security
- Strict Admin RBAC.

## 11. Error Handling
- `DATE_RANGE_INVALID`
- `RATE_LIMIT_EXCEEDED`

## 12. Edge Cases
- Massive date ranges.

## 13. Frontend Requirements
- N/A

## 14. Backend Requirements
- Report generation services.

## 15. Testing
- CSV formatting check.
- Aggregation correctness.

## 16. Files To Create
- `src/app/api/admin/reports/bookings/route.js`
- `src/app/api/admin/reports/payments/route.js`
- `src/app/api/admin/reports/earnings/route.js`
- `src/app/api/admin/reports/cancellations/route.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- Core schemas.

## 19. Completion Requirements
- Run linter.

## Acceptance Criteria
- [ ] Admin can download CSV of bookings.
- [ ] Streaming used for large datasets.
- [ ] Rate limited to 1/min/admin.
