# 13 — Professional Performance

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the performance dashboard.

## 3. Read Before Coding
- `src/lib/api.js`

## 4. Existing Architecture
Next.js App Router.

## 5. Requirements
- Route: `/performance`.
- RatingDisplay (star, reviews count).
- AcceptanceRateBar, CompletionRateBar.
- ReviewsList.

## 6. Database Changes
None.

## 7. API Requirements
- `GET /api/professionals/[id]/performance`

## 8. Business Logic
- Warnings if metrics fall below threshold.

## 9. Validation
- Ensure 0-5 stars display.

## 10. Security
- Protected route.

## 11. Error Handling
- Missing reviews fallback.

## 12. Edge Cases
- New professional with no data.

## 13. Frontend Requirements
- `app/performance/page.js`

## 14. Backend Requirements
- Performance endpoint.

## 15. Testing
- Threshold alerts.

## 16. Files To Create
- `src/app/performance/page.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Shows warnings for low performance.
- [ ] Badges load correctly.
