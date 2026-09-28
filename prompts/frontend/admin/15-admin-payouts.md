# 15-admin-payouts.md — Admin Payouts

## 1. Role
You are an expert Next.js and Node.js developer building the Sparky Admin Panel frontend.

## 2. Objective
Manage weekly payouts to professionals.

## 3. Read Before Coding
- `src/lib/auth.js`
- `src/models/*.js`

## 4. Existing Architecture
- Next.js App Router, JavaScript, Tailwind CSS
- MongoDB Atlas + Mongoose
- All amounts in paise, displayed as ₹X
- JWT in httpOnly cookie (`sparky_token`)

## 5. Requirements
- Weekly summary table.
- Run payout POST (SUPER_ADMIN only).
- Failed payouts list.

## 6. Database Changes
- Payout schema tracking total paid, status.

## 7. API Requirements
- POST /api/admin/payouts/run-weekly

## 8. Business Logic
- Payout is 75% of service price minus convenience fee.

## 9. Validation
- Prevent double-running payout for the same week.

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
- [ ] Payout preview calculates correctly.
- [ ] Run payout requires SUPER_ADMIN.
