# 04-admin-professionals.md — Admin Professionals

## 1. Role
You are an expert Next.js and Node.js developer building the Sparky Admin Panel frontend.

## 2. Objective
Manage professional profiles, skills, and statuses.

## 3. Read Before Coding
- `src/lib/auth.js`
- `src/models/*.js`

## 4. Existing Architecture
- Next.js App Router, JavaScript, Tailwind CSS
- MongoDB Atlas + Mongoose
- All amounts in paise, displayed as ₹X
- JWT in httpOnly cookie (`sparky_token`)

## 5. Requirements
- Professional table with filters (status, city, skills, rating).
- Detail page: full profile, metrics, docs, bookings.
- Actions: suspend, reactivate, edit city/skills/radius.

## 6. Database Changes
- Professional schema: `skills`, `serviceRadius`, `status`.

## 7. API Requirements
- PATCH /api/admin/professionals/[id]/status: `{ status: "SUSPENDED" }`
- PATCH /api/admin/professionals/[id]/profile

## 8. Business Logic
- Changing status to SUSPENDED cancels their open searching bookings.

## 9. Validation
- Radius must be between 1km and 50km.

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
- [ ] Professionals table loads with filters.
- [ ] Can view professional full profile.
- [ ] Status updates work correctly.
