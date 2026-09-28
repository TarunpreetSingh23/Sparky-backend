# 10 — Availability Engine

## 1. Role
You are a senior backend engineer implementing the slot availability engine for Sparky.

## 2. Objective
Build an efficient slot availability checking system that quickly (<200ms) computes which 1-hour time slots are available for a given service and date in a specific city.

## 3. Read Before Coding
- `doc8_database_specification.md`
- `doc9_10_11_api_booking_payment.md`
- `MASTER_IMPLEMENTATION_BLUEPRINT.md`

## 4. Existing Architecture
- Next.js App Router API route structure
- MongoDB Atlas with Mongoose
- Standard API response format: `{ success: true, data: {...} }` or `{ success: false, error: "...", code: "ERROR_CODE" }`

## 5. Requirements
- GET `/api/availability` returns 1-hour time slots (09:00-18:00) available for a date, service, city.
- Available means at least 1 eligible professional can fulfill it.
- Eligible professional: matches city, has required skill, is active/verified.
- Slot check logic:
  - Check professional's weekly schedule for that day.
  - Check existing confirmed/in-progress bookings for slot conflicts.
  - Conflict buffer: service duration + 30 min travel.
- Slot X conflict rule: Professional cannot take slot X if they have a booking from `X - duration` to `X + duration + 30min`.
- GET `/api/availability/slots` returns all slots for a date range.
- Must use MongoDB aggregation for <200ms performance.

## 6. Database Changes
- Ensure `ProfessionalAvailability` model interactions are optimized.

## 7. API Requirements
- `GET /api/availability`
  - Query: `date=YYYY-MM-DD`, `serviceId=xxx`, `city=amritsar`
  - Auth: None needed.
  - Response: `{ success: true, data: ["09:00", "10:00"] }`
- `GET /api/availability/slots`
  - Query: `startDate`, `endDate`, `serviceId`, `city`
  - Response: `{ success: true, data: { "YYYY-MM-DD": ["09:00"], ... } }`

## 8. Business Logic
1. Find professionals in city with required skills.
2. For each, check weekly schedule for the day.
3. Check existing confirmed bookings.
4. Apply buffer (duration + 30 min) to detect conflicts.
5. If at least 1 pro is available for a slot, return it.

## 9. Validation
- Validate date format (YYYY-MM-DD). Must not be in the past.
- Validate `serviceId` format.

## 10. Security
- Public endpoint, needs rate limiting (e.g., standard next.js rate limiting config if any).

## 11. Error Handling
- Invalid date: `400 INVALID_DATE`
- Missing params: `400 MISSING_PARAMS`

## 12. Edge Cases
- No professionals in city.
- Professionals have overlapping existing bookings.

## 13. Frontend Requirements (if applicable)
- N/A

## 14. Backend Requirements (if applicable)
- Create `src/services/availabilityService.js`.

## 15. Testing
- Test slot conflict logic extensively.

## 16. Files To Create
- `src/app/api/availability/route.js`
- `src/app/api/availability/slots/route.js`
- `src/services/availabilityService.js`

## 17. Files To Modify
- None

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- Build passes.
- API returns correctly formatted slots under 200ms.

## Acceptance Criteria
- [ ] Availability calculates with duration + 30m buffer
- [ ] Aggregation is used for performance
- [ ] Proper error codes are returned
