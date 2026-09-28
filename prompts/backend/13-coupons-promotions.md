# 13 — Coupons & Promotions

## 1. Role
You are a backend engineer building the promotional coupon subsystem for Sparky.

## 2. Objective
Implement validation, calculation, and tracking for flat and percentage-based discount coupons.

## 3. Read Before Coding
- `doc8_database_specification.md`
- `MASTER_IMPLEMENTATION_BLUEPRINT.md`

## 4. Existing Architecture
- Mongoose for models.
- Next.js App Router API structure.

## 5. Requirements
- Coupon logic includes validation for dates, usage limits, user limits, city/service constraints, and new user status.
- Flat discount vs Percentage discount (with max cap).
- Coupon usage record is created ONLY when booking is `COMPLETED`.

## 6. Database Changes
- Create `Coupon` model:
  - `code` (String, uppercase, max 12 chars), `discountType` (Enum: flat, percent), `discountValue` (Number), `maxDiscountCap` (Number), `minOrderAmount` (Number), `validFrom`, `validUntil`, `usageLimitTotal`, `usageLimitPerUser`, `usageCount`, `applicableServices`, `applicableCities`, `isFirstBookingOnly`, `isNewUserOnly`, `isActive`.
- Create `CouponUsage` model:
  - `couponId`, `customerId`, `bookingId`, `discountApplied`, `usedAt`.

## 7. API Requirements
- `POST /api/coupons/validate`
  - Body: `{ code, orderAmount, serviceId, citySlug }`
  - Returns: `{ success: true, data: { discountAmount } }`
- `GET /api/coupons/my-coupons`
  - Returns available coupons for user.
- `POST/PATCH /api/admin/coupons`
  - Admin management APIs.

## 8. Business Logic
- Validation flow:
  1. Find code (case-insensitive).
  2. Check `isActive` & date validity.
  3. Check total & per-user usage limits.
  4. Check `minOrderAmount`.
  5. Check `applicableServices` (empty = all) and `applicableCities`.
  6. Check `isFirstBookingOnly` and `isNewUserOnly`.
- Discount calc:
  - flat = `discountValue` (paise)
  - percent = `Math.min(Math.round(orderAmount * discountValue / 100), maxDiscountCap)`

## 9. Validation
- Validate coupon string regex (alphanumeric, max 12).

## 10. Security
- Validating a coupon does not consume it.
- Admin APIs must check role `admin`.

## 11. Error Handling
- Coupon invalid/expired: `400 INVALID_COUPON`
- Condition not met: `400 COUPON_CONDITIONS_NOT_MET`

## 12. Edge Cases
- Concurrent checkouts trying to use last count of a coupon. (Handle loosely or via DB atomic `$inc` at completion).

## 13. Frontend Requirements (if applicable)
- N/A

## 14. Backend Requirements (if applicable)
- `src/services/couponService.js`

## 15. Testing
- Test percent vs flat limits.
- Test total usage capping.

## 16. Files To Create
- `src/models/Coupon.js`
- `src/models/CouponUsage.js`
- `src/services/couponService.js`
- `src/app/api/coupons/validate/route.js`
- `src/app/api/coupons/my-coupons/route.js`
- `src/app/api/admin/coupons/route.js`

## 17. Files To Modify
- None

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- APIs work correctly.

## Acceptance Criteria
- [ ] Code is validated case-insensitively
- [ ] Percentage discounts correctly cap at maxDiscountCap
- [ ] Usage is only recorded when booking is COMPLETED
