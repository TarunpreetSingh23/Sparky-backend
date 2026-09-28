# 18 — Support Ticket System

## 1. Role
You are a senior backend engineer implementing the Support Ticket system.

## 2. Objective
Build a support ticket system for customers and professionals to report issues, with SLA tracking and priority-based escalation.

## 3. Read Before Coding
- `src/models/User.js`
- `src/models/Booking.js`

## 4. Existing Architecture
Next.js API routes, Mongoose models, JWT auth.

## 5. Requirements
- Auto-generated ticket number `TKT+date+seq` (e.g., TKT202310250001).
- Roles: customer, professional, admin.
- SLA tracking based on priority. Critical: 0.5h response, 4h resolution.
- Messages array embedded in the ticket.

## 6. Database Changes
```javascript
const supportTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true, required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  creatorModel: { type: String, enum: ['Customer', 'Professional'], required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  category: { type: String, enum: ['payment_issue', 'quality_complaint', 'professional_behaviour', 'app_issue', 'refund_request', 'other'] },
  subject: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  slaDeadline: { type: Date, required: true },
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderRole: { type: String, enum: ['Customer', 'Professional', 'Admin'], required: true },
    message: { type: String, required: true },
    attachments: [{ type: String }],
    sentAt: { type: Date, default: Date.now }
  }],
  resolvedAt: { type: Date }
}, { timestamps: true });
```

## 7. API Requirements
- `POST /api/support/tickets` (Customer/Pro)
- `GET /api/support/tickets` (Customer/Pro own)
- `GET /api/support/tickets/:id` 
- `POST /api/support/tickets/:id/messages`
- Admin routes under `/api/admin/support/tickets` for assignment, resolution, SLA monitoring.

## 8. Business Logic
- Calculate `slaDeadline` on creation based on priority.
- Update `resolvedAt` when status changes to resolved.
- If SLA breached, auto-escalate (cron or lazy-evaluation on fetch).

## 9. Validation
- Categories and priorities must match enums.
- Message text required.

## 10. Security
- Only ticket creator and admins can view/message.
- Admins require valid RBAC.

## 11. Error Handling
- `TICKET_NOT_FOUND`
- `UNAUTHORIZED_ACCESS`

## 12. Edge Cases
- Concurrent message posting.
- Ticket closed by admin, customer tries to reply (should reopen or create new).

## 13. Frontend Requirements (if applicable)
N/A

## 14. Backend Requirements (if applicable)
- Create `src/models/SupportTicket.js`.
- SLA calculator utility.

## 15. Testing
- SLA deadline calculation logic.
- Ticket number generator uniqueness.

## 16. Files To Create
- `src/models/SupportTicket.js`
- `src/app/api/support/tickets/route.js`
- `src/app/api/support/tickets/[id]/route.js`
- `src/app/api/support/tickets/[id]/messages/route.js`
- `src/app/api/admin/support/tickets/route.js`
- `src/app/api/admin/support/tickets/[id]/route.js`

## 17. Files To Modify
- None

## 18. Files NOT To Modify
- `src/lib/auth.js`

## 19. Completion Requirements
- Endpoints successfully return generated ticket number.

## Acceptance Criteria
- [ ] Ticket creation assigns correct ticket number and SLA.
- [ ] User can fetch only their own tickets.
- [ ] Admin can fetch all tickets and change status.
- [ ] Messages are properly appended.
