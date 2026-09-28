# 15 — Professional Notifications

## 1. Role
You are an expert Next.js frontend developer.

## 2. Objective
Build the notification center for professionals.

## 3. Read Before Coding
- `src/lib/api.js`

## 4. Existing Architecture
Next.js App Router, Firebase FCM.

## 5. Requirements
- Route: `/notifications`.
- NotificationList with NotificationItem.
- Push setup on first launch.

## 6. Database Changes
None.

## 7. API Requirements
- `GET /api/notifications`
- `POST /api/notifications/fcm-token`

## 8. Business Logic
- Icons by type: new job (star), job cancelled (x), payment received (rupee), performance alert (chart), system (bell).

## 9. Validation
- Valid token structure.

## 10. Security
- Protected route.

## 11. Error Handling
- FCM registration failure.

## 12. Edge Cases
- Push disabled by user.

## 13. Frontend Requirements
- `app/notifications/page.js`

## 14. Backend Requirements
- Notification retrieval API.

## 15. Testing
- FCM token save.

## 16. Files To Create
- `src/app/notifications/page.js`

## 17. Files To Modify
- None.

## 18. Files NOT To Modify
- `package.json`

## 19. Completion Requirements
Build and lint.

## Acceptance Criteria
- [ ] Requests push notification permissions.
- [ ] Lists notifications with correct icons.
