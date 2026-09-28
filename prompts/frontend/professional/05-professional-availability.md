# 05 — Professional Availability

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the availability management view.

## 3. Read Before Coding
- `src/lib/auth.js`

## 4. Existing Architecture
Next.js App Router.

## 5. Requirements
- Route: `/availability`.
- WeeklyScheduleGrid, BlockedDatesCalendar, DateOverrideForm.
- Save: `PATCH /api/professionals/[id]/availability`.

## 6. Database Changes
None.

## 7. API Requirements
- `PATCH /api/professionals/[id]/availability`

## 8. Business Logic
- Cannot block dates with existing confirmed bookings.

## 9. Validation
- Start time < End time.

## 10. Security
- Protected route.

## 11. Error Handling
- Alert if blocking a date with jobs.

## 12. Edge Cases
- Midnight shifts.

## 13. Frontend Requirements
- `app/availability/page.js`

## 14. Backend Requirements
- Availability API logic.

## 15. Testing
- Check conflict prevention.

## 16. Files To Create
- `src/app/availability/page.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Can set weekly schedule.
- [ ] Blocks conflict on dates with jobs.
