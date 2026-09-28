# 11 — Customer Reviews

## 1. Role
Expert Next.js Frontend Developer.

## 2. Objective
Build post-service review submission form/modal.

## 3. Read Before Coding
c:/RAG-frontend/prompts/shared/07-design-system.md

## 4. Existing Architecture
Next.js App Router, JS, Tailwind.

## 5. Requirements
- Route: `/bookings/[id]/review` (or modal).
- Components: `StarRatingInput` (1-5 tap), `TagSelector` (chips), `ReviewTextarea` (10-1000 char limit), `PhotoUpload` (max 3, 5MB).
- Submitting updates review, rewards loyalty coins.

## 6. Database Changes
N/A

## 7. API Requirements
- POST `/api/reviews`

## 8. Business Logic
- Review window closed after 7 days -> UI locks.
- Cannot review twice (`booking.reviewed`).

## 9. Validation
- Overall rating required.
- Text length max 1000.
- Photos max 3, 5MB each.

## 10. Security
- Authenticated ID matches booking user.

## 11. Error Handling
- Display 'Review period has closed' error gracefully.

## 12. Edge Cases
- User attempts to navigate directly to review a closed/already reviewed booking.

## 13. Frontend Requirements (if applicable)
- Star rating animations on tap.
- Image thumbnail previews before upload.

## 14. Backend Requirements (if applicable)
N/A

## 15. Testing
- Form validation errors.
- Photo size limit rejection.

## 16. Files To Create
- `src/app/bookings/[id]/review/page.js`
- `src/components/reviews/StarRatingInput.js`
- `src/components/reviews/TagSelector.js`
- `src/components/reviews/ReviewTextarea.js`
- `src/components/reviews/PhotoUploadList.js`

## 17. Files To Modify
N/A

## 18. Files NOT To Modify
N/A

## 19. Completion Requirements
Build and lint commands must pass.

## Acceptance Criteria
- [ ] Rating required to enable submit button.
- [ ] 7-day restriction blocks form submission/rendering.
- [ ] Photo upload supports up to 3 previews and size limits.
