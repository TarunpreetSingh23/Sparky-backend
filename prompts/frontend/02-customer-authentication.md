# 02 — Customer Authentication

## 1. Role
Expert Next.js Frontend Developer.

## 2. Objective
Build authentication screens and flow for the Sparky customer app.

## 3. Read Before Coding
c:/RAG-frontend/prompts/shared/07-design-system.md

## 4. Existing Architecture
Next.js App Router, JS, Tailwind.

## 5. Requirements
- Routes: `/login`, `/otp`, `/signup`.
- Components: `PhoneInput` (+91 prefix, 10-digit), `OTPInput` (6-box auto-advance, paste support, timer), `SignupForm`.
- Flow: enter phone → send OTP → redirect to `/otp` (with sessionId) → verify OTP → if exists go home, else `/signup` → go home.
- HOC `requireAuth` wrapper for protected routes.
- Auto-redirect to home if logged in.
- Logout button in profile.

## 6. Database Changes
N/A

## 7. API Requirements
- POST `/api/auth/send-otp` (body: phone)
- POST `/api/auth/verify-otp` (body: phone, otp, sessionId)
- POST `/api/auth/signup` (body: name, gender)

## 8. Business Logic
- Phone numbers are 10 digits.
- New users need name + gender signup step.

## 9. Validation
- Phone: exactly 10 digits.
- OTP: exactly 6 digits.
- Name: required.

## 10. Security
- Tokens are HttpOnly, never stored in JS state.
- Unauthenticated users redirected to `/login` from protected routes.

## 11. Error Handling
- RATE_LIMITED: show cooldown timer.
- ACCOUNT_LOCKED: show unlock time.
- Invalid OTP: show error under input.

## 12. Edge Cases
- User refreshes `/otp` without sessionId: redirect to `/login`.
- OTP expiration.

## 13. Frontend Requirements (if applicable)
- `PhoneInput`: India number format display.
- `OTPInput`: Uses refs to auto-advance focus.

## 14. Backend Requirements (if applicable)
N/A

## 15. Testing
- Test auto-focus in OTP inputs.
- Test protected route redirects.

## 16. Files To Create
- `src/app/(auth)/login/page.js`
- `src/app/(auth)/otp/page.js`
- `src/app/(auth)/signup/page.js`
- `src/components/auth/PhoneInput.js`
- `src/components/auth/OTPInput.js`
- `src/components/auth/ProtectedRoute.js`

## 17. Files To Modify
- `src/store/authStore.js`

## 18. Files NOT To Modify
N/A

## 19. Completion Requirements
Build and lint commands must pass.

## Acceptance Criteria
- [ ] Phone input requires 10 digits.
- [ ] OTP input auto-advances and supports paste.
- [ ] Protected routes redirect to /login.
