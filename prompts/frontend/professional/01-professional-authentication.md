# 01 — Professional Authentication

## 1. Role
You are an expert Next.js frontend developer and mobile PWA specialist.

## 2. Objective
Build the authentication flow for Sparky professionals using MSG91 OTP and JWT cookies.

## 3. Read Before Coding
- `src/lib/auth.js`
- `src/app/globals.css`
- `tailwind.config.js`

## 4. Existing Architecture
Next.js App Router. Mobile-first PWA. JWT stored in `sparky_token` httpOnly cookie.

## 5. Requirements
- Mobile UI with dark, operational aesthetic (Sparky colors).
- Phone number input (10 digits).
- 4-digit OTP input with auto-advance.
- Redirect logic based on verification status (`active`, `training_completed` -> main app; `applied`, `under_review` -> status screen; `none` -> onboarding).

## 6. Database Changes
No new schema changes. Uses existing `Professional` model.

## 7. API Requirements
- `POST /api/auth/professional/send-otp`
  - Body: `{ phone: string }`
  - Response: `{ success: true }`
- `POST /api/auth/professional/verify-otp`
  - Body: `{ phone: string, otp: string }`
  - Response: `{ success: true, professional: {...} }`

## 8. Business Logic
- Professionals must have a valid phone number.
- OTP is requested via MSG91, valid for 10 minutes.
- Post-login, check professional status for routing.

## 9. Validation
- Frontend: Phone exactly 10 digits. OTP exactly 4 digits.
- Backend: OTP match, expiration, rate limiting.

## 10. Security
- Rate limit OTP sends to 3 per 10 minutes per IP/phone.
- Store JWT in httpOnly, secure cookies.

## 11. Error Handling
- Invalid phone: Show inline error.
- Invalid OTP: Show "Invalid OTP, please try again."
- Rate limit: Show "Too many attempts, please wait 10 minutes."

## 12. Edge Cases
- User clears cookies during OTP entry.
- Network disconnection during submission.

## 13. Frontend Requirements
- `app/login/page.js`: Phone entry.
- `app/login/verify/page.js`: OTP entry.
- `components/OTPInput.js`: 4-box input.
- `app/status/page.js`: Pending approval screen.

## 14. Backend Requirements
- Update `app/api/auth/professional/send-otp/route.js`.
- Update `app/api/auth/professional/verify-otp/route.js`.

## 15. Testing
- Verify OTP send/verify flow.
- Verify status-based routing.
- Verify JWT cookie setting.

## 16. Files To Create
- `src/app/login/page.js`
- `src/app/login/verify/page.js`
- `src/app/status/page.js`
- `src/components/OTPInput.js`

## 17. Files To Modify
- `src/middleware.js`

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Run `npm run build` and `npm run lint`. Ensure no errors.

## Acceptance Criteria
- [ ] Phone number step correctly formats and validates input.
- [ ] OTP step auto-advances and submits when 4 digits are entered.
- [ ] Successful auth redirects based on verification status.
- [ ] Invalid OTP displays appropriate error message without crashing.
