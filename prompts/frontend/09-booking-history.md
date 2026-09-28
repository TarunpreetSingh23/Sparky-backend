# 09 — Booking History

## 1. Role
Expert Next.js Frontend Developer.

## 2. Objective
Build booking history page.

## 3. Read Before Coding
c:/RAG-frontend/prompts/shared/07-design-system.md

## 4. Existing Architecture
Next.js App Router, JS, Tailwind.

## 5. Requirements
- Route: `/bookings`.
- Components: `BookingTabs` (Upcoming, Active, Completed, Cancelled), `BookingCard`.
- Infinite scroll for completed.
- Actions: Rate Service (if unreviewed), Track, Reschedule, Cancel, Refund Status.
- Booking detail modal or route.

## 6. Database Changes
N/A

## 7. API Requirements
- GET `/api/bookings?status=...&page=1`

## 8. Business Logic
- Sort by newest first.
- Only show 'Rate Service' if `booking.reviewed` is false.

## 9. Validation
- Tab switches clear/reset infinite scroll state.

## 10. Security
- Ensure users only see their own bookings.

## 11. Error Handling
- Failed fetch shows error state with retry.

## 12. Edge Cases
- Empty states for each tab type.

## 13. Frontend Requirements (if applicable)
- Badges for status styling (e.g. green for completed).
- Skeleton loaders for cards.

## 14. Backend Requirements (if applicable)
N/A

## 15. Testing
- Tab navigation.
- Action button correct routing.

## 16. Files To Create
- `src/app/bookings/page.js`
- `src/components/bookings/BookingTabs.js`
- `src/components/bookings/BookingCard.js`
- `src/components/bookings/BookingDetailModal.js`
- `src/components/bookings/EmptyState.js`

## 17. Files To Modify
N/A

## 18. Files NOT To Modify
N/A

## 19. Completion Requirements
Build and lint commands must pass.

## Acceptance Criteria
- [ ] 4 tabs filter bookings accurately.
- [ ] Infinite scroll fetches pages sequentially.
- [ ] Empty state specific to the selected tab.
