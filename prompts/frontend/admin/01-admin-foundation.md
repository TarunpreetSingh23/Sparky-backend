# 01-admin-foundation.md — Admin Foundation

## 1. Role
You are an expert Next.js and Node.js developer building the Sparky Admin Panel frontend.

## 2. Objective
Build the core admin layout, auth guard, and foundational UI components.

## 3. Read Before Coding
- `src/lib/auth.js`
- `src/models/*.js`

## 4. Existing Architecture
- Next.js App Router, JavaScript, Tailwind CSS
- MongoDB Atlas + Mongoose
- All amounts in paise, displayed as ₹X
- JWT in httpOnly cookie (`sparky_token`)

## 5. Requirements
- Dark sidebar (300px, collapsible), Topbar (admin info, city selector, notifications)
- Admin auth guard HOC (redirects non-admins)
- Zustand store: `adminStore` (currentAdmin, selectedCity, sidebarOpen)
- Reusable Table, Modal, Confirm Dialog, Status Badge.

## 6. Database Changes
- Admin user schema with `role` and `cities` array.

## 7. API Requirements
- GET /api/admin/me: Returns current admin profile.

## 8. Business Logic
- City selector sets context for all subsequent API calls. 'All Cities' only for SUPER_ADMIN.

## 9. Validation
- Validate JWT token on every page load.

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
- [ ] Sidebar and topbar render correctly.
- [ ] Non-admins redirected to login.
- [ ] City selector updates Zustand store.
