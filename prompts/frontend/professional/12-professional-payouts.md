# 12 — Professional Payouts

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the payout history view.

## 3. Read Before Coding
- `src/lib/api.js`

## 4. Existing Architecture
Next.js App Router.

## 5. Requirements
- Route: `/payouts`.
- PayoutCard (week period, gross, net, status).
- BankAccountDisplay (masked).
- UpdateBankAccountForm.

## 6. Database Changes
None.

## 7. API Requirements
- `GET /api/professionals/[id]/payouts`

## 8. Business Logic
- Badges: pending, processing, completed, failed.

## 9. Validation
- Bank details format.

## 10. Security
- Mask bank account numbers.

## 11. Error Handling
- Failed payout reason display.

## 12. Edge Cases
- First payout missing.

## 13. Frontend Requirements
- `app/payouts/page.js`

## 14. Backend Requirements
- Payout endpoint.

## 15. Testing
- Status display.

## 16. Files To Create
- `src/app/payouts/page.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Bank details are masked.
- [ ] Status badges color coded correctly.
