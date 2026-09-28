# 01 — Frontend Foundation

## 1. Role
Expert Next.js Frontend Developer.

## 2. Objective
Build the foundation for the Sparky customer app using Next.js App Router.

## 3. Read Before Coding
c:/RAG-frontend/prompts/shared/07-design-system.md

## 4. Existing Architecture
Next.js App Router, plain JavaScript, Tailwind CSS. API format: `{ success: true, data: {...} }` or `{ success: false, error: "...", code: "ERROR_CODE" }`. Auth is via JWT in httpOnly cookie (`sparky_token`).

## 5. Requirements
- Setup `src/app/layout.js` with Inter font, Tailwind, meta tags.
- Setup `src/app/globals.css` with Sparky design tokens (Purple/violet #7C3AED, Gold #F59E0B, dark backgrounds).
- API client wrapper `src/lib/api.js` for `fetch`.
- Global Zustand auth store `src/store/authStore.js`.
- Toast notifications setup.
- Skeleton components, Error boundary, PWA manifest, SW registration.

## 6. Database Changes
N/A

## 7. API Requirements
N/A

## 8. Business Logic
- API wrapper must include `credentials: 'include'`.
- 401 Unauthorized should redirect to `/login` and clear Zustand state.
- All prices from backend are in paise; format as `₹(amount/100)`.

## 9. Validation
- Ensure PWA manifest has all required icons.

## 10. Security
- No tokens stored in local storage, rely on httpOnly cookies.

## 11. Error Handling
- Network errors: return `{ success: false, error: 'Network Error', code: 'NETWORK_ERROR' }`.
- Error boundary fallback UI: 'Something went wrong, please try again.'

## 12. Edge Cases
- Offline mode: Service worker caches static assets.
- Slow network: API client timeouts after 15s.

## 13. Frontend Requirements (if applicable)
- Layout: Mobile-first responsive breakpoints.
- Auth store: `user`, `isAuthenticated`, `isLoading`, `setUser`, `clearUser`.
- `api.js`: Wrapper that automatically handles 401s, stringifies JSON.

## 14. Backend Requirements (if applicable)
N/A

## 15. Testing
- Test offline rendering.
- Test 401 redirect behavior in `api.js`.

## 16. Files To Create
- `src/app/layout.js`
- `src/app/globals.css`
- `src/lib/api.js`
- `src/store/authStore.js`
- `src/components/ui/Skeleton.js`
- `public/manifest.json`
- `src/components/ErrorBoundary.js`

## 17. Files To Modify
- `tailwind.config.js`

## 18. Files NOT To Modify
N/A

## 19. Completion Requirements
Build and lint commands must pass.

## Acceptance Criteria
- [ ] Next.js layout uses Inter font and sets up dark/glassmorphism theme.
- [ ] `api.js` intercepts 401 responses and triggers logout.
- [ ] Zustand store correctly manages `isAuthenticated`.
- [ ] PWA manifest is linked in layout.
