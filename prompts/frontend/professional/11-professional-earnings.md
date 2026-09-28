# 11 — Professional Earnings

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the earnings overview.

## 3. Read Before Coding
- `src/lib/api.js`

## 4. Existing Architecture
Next.js App Router.

## 5. Requirements
- Route: `/earnings`.
- EarningsSummary (today, this week, this month).
- EarningsChart (last 7 days).
- BookingEarningsList (gross, net, bonus).

## 6. Database Changes
None.

## 7. API Requirements
- `GET /api/professionals/[id]/earnings`

## 8. Business Logic
- Professional payout is 75% of service price.

## 9. Validation
- Date range filter validation.

## 10. Security
- Protected route.

## 11. Error Handling
- Chart fallback on empty data.

## 12. Edge Cases
- No earnings yet.

## 13. Frontend Requirements
- `app/earnings/page.js`

## 14. Backend Requirements
- Aggregation API.

## 15. Testing
- Accurate calculations.

## 16. Files To Create
- `src/app/earnings/page.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Summaries load correctly.
- [ ] Chart renders earnings history.
