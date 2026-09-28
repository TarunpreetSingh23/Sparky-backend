# 02 — Authentication

## 1. Role

You are a senior Next.js security engineer implementing passwordless OTP authentication for Sparky. This is the second most critical module — everything that requires a logged-in user depends on this.

---

## 2. Objective

Implement complete OTP-based authentication for all three user types (customer, professional, admin). Includes OTP generation, SMS delivery, verification, JWT issuance, session management, refresh tokens, logout, and account lockout.

---

## 3. Read Before Coding

- `c:/RAG-frontend/prompts/backend/01-backend-foundation.md` — must be implemented first
- `c:/RAG-frontend/prompts/shared/03-authentication-contract.md`
- `c:/RAG-frontend/prompts/shared/09-security-rules.md`
- `c:/RAG-frontend/mdfile/doc9_10_11_api_booking_payment.md` — section 9.2
- `c:/RAG-frontend/mdfile/doc8_database_specification.md` — sections 8.2, 8.3
- Existing `src/models/User.js` if it exists — check before creating

---

## 4. Existing Architecture

- OTP delivered via MSG91 SMS API
- JWT stored in httpOnly cookie (`sparky_token`)
- Refresh token stored in httpOnly cookie (`sparky_refresh`)
- No password — fully passwordless
- All three roles (customer, professional, admin) use same OTP flow
- OTP sessions stored in `otpSessions` MongoDB collection

---

## 5. Database Changes

### Collection: `users`

```javascript
// src/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  phone: {
    type: String, required: true, unique: true,
    match: [/^[6-9]\d{9}$/, 'Invalid Indian mobile number'],
    index: true,
  },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  role: {
    type: String,
    enum: ['customer', 'professional', 'admin'],
    required: true,
    default: 'customer',
  },
  isActive: { type: Boolean, default: true },
  isPhoneVerified: { type: Boolean, default: false },
  googleId: String,
  lastLoginAt: Date,
  // Security
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  // Push notifications
  fcmTokens: [{ type: String }],
}, { timestamps: true });

// Do NOT return sensitive fields
UserSchema.methods.toSafeObject = function() {
  return {
    id: this._id,
    phone: this.phone,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    isPhoneVerified: this.isPhoneVerified,
  };
};

UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
```

### Collection: `otpSessions`

```javascript
// src/models/OtpSession.js
import mongoose from 'mongoose';

const OtpSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true, index: true },
  otpHash: { type: String, required: true }, // bcrypt hash of OTP
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, // TTL index
  usedAt: Date,
  ipAddress: String,
}, { timestamps: true });

export default mongoose.models.OtpSession || mongoose.model('OtpSession', OtpSessionSchema);
```

---

## 6. API Requirements

### POST /api/auth/send-otp

**Rate limit:** 3 requests per phone per hour; 10 per IP per hour

**Request:**
```json
{ "phone": "9876543210" }
```

**Response (200):**
```json
{ "success": true, "otpSessionId": "sess_abc123", "expiresIn": 600 }
```

**Error responses:**
```json
{ "success": false, "error": "Invalid phone number", "code": "INVALID_PHONE" }
{ "success": false, "error": "Too many OTP requests. Try after 1 hour.", "code": "RATE_LIMITED" }
```

**Implementation logic:**
1. Validate phone format: `/^[6-9]\d{9}$/`
2. Check rate limit (phone + IP)
3. Generate 6-digit OTP: `Math.floor(100000 + Math.random() * 900000).toString()`
4. Hash OTP with bcrypt (`bcrypt.hash(otp, 10)`)
5. Create OtpSession document with 10-minute TTL
6. Send OTP via MSG91 SMS
7. Return sessionId — **never return the OTP itself**

**MSG91 integration:**
```javascript
async function sendOtpSms(phone, otp) {
  const response = await fetch('https://api.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: process.env.MSG91_AUTH_KEY },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: `91${phone}`,
      otp,
    }),
  });
  if (!response.ok) throw new Error('SMS delivery failed');
}
```

