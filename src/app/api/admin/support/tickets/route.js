import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import SupportTicket from '@/models/SupportTicket';

export const dynamic = 'force-dynamic';

/**
 * GET Support Tickets List
 */
export async function GET(req) {
  try {
    await connectDB();

    // 1. Auth check
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;

    // 2. RBAC check
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'CUSTOMER_SUPPORT');
    if (!rbac.allowed) return rbac.error;

    // Extract filters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // open, in_progress, resolved, closed
    const priority = searchParams.get('priority'); // low, medium, high, critical

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tickets = await SupportTicket.find(filter)
      .populate('bookingId', 'bookingNumber scheduledDate status')
      .sort({ createdAt: -1 })
      .limit(100);

    return successResponse({ tickets });
  } catch (error) {
    logger.error('Error fetching admin support tickets list', error);
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
