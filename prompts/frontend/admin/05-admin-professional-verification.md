# 05-admin-professional-verification.md — Professional Verification

## 1. Role
You are an expert Next.js and Node.js developer building the Sparky Admin Panel frontend.

## 2. Objective
Build the KYC verification workflow and document reviewer.

## 3. Read Before Coding
- `src/lib/auth.js`
- `src/models/*.js`

## 4. Existing Architecture
- Next.js App Router, JavaScript, Tailwind CSS
- MongoDB Atlas + Mongoose
- All amounts in paise, displayed as ₹X
- JWT in httpOnly cookie (`sparky_token`)

## 5. Requirements
- Queue tabs: Applied, Pending, Under Review, Verified, Rejected.
- Document viewer with side-by-side Aadhaar, PAN.
- Actions: Approve, Reject, Request Info.

## 6. Database Changes
- Doc schema: Cloudinary secure URLs.
- Verification state on Professional model.

## 7. API Requirements
- POST /api/admin/professionals/[id]/verify: `{ action: 'APPROVE' }`

## 8. Business Logic
- Send WhatsApp notification on decision.
- Cloudinary URLs must be signed (24h expiry).

## 9. Validation
- Rejection requires a reason string.

## 10. Security
- Require `admin` role via JWT.
- Specific RBAC checks as defined.

## 11. Error Handling
- Standard JSON error format: `{ success: false, error: "message", code: "CODE" }`.

## 12. Edge Cases
- Handle missing data gracefully.
- Prevent duplicate actions on double-click.

## 13. Frontend Requirements
- Desktop-first, professional/enterprise UI.
- Use reusable components where possible.
- Real data only - no placeholders.

## 14. Backend Requirements
- Authoritative validation on all endpoints.
- Log mutating actions to AuditLogs.

## 15. Testing
- Verify role restrictions.
- Test form validation.

## 16. Files To Create
- Specific files for this feature (pages, API routes, components).

## 17. Files To Modify
- Sidebar/Navigation for new routes.

## 18. Files NOT To Modify
- Core auth utilities.

## 19. Completion Requirements
- Standard Next.js build passes.

## Acceptance Criteria
- [ ] Queue tabs filter professionals correctly.
- [ ] Document viewer renders images.
- [ ] Approve action changes state and sends WhatsApp.
