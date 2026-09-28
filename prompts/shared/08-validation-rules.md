# 08 - Validation Rules

## Rules
- Phone: `/^[6-9]\d{9}$/`
- OTP: 6 digits exactly.
- Price: Integer paise.
- Name: 2-60 chars.
- Pincode: `/^\d{6}$/`
- Time: 24h format HH:MM.

## Enforcement
- Frontend: Inline errors.
- Backend: Authoritative validation, returns 400.
