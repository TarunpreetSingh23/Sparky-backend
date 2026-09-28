# 21 — Professional Location Tracking

## 1. Role
You are a senior backend engineer implementing professional GPS tracking APIs.

## 2. Objective
Build an API to track professional location securely during active bookings, storing historical data for audit.

## 3. Read Before Coding
- `src/models/Professional.js`
- `src/models/Booking.js`

## 4. Existing Architecture
Next.js API. MongoDB.

## 5. Requirements
- Professionals update location every 20 seconds during active bookings.
- Current location in `Professional`, historical in `LocationHistory`.
- Purge location data 30 days post-booking for compliance.

## 6. Database Changes
```javascript
// Add to Professional.js
currentLocation: {
  coordinates: { type: [Number] }, // [lng, lat]
  updatedAt: Date
}

// src/models/LocationHistory.js
const locationHistorySchema = new mongoose.Schema({
  professionalId: { type: mongoose.Schema.Types.ObjectId, required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId },
  coordinates: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  recordedAt: { type: Date, default: Date.now },
  purgeEligibleAt: Date
});
locationHistorySchema.index({ professionalId: 1, recordedAt: -1 });
locationHistorySchema.index({ purgeEligibleAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
```

## 7. API Requirements
- `POST /api/professionals/[id]/location`
  - Body: `{ coordinates: [lng, lat] }`

## 8. Business Logic
- Check if professional has active booking (`PROFESSIONAL_ACCEPTED`, `ON_THE_WAY`, `ARRIVED`).
- If no active booking, reject update to save DB ops.
- Set `purgeEligibleAt = Date.now() + 30 days` when booking completes (in booking controller).

## 9. Validation
- GeoJSON coordinates validation ([lng, lat] between -180/180 and -90/90).

## 10. Security
- Only professional themselves can update their location.

## 11. Error Handling
- `NO_ACTIVE_BOOKING`
- `RATE_LIMIT_EXCEEDED`

## 12. Edge Cases
- Rate limit handling on frontend retries.

## 13. Frontend Requirements (if applicable)
N/A

## 14. Backend Requirements (if applicable)
- Location history controller.

## 15. Testing
- Invalid coordinates rejection.
- TTL index logic validation.

## 16. Files To Create
- `src/models/LocationHistory.js`
- `src/app/api/professionals/[id]/location/route.js`

## 17. Files To Modify
- `src/models/Professional.js`

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- Location endpoint saves to both models.

## Acceptance Criteria
- [ ] Only professionals with active bookings can send location.
- [ ] History is stored correctly.
- [ ] Fails on bad coordinates.
