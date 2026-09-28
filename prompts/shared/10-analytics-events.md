# 10 - Analytics Events

## Events Catalog
- `page_view` (page, referrer)
- `booking_started` (serviceId, packageId)
- `payment_completed` (bookingId, method)
- `search_performed` (query, results)

## Implementation
- `analytics.track(event, properties)`
- Batched and sent to `/api/analytics/event` asynchronously.
