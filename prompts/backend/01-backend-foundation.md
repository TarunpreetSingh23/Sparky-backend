# 01 — Backend Foundation

## 1. Role

You are a senior Next.js + Node.js engineer setting up the Sparky backend foundation. This is the first prompt that must be executed. Everything else depends on what you build here.

---

## 2. Objective

Set up the foundational backend infrastructure for Sparky: database connection, API response utilities, error handling, request validation middleware, security headers, and environment configuration. No feature logic yet — only infrastructure.

---

## 3. Read Before Coding

- `c:/RAG-frontend/mdfile/doc7_technical_architecture.md` — sections 7.1–7.3
- `c:/RAG-frontend/mdfile/doc8_database_specification.md` — section 8.1
- `c:/RAG-frontend/prompts/shared/01-api-contracts.md`
- `c:/RAG-frontend/prompts/shared/02-error-handling.md`
- `c:/RAG-frontend/prompts/shared/09-security-rules.md`
- All existing files in `src/` before changing anything

**NEVER overwrite existing files without reading them first.**

---

## 4. Existing Architecture

- Next.js App Router (`src/app/`)
- API routes in `src/app/api/`
- MongoDB Atlas + Mongoose
- JavaScript (not TypeScript)
- Tailwind CSS on frontend
- Deployed on Vercel

---

## 5. Requirements

### 5.1 MongoDB Connection

Create `src/lib/mongodb.js`:

```javascript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: 'sparky_production',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

### 5.2 API Response Utilities

Create `src/lib/apiResponse.js`:

```javascript
export function successResponse(data, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export function errorResponse(message, code, status = 400, extra = {}) {
  return Response.json({ success: false, error: message, code, ...extra }, { status });
}

// Standard error codes
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
  COUPON_INVALID: 'COUPON_INVALID',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};
```

### 5.3 Request Validation

Create `src/lib/validate.js` using Zod:

```javascript
import { z } from 'zod';
import { errorResponse, ERROR_CODES } from './apiResponse';

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return { valid: false, errors };
  }
  return { valid: true, data: result.data };
}

export function validationErrorResponse(errors) {
  return errorResponse('Validation failed', ERROR_CODES.VALIDATION_ERROR, 400, { errors });
}

// Common validators
export const schemas = {
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  otp: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
  objectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  timeSlot: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM'),
  paise: z.number().int().min(0, 'Amount must be non-negative integer in paise'),
};
```

### 5.4 Authentication Middleware

Create `src/lib/auth.js` — JWT cookie extraction and verification (stub; full implementation in prompt 02):

```javascript
import jwt from 'jsonwebtoken';
import { errorResponse, ERROR_CODES } from './apiResponse';

const JWT_SECRET = process.env.JWT_SECRET;

export function getTokenFromRequest(req) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/sparky_token=([^;]+)/);
  return match ? match[1] : null;
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function requireAuth(req) {
  const token = getTokenFromRequest(req);
  if (!token) return { user: null, error: errorResponse('Authentication required', ERROR_CODES.UNAUTHORIZED, 401) };
  const decoded = verifyToken(token);
  if (!decoded) return { user: null, error: errorResponse('Invalid or expired session', ERROR_CODES.UNAUTHORIZED, 401) };
  return { user: decoded, error: null };
}

export async function requireRole(req, ...allowedRoles) {
  const { user, error } = await requireAuth(req);
  if (error) return { user: null, error };
  if (!allowedRoles.includes(user.role)) {
    return { user: null, error: errorResponse('Insufficient permissions', ERROR_CODES.FORBIDDEN, 403) };
  }
  return { user, error: null };
}
```

### 5.5 Rate Limiting (Simple, No Redis)

Create `src/lib/rateLimit.js`:

```javascript
// Simple in-memory rate limiter for Vercel serverless
// Resets on function restart — acceptable for MVP
// Upgrade to Upstash Redis when scaling

const store = new Map();

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = store.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count++;
  store.set(key, entry);

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

// Convenience functions
export function otpRateLimit(phone) {
  return rateLimit(`otp:${phone}`, 3, 60 * 60 * 1000); // 3 per hour per phone
}

export function ipRateLimit(ip, endpoint) {
  return rateLimit(`ip:${ip}:${endpoint}`, 10, 60 * 60 * 1000); // 10 per hour per IP per endpoint
}

