# 10 — Customer Profile

## 1. Role
Expert Next.js Frontend Developer.

## 2. Objective
Build profile and account management.

## 3. Read Before Coding
c:/RAG-frontend/prompts/shared/07-design-system.md

## 4. Existing Architecture
Next.js App Router, JS, Tailwind.

## 5. Requirements
- Route: `/profile`.
- Sections (Accordions/Tabs): Profile Info, Saved Addresses, Preferences, Wallet, Referral, Notifications, Logout.
- Wallet: GET `/api/customers/[id]/wallet`.
- Referral: GET `/api/customers/[id]/referral`.
- Photo upload to Cloudinary -> PATCH API.

## 6. Database Changes
N/A

## 7. API Requirements
- PATCH `/api/customers/[id]`
- POST `/api/upload/public`
- GET `/api/customers/[id]/wallet`
- GET `/api/customers/[id]/referral`

## 8. Business Logic
- Wallet balance in paise -> display ₹.
- Addresses linked to Google Maps Places.

## 9. Validation
- Photo upload size limit: 5MB.

## 10. Security
- Only mutate profile via authenticated requests.

## 11. Error Handling
- Image upload failures.

## 12. Edge Cases
- Zero wallet balance.

## 13. Frontend Requirements (if applicable)
- Lazy-loaded accordions to prevent heavy up-front loading.
- App version shown at bottom.

## 14. Backend Requirements (if applicable)
N/A

## 15. Testing
- Cloudinary upload flow.
- Form validations.

## 16. Files To Create
- `src/app/profile/page.js`
- `src/components/profile/ProfileInfoForm.js`
- `src/components/profile/AddressManager.js`
- `src/components/profile/WalletView.js`
- `src/components/profile/ReferralView.js`
- `src/components/profile/PhotoUpload.js`

## 17. Files To Modify
N/A

## 18. Files NOT To Modify
N/A

## 19. Completion Requirements
Build and lint commands must pass.

## Acceptance Criteria
- [ ] Photo upload hits public upload API and updates profile.
- [ ] Wallet and Referral sections load dynamic data.
- [ ] Accordion items expand/collapse smoothly.
