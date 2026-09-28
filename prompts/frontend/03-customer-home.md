# 03 — Customer Home

## 1. Role
Expert Next.js Frontend Developer.

## 2. Objective
Build the customer homepage.

## 3. Read Before Coding
c:/RAG-frontend/prompts/shared/07-design-system.md

## 4. Existing Architecture
Next.js App Router, JS, Tailwind.

## 5. Requirements
- Route: `/`
- Components: `HeroBanner` (auto-rotating carousel 4s), `CategoryGrid` (icons+names), `PopularServicesGrid` (horizontal scroll mobile, 3-col desktop), `RecentBookingsBar` (shows last 2 bookings if logged in), `OffersSection`.
- City detection/selector.
- API fetch with stale-while-revalidate 5 mins.
- Skeleton loading state.

## 6. Database Changes
N/A

## 7. API Requirements
- GET `/api/home?city=amritsar`

## 8. Business Logic
- Prices displayed in ₹ (paise / 100).
- If logged in, show `RecentBookingsBar`.

## 9. Validation
- Handle missing data gracefully without crashing.

## 10. Security
- Safe rendering of image URLs from Cloudinary.

## 11. Error Handling
- Fallback UI if API fails.

## 12. Edge Cases
- No active offers to show.
- No popular services configured.

## 13. Frontend Requirements (if applicable)
- Hero images must be lazy-loaded, except LCP image preloaded.
- Category links to `/services/category/[slug]`.

## 14. Backend Requirements (if applicable)
N/A

## 15. Testing
- Carousel auto-rotation and manual swipe.
- Responsive grid behaviors.

## 16. Files To Create
- `src/app/page.js`
- `src/components/home/HeroBanner.js`
- `src/components/home/CategoryGrid.js`
- `src/components/home/PopularServicesGrid.js`
- `src/components/home/RecentBookingsBar.js`
- `src/components/home/OffersSection.js`
- `src/components/home/HomeSkeleton.js`

## 17. Files To Modify
N/A

## 18. Files NOT To Modify
N/A

## 19. Completion Requirements
Build and lint commands must pass.

## Acceptance Criteria
- [ ] Carousel auto-rotates every 4 seconds.
- [ ] Home fetches data based on selected city.
- [ ] Recent bookings show conditionally for auth'd users.