export function apiRateLimit(userId) {
  return rateLimit(`api:${userId}`, 100, 60 * 1000); // 100 per minute per user
}
```

### 5.6 Environment Configuration

Create `src/lib/config.js`:

```javascript
// Centralize environment variable access
// Fail fast if required variables are missing

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiry: '15m',
    refreshExpiry: '30d',
  },
  razorpay: {
    keyId: requireEnv('RAZORPAY_KEY_ID'),
    keySecret: requireEnv('RAZORPAY_KEY_SECRET'),
    webhookSecret: requireEnv('RAZORPAY_WEBHOOK_SECRET'),
  },
  google: {
    mapsApiKey: requireEnv('GOOGLE_MAPS_API_KEY'),
  },
  cloudinary: {
    cloudName: requireEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey: requireEnv('CLOUDINARY_API_KEY'),
    apiSecret: requireEnv('CLOUDINARY_API_SECRET'),
  },
  msg91: {
    authKey: requireEnv('MSG91_AUTH_KEY'),
    senderId: process.env.MSG91_SENDER_ID || 'SPARKY',
    templateId: requireEnv('MSG91_TEMPLATE_ID'),
  },
  aisensy: {
    apiKey: requireEnv('AISENSY_API_KEY'),
  },
  firebase: {
    projectId: requireEnv('FIREBASE_PROJECT_ID'),
    clientEmail: requireEnv('FIREBASE_CLIENT_EMAIL'),
    privateKey: requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  },
  resend: {
    apiKey: requireEnv('RESEND_API_KEY'),
    from: process.env.EMAIL_FROM || 'noreply@sparky.in',
  },
};
```

**Important:** Do NOT call `config` at module import time in Vercel edge functions. Call it inside the function body only.

### 5.7 Logging

Create `src/lib/logger.js`:

```javascript
// Structured logging. Never log OTPs, passwords, or PII.

export const logger = {
  info: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify({ level: 'info', message, ...sanitizeMeta(meta), ts: new Date().toISOString() }));
    }
  },
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...sanitizeMeta(meta), ts: new Date().toISOString() }));
  },
  error: (message, error, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error', message,
      error: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      ...sanitizeMeta(meta),
      ts: new Date().toISOString()
    }));
  },
};

function sanitizeMeta(meta) {
  const redacted = { ...meta };
  const sensitiveKeys = ['otp', 'password', 'token', 'secret', 'aadhaar', 'pan', 'bank'];
  for (const key of sensitiveKeys) {
    if (key in redacted) redacted[key] = '[REDACTED]';
  }
  // Mask phone numbers
  if (redacted.phone) redacted.phone = redacted.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2');
  return redacted;
}
```

### 5.8 Next.js Security Headers

In `next.config.js`:

```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
```

---

## 6. Database Changes

None. This prompt only sets up infrastructure.

---

## 7. API Requirements

None in this prompt. These utilities are used by subsequent prompts.

---

## 8. Business Logic

None. Infrastructure only.

---

## 9. Validation

- All required env variables must throw on startup if missing
- Phone validation: `/^[6-9]\d{9}$/` — Indian mobile numbers only
- All API calls must be validated using Zod schemas

---

## 10. Security

- JWT secret must be minimum 32 characters
- Never log raw OTPs, tokens, Aadhaar numbers, or bank details
- Rate limiting applied at handler level (not middleware — Vercel serverless doesn't support persistent middleware state well)
- Store JWT in `httpOnly`, `sameSite: 'strict'`, `secure: true` cookies only

---

## 11. Error Handling

All API handlers must follow this pattern:

```javascript
export async function POST(req) {
  try {
    await connectDB();
    // ... handler logic
    return successResponse(data);
  } catch (error) {
    logger.error('Handler error', error, { endpoint: '/api/...' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
```

Never let raw errors escape to the client.

---

## 12. Edge Cases

- `MONGODB_URI` not set → throw immediately at import time
- `JWT_SECRET` shorter than 32 chars → warn in logs (do not throw — may break existing)
- Mongoose connection already exists → reuse cached connection (do not reconnect)
- Multiple concurrent requests on cold start → `promise` caching prevents multiple connections

---

## 13. Frontend Requirements

None in this prompt.

---

## 14. Backend Requirements

This prompt creates only utility files. No API routes yet.

---

## 15. Testing

After implementing, verify:

```bash
# Build passes
npm run build

# No import errors
node -e "import('./src/lib/mongodb.js')"
node -e "import('./src/lib/apiResponse.js')"
```

---

## 16. Files To Create

- `src/lib/mongodb.js`
- `src/lib/apiResponse.js`
- `src/lib/validate.js`
- `src/lib/auth.js`
- `src/lib/rateLimit.js`
- `src/lib/config.js`
- `src/lib/logger.js`

---

## 17. Files To Modify

- `next.config.js` — add security headers

---

## 18. Files NOT To Modify

- Any existing model files
- Any existing API routes
- `package.json` (unless adding `zod` which may be missing)

---

## 19. Dependencies To Install

```bash
npm install zod jsonwebtoken bcryptjs mongoose
```

---

## 20. Completion Requirements

- [ ] `npm run build` passes with no errors
- [ ] All `src/lib/` files exist
- [ ] No hardcoded secrets anywhere
- [ ] No `console.log` outside `logger.js`
- [ ] `config.js` throws clearly for missing env vars

---

## Acceptance Criteria

- [ ] `connectDB()` returns a mongoose connection without creating duplicate connections
- [ ] `successResponse()` always returns `{ success: true, data: ... }`
- [ ] `errorResponse()` always returns `{ success: false, error: ..., code: ... }`
- [ ] `requireAuth()` returns `{ user, error }` — never throws
- [ ] `rateLimit()` returns `{ allowed, remaining, resetAt }`
- [ ] Logger never outputs raw phone numbers or OTPs
- [ ] Security headers present in all responses
- [ ] Build passes
