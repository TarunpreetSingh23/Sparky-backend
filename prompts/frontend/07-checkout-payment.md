# 07 — Checkout & Payment

## 1. Role
Expert Next.js Frontend Developer.

## 2. Objective
Build checkout page and Razorpay integration.

## 3. Read Before Coding
c:/RAG-frontend/prompts/shared/07-design-system.md

## 4. Existing Architecture
Next.js App Router, JS, Tailwind.

## 5. Requirements
- Route: `/checkout/[bookingId]`.
- Components: `OrderSummary`, `PaymentMethodDisplay`, `PayButton`.
- Flow: Fetch booking → Pay initiates POST create-order → Initialize Razorpay.js → On success verify signature → redirect tracking.
- Show warning if leaving page.

## 6. Database Changes
N/A

## 7. API Requirements
- GET `/api/bookings/[id]`
- POST `/api/payments/create-order`
- POST `/api/payments/verify`

## 8. Business Logic
- Never store payment details in frontend.
- Amount in Razorpay must be passed in paise.

## 9. Validation
- Booking must be in PAYMENT_PENDING state to pay.

## 10. Security
- Payment signature verified on backend.

## 11. Error Handling
- Payment failed/dismissed: show retry option.

## 12. Edge Cases
- Razorpay script fails to load.
- Network dies during verification.

## 13. Frontend Requirements (if applicable)
- Dynamic loading of Razorpay script.
- Loading overlay during payment processing.

## 14. Backend Requirements (if applicable)
N/A

## 15. Testing
- Razorpay test mode flows.
- Leaving page warnings.

## 16. Files To Create
- `src/app/checkout/[bookingId]/page.js`
- `src/components/checkout/OrderSummary.js`
- `src/components/checkout/PayButton.js`
- `src/lib/razorpay.js` (Script loader)

## 17. Files To Modify
N/A

## 18. Files NOT To Modify
N/A

## 19. Completion Requirements
Build and lint commands must pass.

## Acceptance Criteria
- [ ] Razorpay loads dynamically and opens modal.
- [ ] Verification success redirects to tracking page.
- [ ] Back button triggers 'Booking held for 30m' warning.
