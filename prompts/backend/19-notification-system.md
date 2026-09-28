# 19 — Notification System

## 1. Role
You are a senior backend engineer implementing the Notification dispatcher system.

## 2. Objective
Build an event-based, multi-channel (WhatsApp, SMS, Push, Email) non-blocking notification system.

## 3. Read Before Coding
- `src/models/User.js`

## 4. Existing Architecture
Next.js serverless functions. Notifications must be dispatched asynchronously.

## 5. Requirements
- Model to log notifications.
- Event → Notification mapping matrix.
- `sendNotification(userId, event, data)` must catch errors and never crash the main request.
- Channels: AiSensy (WhatsApp), MSG91 (SMS), Firebase FCM (Push), Resend (Email).

## 6. Database Changes
```javascript
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, required: true },
  channel: { type: String, enum: ['whatsapp', 'sms', 'push', 'email'], required: true },
  title: String,
  body: String,
  data: mongoose.Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  sentAt: { type: Date, default: Date.now },
  readAt: Date
});
```

## 7. API Requirements
- `GET /api/notifications`
- `PATCH /api/notifications/[id]/read`
- `POST /api/notifications/fcm-token` (Save device token)

## 8. Business Logic
- Create `src/lib/notifications/index.js` with `sendNotification` mapping.
- FCM: send to all `fcmTokens` in user doc, remove failed tokens.

## 9. Validation
- Validate token payload on FCM token registration.

## 10. Security
- Only authenticated user can fetch/mark read their notifications.

## 11. Error Handling
- API failures to MSG91/AiSensy should be logged, not thrown to user.

## 12. Edge Cases
- User has no FCM token.
- Invalid phone number for WhatsApp.

## 13. Frontend Requirements (if applicable)
N/A

## 14. Backend Requirements (if applicable)
- Integration stubs for AiSensy, MSG91, Firebase, Resend.

## 15. Testing
- Mock third-party APIs and ensure `sendNotification` does not throw.

## 16. Files To Create
- `src/models/Notification.js`
- `src/lib/notifications/index.js`
- `src/lib/notifications/whatsapp.js`
- `src/lib/notifications/sms.js`
- `src/lib/notifications/push.js`
- `src/lib/notifications/email.js`
- API routes for notifications.

## 17. Files To Modify
- `src/models/Customer.js` and `src/models/Professional.js` (add fcmTokens array).

## 18. Files NOT To Modify
- `src/lib/db.js`

## 19. Completion Requirements
- Non-blocking wrapper implemented correctly.

## Acceptance Criteria
- [ ] Notification creation and logging works.
- [ ] Third-party failures do not block execution.
- [ ] Users can fetch and mark their notifications as read.
