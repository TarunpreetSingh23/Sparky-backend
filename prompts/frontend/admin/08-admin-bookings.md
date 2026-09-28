# 08-admin-bookings.md — Admin Bookings

## 1. Role
You are an expert Next.js and Node.js developer building the Sparky Admin Panel frontend.

## 2. Objective
Manage all system bookings, timelines, and cancellations.

## 3. Read Before Coding
- `src/lib/auth.js`
- `src/models/*.js`

## 4. Existing Architecture
- Next.js App Router, JavaScript, Tailwind CSS
- MongoDB Atlas + Mongoose
- All amounts in paise, displayed as ₹X
- JWT in httpOnly cookie (`sparky_token`)

## 5. Requirements
- Table with extensive filters.
- Detail page: timeline, payment info, pricing breakdown.
- Actions: Cancel, Admin Note, Refund.

## 6. Database Changes
- Booking schema: `statusHistory`, `adminNotes`.

## 7. API Requirements
- POST /api/admin/bookings/[id]/cancel
- POST /api/admin/bookings/[id]/notes

## 8. Business Logic
- Canceling requires a reason. Triggers refunds if payment was confirmed.

## 9. Validation
- Check current booking state before cancellation.

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
- [ ] Bookings filter by status and date.
- [ ] Timeline visualizes status history.
- [ ] Cancel action works with reason.
