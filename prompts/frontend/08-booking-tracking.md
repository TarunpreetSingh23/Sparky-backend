# 08 — Booking Tracking

## 1. Role
Expert Next.js Frontend Developer.

## 2. Objective
Build live booking status tracker.

## 3. Read Before Coding
c:/RAG-frontend/prompts/shared/07-design-system.md

## 4. Existing Architecture
Next.js App Router, JS, Tailwind.

## 5. Requirements
- Route: `/bookings/[id]/tracking`.
- Components: `StatusProgressBar`, `ProfessionalCard`, `ETADisplay`, `LocationMap` (Maps integration), `OTPDisplay`, `SupportButton`, `CancelButton`.
- Polling via setInterval 10s until terminal state.
- Distinct UI for each state.

## 6. Database Changes
N/A

## 7. API Requirements
- GET `/api/bookings/[id]/status`

## 8. Business Logic
- Map only shown in `PROFESSIONAL_ON_THE_WAY` and `PROFESSIONAL_ARRIVED`.
- Cancel available before `SERVICE_STARTED`.

## 9. Validation
- Terminal states stop polling (COMPLETED, CANCELLED).

## 10. Security
- Masked professional phone.

## 11. Error Handling
- Polling errors fail silently but retry.

## 12. Edge Cases
- Professional drops off network.

## 13. Frontend Requirements (if applicable)
- Google Maps embedded.
- Red Emergency button.
- Share tracking link.

## 14. Backend Requirements (if applicable)
N/A

## 15. Testing
- Polling lifecycle hooks.
- Map rendering.

## 16. Files To Create
- `src/app/bookings/[id]/tracking/page.js`
- `src/components/tracking/StatusProgressBar.js`
- `src/components/tracking/ProfessionalCard.js`
- `src/components/tracking/LocationMap.js`
- `src/components/tracking/OTPDisplay.js`

## 17. Files To Modify
N/A

## 18. Files NOT To Modify
N/A

## 19. Completion Requirements
Build and lint commands must pass.

## Acceptance Criteria
- [ ] Status updates automatically every 10s via polling.
- [ ] Polling terminates on COMPLETED or CANCELLED.
- [ ] Map renders only in designated statuses.
