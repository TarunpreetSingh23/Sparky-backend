# 23 — Admin Backend

## 1. Role
You are a senior backend engineer building the Admin control plane APIs.

## 2. Objective
Build comprehensive Admin APIs with RBAC and dashboard aggregation.

## 3. Read Before Coding
- `src/lib/auth.js` (Admin auth implementation)
- `src/models/Admin.js`

## 4. Existing Architecture
Next.js API. All routes prefixed `/api/admin/`.

## 5. Requirements
- RBAC checking.
- CRUD wrappers for Customers, Professionals, Bookings, Payments, Coupons, Reviews, Tickets.
- Admin dashboard stats endpoint.

## 6. Database Changes
None required (uses existing models).

## 7. API Requirements
- `GET /api/admin/dashboard`
- `GET /api/admin/customers` (paginated, search)
- `GET /api/admin/professionals`
- `PATCH /api/admin/professionals/[id]/verify`
- `GET /api/admin/bookings`
- `PATCH /api/admin/bookings/[id]/assign`
- `POST /api/admin/coupons`
- `PATCH /api/admin/reviews/[id]/flag`

## 8. Business Logic
- Dashboard aggregation: Use MongoDB `aggregate` to calculate `todayGMV`, `todayBookings`, etc.
- Assign professional: Bypass normal dispatch, force assignment.

## 9. Validation
- Pagination params standard validation.
- RBAC permissions check per route.

## 10. Security
- Check admin JWT and role mapping.

## 11. Error Handling
- `FORBIDDEN_ROLE`
- `INVALID_ADMIN_TOKEN`

## 12. Edge Cases
- Huge collections slowing down count queries (use estimatedDocumentCount if needed).

## 13. Frontend Requirements (if applicable)
N/A

## 14. Backend Requirements (if applicable)
- Create `src/lib/adminAuth.js` middleware wrapper for RBAC.

## 15. Testing
- RBAC rejection for unauthorized admins.

## 16. Files To Create
- `src/app/api/admin/dashboard/route.js`
- `src/app/api/admin/customers/route.js`
- `src/app/api/admin/professionals/route.js`
- `src/app/api/admin/professionals/[id]/verify/route.js`
- `src/app/api/admin/bookings/route.js`
- `src/app/api/admin/coupons/route.js`

## 17. Files To Modify
- None

## 18. Files NOT To Modify
- `src/models/Booking.js`

## 19. Completion Requirements
- Aggregation pipelines efficiently fetch dashboard stats.

## Acceptance Criteria
- [ ] Admin dashboard returns correct stats structure.
- [ ] Admin can list and search users/professionals.
- [ ] RBAC blocks unauthorized actions.
