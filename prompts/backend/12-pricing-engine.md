# 12 — Pricing Engine

## 1. Role
You are a senior backend engineer implementing the server-side pricing calculation engine for Sparky.

## 2. Objective
Ensure robust, server-side immutable calculation of booking prices in paise (integers) to prevent client-side manipulation.

## 3. Read Before Coding
- `doc9_10_11_api_booking_payment.md`
- `MASTER_IMPLEMENTATION_BLUEPRINT.md`

## 4. Existing Architecture
- All prices in paise (integer). Never floats. ₹349 = 34900 paise.
- Next.js App Router API structure.

## 5. Requirements
- Function: `calculateBookingPrice(serviceId, packageId, addonIds, couponCode, citySlug)` returning an immutable pricing object.
- Logic:
  1. Fetch package `basePrice`.
  2. Sum addons prices.
  3. Apply zone pricing multiplier (lookup customer address zone).
  4. Apply surge multiplier if `zone.surgeActive`.
  5. Convenience fee: flat ₹29 (2900 paise).
  6. Apply coupon discount if valid.
  7. GST: 18% on convenience fee only.
  8. Calculate professional payout: 75% of servicePrice + 75% of addonsPrice.
  9. Calculate platform revenue.
- Embed pricing object in booking document and FREEZE it (never recalculate after creation).
- Never use floating point arithmetic. Use `Math.round()` everywhere.

## 6. Database Changes
- Embed full pricing object schema in Booking model.

## 7. API Requirements
- Will be consumed internally by booking creation API. No direct public API required here, but might provide `POST /api/pricing/calculate` for frontend preview.

## 8. Business Logic
- Pricing Math:
  - `servicePrice = Math.round(basePrice * zoneMultiplier * surgeMultiplier)`
  - `addonsPrice = Math.round(sum(addon) * zoneMultiplier * surgeMultiplier)`
  - `subtotal = servicePrice + addonsPrice`
  - `discountAmount = calculateCouponDiscount()`
  - `totalAfterDiscount = subtotal - discountAmount`
  - `gst = Math.round(2900 * 0.18)`
  - `totalPrice = totalAfterDiscount + 2900 + gst`
- Payout Math:
  - `professionalPayout = Math.round((servicePrice + addonsPrice) * 0.75)`

## 9. Validation
- Reject non-integer inputs if any. Ensure DB documents have valid integer prices.

## 10. Security
- Never trust client-sent prices.

## 11. Error Handling
- Invalid service/package: `400 INVALID_ITEM`

## 12. Edge Cases
- Coupon discount exceeds subtotal (must cap at subtotal).

## 13. Frontend Requirements (if applicable)
- N/A

## 14. Backend Requirements (if applicable)
- Create `src/services/pricingEngine.js`.

## 15. Testing
- Write test cases for exact paise outputs, especially rounding scenarios.

## 16. Files To Create
- `src/services/pricingEngine.js`
- `src/app/api/pricing/calculate/route.js` (for frontend preview)

## 17. Files To Modify
- `src/models/Booking.js`

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- Engine correctly calculates complex scenarios in integers.

## Acceptance Criteria
- [ ] No floats are used in math
- [ ] Convenience fee GST is 18%
- [ ] Professional payout is exactly 75% of service + addons
