# 09-admin-dispatch.md — Admin Dispatch

## 1. Role
You are an expert Next.js and Node.js developer building the Sparky Admin Panel frontend.

## 2. Objective
Manual dispatch panel for unassigned bookings.

## 3. Read Before Coding
- `src/lib/auth.js`
- `src/models/*.js`

## 4. Existing Architecture
- Next.js App Router, JavaScript, Tailwind CSS
- MongoDB Atlas + Mongoose
- All amounts in paise, displayed as ₹X
- JWT in httpOnly cookie (`sparky_token`)

## 5. Requirements
- Shows SEARCHING_PROFESSIONAL bookings.
- Eligible professional list sorted by dispatch score.
- Auto-refresh 10s, sound alert.

## 6. Database Changes
- Dispatch logs collection.

## 7. API Requirements
- POST /api/admin/bookings/[id]/assign: `{ professionalId: '...' }`

## 8. Business Logic
- Calculate weighted score (Distance 30%, Rating 20%, etc).

## 9. Validation
- Ensure professional is ACTIVE and available.

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
- [ ] Unassigned bookings list refreshes automatically.
- [ ] Dispatch score displays for professionals.
- [ ] Manual assignment updates booking state.
