# 22 — Safety System

## 1. Role
You are a senior backend engineer implementing the SOS and safety logging system.

## 2. Objective
Build reporting and emergency tools for both customers and professionals during a booking.

## 3. Read Before Coding
- `src/models/Booking.js`

## 4. Existing Architecture
Next.js API. MongoDB.

## 5. Requirements
- Model `SafetyIncident`.
- Regular reporting and SOS (one-tap emergency).
- Customer address obfuscation until booking accepted.
- OTP override by admin on failure.

## 6. Database Changes
```javascript
const safetyIncidentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  reporterRole: { type: String, enum: ['Customer', 'Professional'], required: true },
  incidentType: { type: String, enum: ['customer_threat', 'professional_threat', 'inappropriate_behaviour', 'property_damage', 'medical_emergency', 'other'] },
  description: String,
  evidenceUrls: [String],
  status: { type: String, enum: ['reported', 'investigating', 'resolved'], default: 'reported' },
  priority: { type: String, enum: ['medium', 'high', 'critical'], required: true },
  adminNotes: String,
  location: { type: [Number] } // GPS at time of SOS
}, { timestamps: true });
```

## 7. API Requirements
- `POST /api/safety/report` (Standard reporting)
- `POST /api/safety/emergency` (SOS tap, sets priority=critical)

## 8. Business Logic
- SOS creates critical incident, triggers immediate admin notification (simulated via console log / Slack stub).
- Customer full address only returned to professional if `status >= PROFESSIONAL_ACCEPTED`.

## 9. Validation
- Booking ID must belong to user.

## 10. Security
- Prevent unauthorized users from reporting on random bookings.

## 11. Error Handling
- `BOOKING_NOT_FOUND`
- `UNAUTHORIZED_ACTION`

## 12. Edge Cases
- Multiple rapid SOS taps (rate limit / deduplicate).

## 13. Frontend Requirements (if applicable)
N/A

## 14. Backend Requirements (if applicable)
- Address masking utility function.

## 15. Testing
- Verify full address is masked in API responses for search phase.

## 16. Files To Create
- `src/models/SafetyIncident.js`
- `src/app/api/safety/report/route.js`
- `src/app/api/safety/emergency/route.js`

## 17. Files To Modify
- `src/app/api/bookings/[id]/route.js` (apply address masking logic).

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- Address masking and SOS endpoints working.

## Acceptance Criteria
- [ ] SOS endpoint successfully creates critical incident.
- [ ] Address is masked for pending bookings.
- [ ] Standard safety report created with evidence.
