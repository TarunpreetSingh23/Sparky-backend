# 06 — Professionals

## 1. Role
Backend Developer & Architect

## 2. Objective
Implement the professional profile management APIs (availability, status, location tracking, earnings) and schemas.

## 3. Read Before Coding
- `c:/RAG-frontend/mdfile/doc8_database_specification.md`
- `c:/RAG-frontend/mdfile/MASTER_IMPLEMENTATION_BLUEPRINT.md`

## 4. Existing Architecture
- Professional model created in step 03.
- Next.js API Routes.

## 5. Requirements
- Allow professionals to update bio, availability settings, skills.
- Implement toggle online/offline status API.
- Implement GPS location update API (used during active jobs).
- Implement Earnings API.

## 6. Database Changes
```javascript
// models/ProfessionalAvailability.js
const availabilitySchema = new mongoose.Schema({
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true, unique: true },
  weeklySchedule: [{
    dayOfWeek: { type: Number, required: true }, // 0 = Sunday, 1 = Monday
    isWorking: { type: Boolean, default: true },
    startTime: { type: String, default: "09:00" }, // HH:mm
    endTime: { type: String, default: "18:00" },
    breaks: [{ start: String, end: String }]
  }],
  blockedDates: [Date],
  dateOverrides: [{
    date: Date,
    isWorking: Boolean,
    startTime: String,
    endTime: String
  }]
}, { timestamps: true });
```

## 7. API Requirements
- `GET /api/professionals/[id]`
  Public profile info (rating, bio, reviews).
- `PATCH /api/professionals/[id]`
  Auth: Owner only. Update basic non-critical fields.
- `PATCH /api/professionals/[id]/status`
  Body: `{ isOnline: boolean }`.
- `POST /api/professionals/[id]/location`
  Body: `{ lat, lng }`. Rate limit: 1 per 20s. Allowed only if status is PROFESSIONAL_ACCEPTED through SERVICE_STARTED.
- `GET /api/professionals/[id]/earnings`
  Query: `startDate`, `endDate`.
- `GET /api/professionals/[id]/availability`

## 8. Business Logic
- Location updates must update `Professional.currentLocation`. Ensure geospatial indexing exists.
- Earnings endpoint needs to aggregate completed bookings for the specified date range. (Stub aggregation for now if Bookings model doesn't exist).

## 9. Validation
- Prevent location updates if the professional has no active booking in transit/started.

## 10. Security
- Professional can only modify their own data. Admin can modify any.

## 11. Error Handling
- `NOT_ACTIVE_JOB` 403 (for location update)
- `INVALID_COORDINATES` 400

## 12. Edge Cases
- Date overlaps in blockedDates.

## 13. Frontend Requirements
N/A

## 14. Backend Requirements
- Implement route rate limiter for location update API (1/20s).

## 15. Testing
- Verify owner vs admin access patterns.

## 16. Files To Create
- `src/models/ProfessionalAvailability.js`
- `src/app/api/professionals/[id]/status/route.js`
- `src/app/api/professionals/[id]/location/route.js`
- `src/app/api/professionals/[id]/earnings/route.js`
- `src/app/api/professionals/[id]/availability/route.js`

## 17. Files To Modify
- `src/app/api/professionals/[id]/route.js` (add logic)

## 18. Files NOT To Modify
None

## 19. Completion Requirements
All APIs handle valid/invalid states accurately. Rate limiter applied.

## Acceptance Criteria
- [ ] ProfessionalAvailability schema created.
- [ ] Profile PATCH API built with owner restriction.
- [ ] Status toggle API implemented.
- [ ] Location update API implemented with active job validation and rate limiting.
- [ ] Earnings API built with date range filters.
