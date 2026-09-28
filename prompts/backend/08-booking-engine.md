# 08 — Booking Engine

## 1. Role
Backend Developer & Architect

## 2. Objective
Implement the core booking creation and retrieval system, emphasizing exact price calculations, address snapshots, and duplicate booking protection.

## 3. Read Before Coding
- `c:/RAG-frontend/mdfile/doc8_database_specification.md`
- `c:/RAG-frontend/mdfile/doc9_10_11_api_booking_payment.md`

## 4. Existing Architecture
- Mongoose, Next.js API Routes

## 5. Requirements
- Booking schema implementation.
- Booking creation API with idempotency check.
- Booking retrieval (single and list with filters).
- Reschedule API.
- Denormalize address during booking creation.

## 6. Database Changes
```javascript
// models/Booking.js
const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true }, // e.g. SP240215001
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServicePackage' },
  addonIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceAddon' }],
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional' },
  status: { type: String, enum: ['PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'SEARCHING_PROFESSIONAL', 'PROFESSIONAL_NOTIFIED', 'PROFESSIONAL_ACCEPTED', 'PROFESSIONAL_ON_THE_WAY', 'PROFESSIONAL_ARRIVED', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'CUSTOMER_CONFIRMED', 'COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROFESSIONAL', 'CANCELLED_BY_ADMIN', 'PAYMENT_FAILED', 'NO_PROFESSIONAL_AVAILABLE', 'REFUND_PENDING', 'REFUNDED', 'DISPUTED'], default: 'PAYMENT_PENDING' },
  scheduledDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  addressSnapshot: {
    addressLine1: String,
    addressLine2: String,
    landmark: String,
    city: String,
    coordinates: [Number]
  },
  pricing: {
    basePrice: Number, // paise
    addonsPrice: Number,
    convenienceFee: { type: Number, default: 2900 },
    discountAmount: Number,
    totalAmount: Number
  },
  paymentStatus: { type: String, enum: ['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  startOtp: String, // hashed
  completeOtp: String, // hashed
  statusHistory: [{
    status: String,
    timestamp: Date,
    updatedBy: mongoose.Schema.Types.ObjectId,
    reason: String
  }],
  rescheduleCount: { type: Number, default: 0 }
}, { timestamps: true });
```

## 7. API Requirements
- `POST /api/bookings`
  Body: `{ serviceId, packageId, addonIds, scheduledDate, timeSlot, addressId }`
- `GET /api/bookings` (filters: `status`, `dateRange`)
- `GET /api/bookings/[id]`
- `POST /api/bookings/[id]/reschedule`
  Body: `{ scheduledDate, timeSlot }`

## 8. Business Logic
- Server-side Price Calculation: `calculateBookingPrice()` stub. Calculate total amount in paise. Convenience fee is flat 2900 paise.
- Address Snapshot: Copy the mutable Address doc into `addressSnapshot` array on creation.
- Idempotency: Same customer + service + slot + date within 5 mins returns existing booking.
- Number Generation: Format `SP + YYMMDD + 4-digit sequence` (e.g., SP240215001).
- OTPs: Generate two 4-digit OTPs (start, complete). Hash with bcrypt and store.

## 9. Validation
- Address belongs to customer.
- Service is active and available in address city.

## 10. Security
- Only owner or admin can view/modify booking.

## 11. Error Handling
- `SLOT_UNAVAILABLE`, `SERVICE_UNAVAILABLE`, `ADDRESS_NOT_FOUND`.

## 12. Edge Cases
- Reschedule max 1 allowed, must be >4h before scheduled time.

## 13. Frontend Requirements
N/A

## 14. Backend Requirements
- Provide counter logic for sequence generation.

## 15. Testing
- Test atomic incrementing for booking IDs.
- Test idempotency.

## 16. Files To Create
- `src/models/Booking.js`
- `src/app/api/bookings/route.js`
- `src/app/api/bookings/[id]/route.js`
- `src/app/api/bookings/[id]/reschedule/route.js`

## 17. Files To Modify
- None

## 18. Files NOT To Modify
- None

## 19. Completion Requirements
Booking flow functional with 100% server-authoritative logic.

## Acceptance Criteria
- [ ] Booking schema with status enum and address snapshot included.
- [ ] POST API calculates prices accurately on the server in paise.
- [ ] Idempotency prevents duplicate bookings.
- [ ] Unique sequential booking ID generation implemented.
- [ ] Bcrypt hashed OTPs for start/complete generated on creation.
- [ ] Reschedule limit and time bounds enforced.
