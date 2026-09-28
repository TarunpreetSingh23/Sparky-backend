# 20 — Realtime Booking Polling

## 1. Role
You are a backend engineer implementing booking state polling and tracking.

## 2. Objective
Build highly-optimized polling endpoints for realtime booking tracking without websockets.

## 3. Read Before Coding
- `src/models/Booking.js`

## 4. Existing Architecture
Vercel serverless. Websockets/SSE are not supported/optimal.

## 5. Requirements
- Endpoint for polling booking status (called every 10s).
- Endpoint for public tracking via `shareToken`.
- Rate limiting: 1 req/8s per booking to prevent abuse.

## 6. Database Changes
- Add `shareToken: { type: String, unique: true, sparse: true }` to `Booking` model.

## 7. API Requirements
- `GET /api/bookings/[id]/status`
  - Response: `{ status, professionalId, estimatedArrival, professionalLocation, lastUpdated }`
- `GET /api/bookings/[id]/track?token=xxx`
  - Public endpoint.

## 8. Business Logic
- Generate 64-char hex `shareToken` at booking creation.
- `professionalLocation` only included if status is `PROFESSIONAL_ON_THE_WAY` or `PROFESSIONAL_ARRIVED`.
- Use cache-control headers (e.g., `s-maxage=5`).

## 9. Validation
- `shareToken` must match if using public route.

## 10. Security
- Private route requires matching `customerId` or `professionalId`.

## 11. Error Handling
- `RATE_LIMIT_EXCEEDED`
- `BOOKING_NOT_FOUND`
- `INVALID_SHARE_TOKEN`

## 12. Edge Cases
- Excessive polling by frontend bug.

## 13. Frontend Requirements (if applicable)
N/A

## 14. Backend Requirements (if applicable)
- In-memory or Redis rate limiter stub for the route.

## 15. Testing
- Verify location is hidden when status is not ON_THE_WAY/ARRIVED.

## 16. Files To Create
- `src/app/api/bookings/[id]/status/route.js`
- `src/app/api/bookings/[id]/track/route.js`

## 17. Files To Modify
- `src/models/Booking.js`

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- Caching headers and field masking working.

## Acceptance Criteria
- [ ] Returns minimal status response.
- [ ] Location is strictly redacted based on status.
- [ ] Rate limiting headers present.
- [ ] Public tracking works with valid share token.
