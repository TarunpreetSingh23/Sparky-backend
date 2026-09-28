# 24 — Analytics System

## 1. Role
You are a backend engineer writing the analytics tracking and querying system.

## 2. Objective
Build an event ingestion API and aggregation APIs for admin business intelligence.

## 3. Read Before Coding
- `src/lib/db.js`

## 4. Existing Architecture
Next.js API. MongoDB for event storage.

## 5. Requirements
- Model `AnalyticsEvent` for raw events.
- Ingestion endpoint supporting batching.
- Aggregation endpoints for revenue, bookings, and user behavior.

## 6. Database Changes
```javascript
const analyticsEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId },
  sessionId: { type: String, required: true },
  event: { type: String, enum: ['page_view', 'service_view', 'booking_started', 'booking_completed', 'payment_initiated', 'payment_completed', 'coupon_applied', 'review_submitted', 'professional_online', 'search_performed'], required: true },
  properties: { type: mongoose.Schema.Types.Mixed },
  city: String,
  platform: { type: String, enum: ['web', 'android', 'ios'] },
  timestamp: { type: Date, default: Date.now, index: true }
});
```

## 7. API Requirements
- `POST /api/analytics/event` (accepts array of events)
- `GET /api/admin/analytics/revenue`
- `GET /api/admin/analytics/bookings`
- `GET /api/admin/analytics/professionals`
- `GET /api/admin/analytics/customers`

## 8. Business Logic
- Queries require date ranges (`from`, `to`).
- Use MongoDB aggregation pipelines for metrics (`$group`, `$match`).

## 9. Validation
- Event enum strictly enforced.

## 10. Security
- Ingestion endpoint open but rate-limited. Admin endpoints strictly protected.

## 11. Error Handling
- `INVALID_EVENT_PAYLOAD`

## 12. Edge Cases
- Massive data volume (ensure timestamp indexing).

## 13. Frontend Requirements (if applicable)
N/A

## 14. Backend Requirements (if applicable)
- Robust MongoDB pipelines in controllers.

## 15. Testing
- Verify aggregation pipelines calculate revenue correctly (sum of paise).

## 16. Files To Create
- `src/models/AnalyticsEvent.js`
- `src/app/api/analytics/event/route.js`
- `src/app/api/admin/analytics/revenue/route.js`
- `src/app/api/admin/analytics/bookings/route.js`
- `src/app/api/admin/analytics/professionals/route.js`
- `src/app/api/admin/analytics/customers/route.js`

## 17. Files To Modify
- None

## 18. Files NOT To Modify
- `src/lib/db.js`

## 19. Completion Requirements
- Aggregation endpoints functional and performant.

## Acceptance Criteria
- [ ] Can batch-ingest analytics events.
- [ ] Admin revenue aggregation returns valid data.
- [ ] Indexes exist on timestamp.
