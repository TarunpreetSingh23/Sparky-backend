# 16 — Professional Payouts

## 1. Role
You are a backend finance engineer implementing the professional payout system using Razorpay X.

## 2. Objective
Build an automated weekly settlement system for professionals, calculating earnings, bonuses, and transferring funds.

## 3. Read Before Coding
- `doc12_16_admin_safety_notifications_marketing_mvp.md`
- `MASTER_IMPLEMENTATION_BLUEPRINT.md`

## 4. Existing Architecture
- Next.js API Routes.
- MongoDB Models.
- Scheduled via Admin API trigger.

## 5. Requirements
- Settle payouts every Monday at 6 AM via `POST /api/admin/payouts/run-weekly` (SUPER_ADMIN only).
- Gather COMPLETED bookings from last Monday to Sunday.
- Incentives: 5+ completed jobs = ₹200 bonus.
- Generate `ProfessionalEarnings` and `ProfessionalPayout` ledgers.
- Transfer via Razorpay X API (`payouts.create`).
- Ledger Principle: Append-only, never delete earnings records.

## 6. Database Changes
- Create `ProfessionalEarnings` model.
- Create `ProfessionalPayouts` model.
- Add `razorpayContactId` and `razorpayFundAccountId` to Professional profile.

## 7. API Requirements
- `POST /api/admin/payouts/run-weekly`
- `GET /api/professionals/[id]/earnings`
- `GET /api/professionals/[id]/payouts`
- `GET /api/admin/payouts`

## 8. Business Logic
- Calculate exact payout per professional for the date range.
- Hit Razorpay X API. If success, update `payoutId` in earnings and mark `status='settled'`.
- Failed transfers logged for manual retry.

## 9. Validation
- Ensure no double payouts by checking if booking already linked to a payout.

## 10. Security
- SUPER_ADMIN only for running weekly job.
- Proper error catching for Razorpay X keys.

## 11. Error Handling
- Fund account missing: Skip professional, alert admin.
- Razorpay X error: Log and manual retry.

## 12. Edge Cases
- Negative balances (not possible here but keep in mind).
- Holidays affecting bank transfers (Razorpay X handles this, but status might pend).

## 13. Frontend Requirements (if applicable)
- N/A

## 14. Backend Requirements (if applicable)
- `src/services/payoutService.js`
- `src/lib/razorpayX.js`

## 15. Testing
- Mock Razorpay X and verify ledger immutability and bonus math.

## 16. Files To Create
- `src/models/ProfessionalEarnings.js`
- `src/models/ProfessionalPayouts.js`
- `src/services/payoutService.js`
- `src/lib/razorpayX.js`
- `src/app/api/admin/payouts/run-weekly/route.js`
- `src/app/api/professionals/[id]/earnings/route.js`
- `src/app/api/professionals/[id]/payouts/route.js`
- `src/app/api/admin/payouts/route.js`

## 17. Files To Modify
- None

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- Weekly payout accurately aggregates earnings and bonuses.

## Acceptance Criteria
- [ ] 5+ completed jobs adds ₹200 bonus
- [ ] Ledger records are created append-only
- [ ] Double payout for the same booking is prevented
