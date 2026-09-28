import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import SupportTicket from '@/models/SupportTicket';

export const dynamic = 'force-dynamic';

/**
 * GET Support Ticket Details
 */
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    // 1. Auth check
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;

    // 2. RBAC check
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'CUSTOMER_SUPPORT');
    if (!rbac.allowed) return rbac.error;

    const ticket = await SupportTicket.findById(id)
      .populate('bookingId')
      .populate('assignedTo', 'name role');

    if (!ticket) {
      return errorResponse('Support ticket not found', 'TICKET_NOT_FOUND', 404);
    }

    return successResponse({ ticket });
  } catch (error) {
    logger.error('Error fetching admin support ticket details', error, { ticketId: params.id });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

/**
 * PATCH Update Support Ticket Properties (Status, Priority, Resolution)
 */
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    // 1. Auth check
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;

    // 2. RBAC check
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'CUSTOMER_SUPPORT');
    if (!rbac.allowed) return rbac.error;

    const body = await req.json().catch(() => ({}));
    const { status, priority, resolution } = body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return errorResponse('Support ticket not found', 'TICKET_NOT_FOUND', 404);
    }

    if (status !== undefined) {
      ticket.status = status;
      if (status === 'resolved' || status === 'closed') {
        ticket.resolvedAt = new Date();
      }
    }
    if (priority !== undefined) ticket.priority = priority;
    if (resolution !== undefined) ticket.resolution = resolution;

    await ticket.save();

    return successResponse({ ticket });
  } catch (error) {
    logger.error('Error updating admin support ticket status', error, { ticketId: params.id });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
