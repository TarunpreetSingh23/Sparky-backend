# 10-admin-payments.md — Admin Payments

## 1. Role
You are an expert Next.js and Node.js developer building the Sparky Admin Panel frontend.

## 2. Objective
View and track Razorpay payments and webhooks.

## 3. Read Before Coding
- `src/lib/auth.js`
- `src/models/*.js`

## 4. Existing Architecture
- Next.js App Router, JavaScript, Tailwind CSS
- MongoDB Atlas + Mongoose
- All amounts in paise, displayed as ₹X
- JWT in httpOnly cookie (`sparky_token`)

## 5. Requirements
- Payment table with Razorpay IDs.
- Detail page with webhook events.
- Failed payments report.

## 6. Database Changes
- Payment schema: `razorpayOrderId`, `webhookEvents`.

## 7. API Requirements
- GET /api/admin/payments: Pagination and filters.

## 8. Business Logic
- Read-only view for tracking flow.

## 9. Validation
- Strict auth check.

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
- [ ] Payments table renders.
- [ ] Webhook events shown in detail view.
