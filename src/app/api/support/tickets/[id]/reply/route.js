import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import SupportTicket from '@/models/SupportTicket';
import Customer from '@/models/Customer';
import Professional from '@/models/Professional';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return errorResponse('Support ticket not found', 'TICKET_NOT_FOUND', 404);
    }
    
    // Validate access: owner or admin
    let hasAccess = false;
    if (user.role === 'admin') {
      hasAccess = true;
    } else if (user.role === 'customer' && ticket.customerId) {
      const customer = await Customer.findOne({ userId: user.userId });
      if (customer && ticket.customerId.toString() === customer._id.toString()) {
        hasAccess = true;
      }
    } else if (user.role === 'professional' && ticket.professionalId) {
      const professional = await Professional.findOne({ userId: user.userId });
      if (professional && ticket.professionalId.toString() === professional._id.toString()) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return errorResponse('Access denied. You do not have permissions to access this ticket.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const body = await req.json().catch(() => ({}));
    const { message } = body;
    
    if (!message) {
      return errorResponse('Message body is required', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    ticket.messages.push({
      senderId: user.userId,
      senderType: user.role === 'admin' ? 'Admin' : user.role === 'customer' ? 'Customer' : 'Professional',
      senderRole: user.role,
      message,
      sentAt: new Date(),
      timestamp: new Date()
    });
    
    // Status update: if admin replies, mark as resolved or pending customer input. If customer replies, mark as open.
    if (user.role === 'admin') {
      ticket.status = body.closeTicket ? 'closed' : 'resolved';
    } else {
      // Re-open if closed or resolved when user replies
      if (['closed', 'resolved'].includes(ticket.status)) {
        ticket.status = 'open';
      }
    }
    
    await ticket.save();
    return successResponse({ ticket });
    
  } catch (error) {
    logger.error('Error replying to support ticket', error, { ticketId: params.id });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
