# 03 — Professional Onboarding

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the multi-step onboarding wizard for new professionals.

## 3. Read Before Coding
- `src/lib/auth.js`

## 4. Existing Architecture
Next.js App Router.

## 5. Requirements
- Multi-step wizard.
- Steps: (1) Basic Info, (2) Location, (3) Skills, (4) Availability, (5) Bank Account, (6) Review.
- Save progress server-side after each step.
- Step 5 redirects to KYC.

## 6. Database Changes
None.

## 7. API Requirements
- `PATCH /api/professionals/[id]`

## 8. Business Logic
- Cannot skip steps.
- Validation per step.

## 9. Validation
- Required fields enforced.

## 10. Security
- Protected route.

## 11. Error Handling
- Toast on save failure.

## 12. Edge Cases
- Resume onboarding if app closed.

## 13. Frontend Requirements
- `app/onboarding/page.js`

## 14. Backend Requirements
- PATCH endpoint updates profile progress.

## 15. Testing
- Step transitions.

## 16. Files To Create
- `src/app/onboarding/page.js`
- `src/components/onboarding/*`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Wizard advances only on valid input.
- [ ] State saves on next step.
