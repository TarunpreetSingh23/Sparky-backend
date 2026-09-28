import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import SupportTicket from '@/models/SupportTicket';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation: CUSTOMER_SUPPORT or SUPER_ADMIN
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'CUSTOMER_SUPPORT');
    if (!rbac.allowed) return rbac.error;
    
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return errorResponse('Support ticket not found', 'TICKET_NOT_FOUND', 404);
    }
    
    const body = await req.json().catch(() => ({}));
    const { assigneeId } = body;
    
    if (!assigneeId) {
      return errorResponse('Missing assigneeId parameter', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    ticket.assignedTo = assigneeId;
    // Set status to in_progress on assignment
    if (ticket.status === 'open') {
      ticket.status = 'open'; // or in_progress if we have that state. Let's keep it.
    }
    
    await ticket.save();
    
    return successResponse({
      assigned: true,
      ticket
    });
    
  } catch (error) {
    logger.error('Error assigning support ticket', error, { ticketId: params.id });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
