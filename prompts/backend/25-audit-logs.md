# 25 — Audit Logs

## 1. Role
You are a senior backend engineer implementing an immutable audit logging system.

## 2. Objective
Ensure all sensitive system actions (admin changes, financial operations) are logged permanently and safely.

## 3. Read Before Coding
- Admin APIs structure

## 4. Existing Architecture
Next.js API. MongoDB.

## 5. Requirements
- Model `AuditLog`. Immutable (no updates/deletes).
- Redaction of sensitive fields in `before`/`after` snapshots.
- Read-only Admin API to view logs.

## 6. Database Changes
```javascript
const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true }, // e.g., 'professional.verified'
  resourceType: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
});
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ actorId: 1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

// Prevent modifications at mongoose level
auditLogSchema.pre('updateOne', function(next) { next(new Error('Audit logs are immutable')); });
auditLogSchema.pre('remove', function(next) { next(new Error('Audit logs are immutable')); });
```

## 7. API Requirements
- `GET /api/admin/audit-logs` (Query params: from, to, actorId, action, resourceType)

## 8. Business Logic
- `createAuditLog(actorId, actorRole, action, resourceType, resourceId, before, after, req)` utility.
- Filter out Aadhaar, bank numbers, passwords, OTP hashes from `before`/`after` objects before saving.

## 9. Validation
- `action` format validation.

## 10. Security
- Only Super Admin can view audit logs.

## 11. Error Handling
- Discard errors silently in `createAuditLog` to prevent breaking app flow, but log via `console.error`.

## 12. Edge Cases
- Huge nested objects inside before/after.

## 13. Frontend Requirements (if applicable)
N/A

## 14. Backend Requirements (if applicable)
- Create `src/lib/auditLogger.js`.

## 15. Testing
- Verify redaction removes sensitive keys.
- Verify immutability hooks trigger.

## 16. Files To Create
- `src/models/AuditLog.js`
- `src/lib/auditLogger.js`
- `src/app/api/admin/audit-logs/route.js`

## 17. Files To Modify
- Apply `createAuditLog` to previous Admin APIs (Professional verification, Booking changes).

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- Logs capture requested changes immutably with PII redacted.

## Acceptance Criteria
- [ ] Audit logs can be written.
- [ ] Attempting to update or delete audit logs throws an error.
- [ ] Passwords and OTP hashes are redacted from logged payloads.
- [ ] Admin API filters logs correctly.
