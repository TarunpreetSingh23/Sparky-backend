# 03-admin-customers.md — Admin Customers

## 1. Role
You are an expert Next.js and Node.js developer building the Sparky Admin Panel frontend.

## 2. Objective
Build the customer management section with profiles and wallet controls.

## 3. Read Before Coding
- `src/lib/auth.js`
- `src/models/*.js`

## 4. Existing Architecture
- Next.js App Router, JavaScript, Tailwind CSS
- MongoDB Atlas + Mongoose
- All amounts in paise, displayed as ₹X
- JWT in httpOnly cookie (`sparky_token`)

## 5. Requirements
- Search by phone/name/email.
- Customer table with filters.
- Detail page: profile, bookings, wallet balance, tickets.
- Actions: Block/Unblock, Add Wallet Credit.

## 6. Database Changes
- Customer schema: `status` enum (ACTIVE, BLOCKED), `walletBalance`.

## 7. API Requirements
- PATCH /api/admin/customers/[id]/wallet: `{ amount: 10000, reason: "Refund" }`
- PATCH /api/admin/customers/[id]/status: `{ status: "BLOCKED" }`

## 8. Business Logic
- Log wallet and status changes to AuditLogs.

## 9. Validation
- Wallet credit requires reason > 10 chars.

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
- [ ] Search and filter customers.
- [ ] Successfully block a customer.
- [ ] Add wallet credit updates balance.
