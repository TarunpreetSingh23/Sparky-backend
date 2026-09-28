# 05 — Service Details

## 1. Role
Expert Next.js Frontend Developer.

## 2. Objective
Build service detail page.

## 3. Read Before Coding
c:/RAG-frontend/prompts/shared/07-design-system.md

## 4. Existing Architecture
Next.js App Router, JS, Tailwind.

## 5. Requirements
- Route: `/services/[slug]`.
- Components: `ServiceImageGallery`, `ServiceHeader`, `PackageSelector`, `AddonCheckboxList`, `ServiceIncludes`, `DurationBadge`, `BookingCTA` (sticky bottom on mobile), `ReviewsSection` (rating bar chart).
- SEO: Metadata API for title, desc, og:image.
- Local JS price calc for display.

## 6. Database Changes
N/A

## 7. API Requirements
- GET `/api/services/[slug]`

## 8. Business Logic
- Selected Package + Addons = total estimated price (paisa).
- Final price is server-authoritative, frontend is purely visual.

## 9. Validation
- Package selection is mandatory.

## 10. Security
- Safe rendering of rich text descriptions if any.

## 11. Error Handling
- 404 behavior for invalid slug.

## 12. Edge Cases
- Service with no addons.
- Very long package descriptions.

## 13. Frontend Requirements (if applicable)
- Booking CTA fixed to bottom on mobile devices.
- Review bar chart visualizes 1-5 star distributions.

## 14. Backend Requirements (if applicable)
N/A

## 15. Testing
- Price calculation matching selected packages/addons.
- Sticky CTA behavior on small screens.

## 16. Files To Create
- `src/app/services/[slug]/page.js`
- `src/components/service-detail/ServiceImageGallery.js`
- `src/components/service-detail/ServiceHeader.js`
- `src/components/service-detail/PackageSelector.js`
- `src/components/service-detail/AddonCheckboxList.js`
- `src/components/service-detail/BookingCTA.js`
- `src/components/service-detail/ReviewsSection.js`

## 17. Files To Modify
N/A

## 18. Files NOT To Modify
N/A

## 19. Completion Requirements
Build and lint commands must pass.

## Acceptance Criteria
- [ ] Sticky bottom booking bar shows calculated total.
- [ ] Next.js Metadata API used for SEO.
- [ ] Reviews bar chart displays accurately.
