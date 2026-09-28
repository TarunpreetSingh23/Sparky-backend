# 04 — Customer Addresses & Location

## 1. Role
Backend Developer & Architect

## 2. Objective
Implement customer addresses functionality with geospatial support, zone resolution, and Google Maps integration to support accurate service dispatching.

## 3. Read Before Coding
- `c:/RAG-frontend/mdfile/doc8_database_specification.md`
- `c:/RAG-frontend/mdfile/MASTER_IMPLEMENTATION_BLUEPRINT.md`

## 4. Existing Architecture
- Mongoose, Next.js App Router API Routes

## 5. Requirements
- Create Address model with GeoJSON for coordinates.
- Implement CRUD APIs for addresses.
- Auto-resolve `zoneId` when saving an address based on geometry intersection.
- Enforce limit: Max 5 addresses per user.

## 6. Database Changes
```javascript
// models/Address.js
const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, enum: ['HOME', 'WORK', 'OTHER'], default: 'HOME' },
  addressLine1: { type: String, required: true },
  addressLine2: String,
  landmark: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

addressSchema.index({ coordinates: "2dsphere" });
addressSchema.index({ userId: 1 });
```

## 7. API Requirements
- `GET /api/customers/[id]/addresses`
  Auth: Owner. Response: Array of addresses.
- `POST /api/customers/[id]/addresses`
  Body: `{ label, addressLine1, addressLine2, landmark, city, state, pincode, coordinates: [lng, lat] }`
  Logic: Check max 5 limit, resolve zoneId using `$geoIntersects` with zones collection.
- `PATCH /api/customers/[id]/addresses/[addressId]`
- `DELETE /api/customers/[id]/addresses/[addressId]`

## 8. Business Logic
- The frontend calls Google Maps Places JS API to get coordinates. Backend trusts frontend coordinates but verifies serviceability.
- Service Area Validation: Determine if address coordinates fall within an active `Zone` using `$geoIntersects` query.

## 9. Validation
- Verify coordinates array format `[longitude, latitude]`.

## 10. Security
- Only owner can view, edit, or delete their own addresses.
- Secure against parameter tampering for `userId`.

## 11. Error Handling
- Over 5 addresses -> `ADDRESS_LIMIT_EXCEEDED` 400
- Out of bounds / no zone -> `OUT_OF_SERVICE_AREA` 400
- Address not found -> `ADDRESS_NOT_FOUND` 404

## 12. Edge Cases
- Adding first address automatically makes it `isDefault: true`.
- Deleting the default address should make another address default, if one exists.

## 13. Frontend Requirements (if applicable)
N/A

## 14. Backend Requirements (if applicable)
- Address controllers and services.

## 15. Testing
- Create mock Zone data and test address geo-intersection to ensure `zoneId` is correctly populated.
- Test 5 address limit.

## 16. Files To Create
- `src/models/Address.js`
- `src/app/api/customers/[id]/addresses/route.js`
- `src/app/api/customers/[id]/addresses/[addressId]/route.js`

## 17. Files To Modify
- None

## 18. Files NOT To Modify
- Customer schema

## 19. Completion Requirements
CRUD works, 2dsphere index applies, geo resolution functions cleanly.

## Acceptance Criteria
- [ ] Address Mongoose schema implemented exactly with GeoJSON Point and 2dsphere index.
- [ ] API routes for CRUD operations built with ownership checks.
- [ ] Enforces maximum of 5 addresses per customer.
- [ ] Service area validation via `$geoIntersects` implemented on create/update.
- [ ] Auto-assign `isDefault` on first address.
