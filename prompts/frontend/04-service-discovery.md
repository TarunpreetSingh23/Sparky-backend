# 04 — Service Discovery

## 1. Role
Expert Next.js Frontend Developer.

## 2. Objective
Build service discovery, browsing, and search features.

## 3. Read Before Coding
c:/RAG-frontend/prompts/shared/07-design-system.md

## 4. Existing Architecture
Next.js App Router, JS, Tailwind.

## 5. Requirements
- Routes: `/services`, `/services/category/[slug]`, `/search`.
- Components: `CategoryFilter` (horizontal scroll tabs), `ServiceCard` (image, rating, review count, starting price, book CTA), `SortDropdown`, `PriceRangeFilter`, `DurationFilter`, `ServiceSkeleton`.
- Infinite scroll or pagination (Load More button for MVP).
- Real-time search with 300ms debounce.
- Gender filter.

## 6. Database Changes
N/A

## 7. API Requirements
- GET `/api/services` (query: category, city, sort, page, limit)
- GET `/api/search?q=`

## 8. Business Logic
- Pricing shown as ₹ (paise / 100).
- Gender filter applies to `genderApplicability`.

## 9. Validation
- Sanitize search input queries.

## 10. Security
- Prevents XSS in search query display.

## 11. Error Handling
- Empty state: 'No services found in Amritsar for this category.'

## 12. Edge Cases
- Very long service names.
- Zero ratings/reviews.

## 13. Frontend Requirements (if applicable)
- Debounce search logic using `useEffect` or external lib.
- Smooth transitions when updating filters.

## 14. Backend Requirements (if applicable)
N/A

## 15. Testing
- Debounce timing on search.
- Filter combinations.

## 16. Files To Create
- `src/app/services/page.js`
- `src/app/services/category/[slug]/page.js`
- `src/app/search/page.js`
- `src/components/services/ServiceCard.js`
- `src/components/services/CategoryFilter.js`
- `src/components/services/SortDropdown.js`
- `src/components/services/Filters.js`

## 17. Files To Modify
N/A

## 18. Files NOT To Modify
N/A

## 19. Completion Requirements
Build and lint commands must pass.

## Acceptance Criteria
- [ ] Search input debounces at 300ms.
- [ ] Filters correctly update URL query parameters or local state.
- [ ] Empty state shown when API returns 0 items.
