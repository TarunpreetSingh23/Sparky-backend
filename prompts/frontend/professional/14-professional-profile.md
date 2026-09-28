# 14 — Professional Profile

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the professional profile management view.

## 3. Read Before Coding
- `src/lib/auth.js`

## 4. Existing Architecture
Next.js App Router.

## 5. Requirements
- Route: `/profile`.
- Sections: Photo upload, Bio text, Services display, Document status, Emergency contact, Logout.

## 6. Database Changes
None.

## 7. API Requirements
- `POST /api/upload/public`
- `PATCH /api/professionals/[id]`

## 8. Business Logic
- Profile photo is public URL.

## 9. Validation
- Bio max 500 characters.

## 10. Security
- Document links secured.

## 11. Error Handling
- Upload failure alerts.

## 12. Edge Cases
- Rejected document status.

## 13. Frontend Requirements
- `app/profile/page.js`

## 14. Backend Requirements
- Profile update endpoint.

## 15. Testing
- Logout flow clears token.

## 16. Files To Create
- `src/app/profile/page.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Bio text validation works.
- [ ] Photo uploads successfully.
