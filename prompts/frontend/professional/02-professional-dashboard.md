# 02 — Professional Dashboard

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the main professional dashboard to display current status, today's jobs, and earnings.

## 3. Read Before Coding
- `src/lib/auth.js`
- `src/lib/api.js`

## 4. Existing Architecture
Next.js App Router. Mobile-first UI. JWT auth.

## 5. Requirements
- Route: `/`
- OnlineToggle: large toggle for active status.
- TodayStats: Jobs today, earnings today, completion rate.
- TodayJobsList: Upcoming jobs sorted by time.
- NextJobCard: Highlighted job with countdown timer.
- EarningsPreview: Week's earnings.
- Real-time: Poll `GET /api/professionals/[id]/jobs?date=today` every 30s when online.

## 6. Database Changes
None.

## 7. API Requirements
- `GET /api/professionals/[id]/jobs?date=today`

## 8. Business Logic
- Online status controls visibility to dispatch.

## 9. Validation
- Ensure stats do not display negative values.

## 10. Security
- Route protected.

## 11. Error Handling
- Show toast on polling failure.

## 12. Edge Cases
- Empty state: no jobs today.

## 13. Frontend Requirements
- `app/page.js`
- `components/dashboard/OnlineToggle.js`
- `components/dashboard/TodayStats.js`

## 14. Backend Requirements
- Implement GET endpoint.

## 15. Testing
- Test polling interval.

## 16. Files To Create
- `src/app/page.js`
- `src/components/dashboard/*`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Dashboard shows stats.
- [ ] Online toggle updates status.
- [ ] Polling works every 30s.