**Development mode:** If `NODE_ENV === 'development'`, skip SMS and log OTP to console **only in dev**.

---

### POST /api/auth/verify-otp

**Rate limit:** 5 attempts per sessionId

**Request:**
```json
{ "phone": "9876543210", "otp": "123456", "otpSessionId": "sess_abc123" }
```

**Response (200 — existing user):**
```json
{
  "success": true,
  "user": { "id": "xxx", "role": "customer", "name": "Priya", "isNewUser": false },
  "isNewUser": false
}
```

**Response (200 — new user):**
```json
{ "success": true, "isNewUser": true }
```

**Cookies set on success:**
```
sparky_token: <JWT access token, 15min>
sparky_refresh: <refresh token, 30days>
```
Both: `httpOnly=true`, `sameSite=strict`, `secure=true` (in production), `path=/`

**Error responses:**
```json
{ "success": false, "error": "Invalid OTP", "code": "INVALID_OTP", "attemptsLeft": 2 }
{ "success": false, "error": "OTP expired", "code": "OTP_EXPIRED" }
{ "success": false, "error": "Account locked. Try after 30 minutes.", "code": "ACCOUNT_LOCKED" }
{ "success": false, "error": "OTP session not found", "code": "SESSION_NOT_FOUND" }
```

**Implementation logic:**
1. Find OtpSession by sessionId
2. Verify session not expired (`expiresAt > now`)
3. Verify session not already used (`usedAt` is null)
4. Increment `attempts`; if `attempts >= maxAttempts` → delete session, return error
5. Compare OTP: `bcrypt.compare(otp, session.otpHash)`
6. If invalid: decrement attempts remaining, return error
7. If valid: mark session as used (`usedAt = now`)
8. Find or create User by phone
9. Update `lastLoginAt`, `isPhoneVerified = true`
10. Reset `loginAttempts = 0`, clear `lockUntil`
11. If user has Customer/Professional profile: include in response
12. Generate JWT and refresh token
13. Set httpOnly cookies
14. Return user object

**JWT payload:**
```json
{ "userId": "xxx", "role": "customer", "phone": "9876543210", "iat": 1234567890, "exp": 1234567890 }
```

---

### GET /api/auth/me

