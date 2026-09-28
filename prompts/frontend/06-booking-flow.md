# 06 — Booking Flow

## 1. Role
Expert Next.js Frontend Developer.

## 2. Objective
Build multi-step booking flow.

## 3. Read Before Coding
c:/RAG-frontend/prompts/shared/07-design-system.md

## 4. Existing Architecture
Next.js App Router, JS, Tailwind, Zustand.

## 5. Requirements
- Route: `/book/[serviceId]`.
- Steps:
  1. Package + Addons
  2. Date picker (disable past)
  3. Time slot (grey out unavailable)
  4. Address (list saved + Add New via Google Maps Places)
  5. Price summary + coupon
- Zustand `bookingStore`.
- Submit draft (POST) -> redirect to checkout.

## 6. Database Changes
N/A

## 7. API Requirements
- GET `/api/availability`
- POST `/api/coupons/validate`
- POST `/api/bookings`

## 8. Business Logic
- Pricing summary: Service + Addons + Convenience fee (₹29) - Discount + GST.
- All steps must have back navigation.

## 9. Validation
- Cannot proceed without selecting date/time/address.
- Coupon inline validation.

## 10. Security
- Only authenticated users can book.

## 11. Error Handling
- Coupon invalid: red text/toast.
- Slot taken error during submission: prompt to pick new slot.

## 12. Edge Cases
- User clears cart halfway.

## 13. Frontend Requirements (if applicable)
- Step indicator UI.
- Address form modal/inline with Places Autocomplete.

## 14. Backend Requirements (if applicable)
N/A

## 15. Testing
- Zustand state persistence between steps.
- Coupon apply/remove logic.

## 16. Files To Create
- `src/app/book/[serviceId]/page.js`
- `src/store/bookingStore.js`
- `src/components/booking/StepIndicator.js`
- `src/components/booking/DatePicker.js`
- `src/components/booking/TimeSlotGrid.js`
- `src/components/booking/AddressSelection.js`
- `src/components/booking/PriceSummary.js`

## 17. Files To Modify
N/A

## 18. Files NOT To Modify
N/A

## 19. Completion Requirements
Build and lint commands must pass.

## Acceptance Criteria
- [ ] 5-step flow with back navigation retains data in Zustand.
- [ ] Past dates and booked slots disabled.
- [ ] Successfully creates booking and redirects to checkout.