**Auth:** Required (JWT cookie)

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "xxx",
    "role": "customer",
    "name": "Priya Sharma",
    "phone": "987XXXXXX0",
    "city": "amritsar",
    "walletBalance": 15000,
    "loyaltyCoins": 340,
    "profilePhoto": "https://..."
  }
}
```

**Note:** Phone number is masked in response: `9876543210` → `987XXXXXX0`

---

### POST /api/auth/logout

**Auth:** Required

**Response (200):** `{ "success": true }`

**Action:** Clear both cookies by setting them to empty with `maxAge: 0`.

---

### POST /api/auth/refresh

**Request:** No body; reads `sparky_refresh` cookie

**Response (200):** Sets new `sparky_token` cookie

**Logic:**
1. Extract refresh token from cookie
2. Verify with `JWT_REFRESH_SECRET`
3. Check user still active in DB
4. Issue new access token
5. Set new `sparky_token` cookie

**Error:** `401 UNAUTHORIZED` if refresh token invalid/expired

---

## 7. Business Logic

### Account Lockout Policy
- After **5 consecutive failed** OTP attempts (not session-level, user-level): lock account for 30 minutes
- Track `loginAttempts` on User document
- Clear on successful login
- `lockUntil` timestamp determines lock expiry

### New User Flow
- If phone not found in `users` collection: create User, set `isNewUser: true` in response
- Frontend redirects new user to onboarding/signup screen
- Customer profile is created during onboarding (prompt 03), NOT here

### Role Detection
- Phone is unique; role is set on first registration context
- Professional registration is a separate flow (never defaults to professional)
- Admin users are created only by `SUPER_ADMIN` or via `ADMIN_SECRET_KEY` on first setup

---

## 8. Validation

**Backend (authoritative):**
- Phone: `/^[6-9]\d{9}$/` — 10-digit Indian mobile
- OTP: `/^\d{6}$/` — exactly 6 digits
- SessionId: non-empty string
- Phone sanitization: strip spaces, dashes, `+91` prefix

**Frontend:**
- Same phone validation with real-time feedback
- OTP auto-advance when all 6 digits entered

---

## 9. Security

- OTP stored as bcrypt hash ONLY — never plaintext
- JWT stored in httpOnly cookie — not accessible to JavaScript
- Refresh token stored in separate httpOnly cookie
- OTP session has 10-minute TTL (MongoDB TTL index)
- Rate limit: 3 OTPs per phone per hour, 10 per IP per hour
- OTP is never returned in API response (not even in dev mode response body)
- Account lockout after 5 failed attempts
- Mask phone in all API responses: `987XXXXXX0`
- Session invalidated immediately after successful use

---

## 10. Error Handling

| Scenario | HTTP Status | Code |
|---|---|---|
| Phone format invalid | 400 | `INVALID_PHONE` |
| Rate limit exceeded | 429 | `RATE_LIMITED` |
| OTP session not found | 400 | `SESSION_NOT_FOUND` |
| OTP expired | 400 | `OTP_EXPIRED` |
| OTP invalid | 400 | `INVALID_OTP` |
| Account locked | 423 | `ACCOUNT_LOCKED` |
| SMS delivery failed | 500 | `SMS_FAILED` |
| User account disabled | 403 | `ACCOUNT_DISABLED` |

---

## 11. Edge Cases

- Same phone sends OTP twice quickly → second OTP invalidates first session
- OTP entered after 10 minutes → session expired (TTL deleted document)
- User closes app after OTP sent, reopens → uses sessionId from previous request
- Admin tries to login as customer on customer app → blocked by role check in frontend (but backend doesn't restrict OTP flow — role is transparent to OTP)
- Phone registered with typo → no way to verify; user must re-register with correct number

---

## 12. Files To Create

- `src/models/User.js`
- `src/models/OtpSession.js`
- `src/app/api/auth/send-otp/route.js`
- `src/app/api/auth/verify-otp/route.js`
- `src/app/api/auth/me/route.js`
- `src/app/api/auth/logout/route.js`
- `src/app/api/auth/refresh/route.js`
- `src/lib/sms.js` (MSG91 utility)

---

## 13. Files To Modify

- `src/lib/auth.js` — complete the implementation started in prompt 01

---

## 14. Files NOT To Modify

- `src/lib/mongodb.js`
- `src/lib/apiResponse.js`
- `src/lib/logger.js`

---

## 15. Completion Requirements

- Run `npm run build` — must pass
- No OTPs in any log output
- No secrets in any file

---

## Acceptance Criteria

- [ ] POST `/api/auth/send-otp` with valid phone returns 200 + sessionId
- [ ] POST `/api/auth/send-otp` with invalid phone returns 400 `INVALID_PHONE`
- [ ] POST `/api/auth/send-otp` 4 times same phone within 1 hour returns 429
- [ ] POST `/api/auth/verify-otp` with correct OTP sets httpOnly cookies
- [ ] POST `/api/auth/verify-otp` with wrong OTP returns `INVALID_OTP` with attemptsLeft
- [ ] POST `/api/auth/verify-otp` after 10 minutes returns `OTP_EXPIRED`
- [ ] GET `/api/auth/me` without cookie returns 401
- [ ] GET `/api/auth/me` with valid cookie returns masked phone
- [ ] POST `/api/auth/logout` clears both cookies
- [ ] OTP is never present in any API response body
- [ ] OTP is stored as bcrypt hash in DB
- [ ] Account locks after 5 failed attempts
- [ ] Build passes
