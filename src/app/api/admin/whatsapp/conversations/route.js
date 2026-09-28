import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import WhatsAppConversation from '@/models/WhatsAppConversation';

export const dynamic = 'force-dynamic';

/**
 * GET WhatsApp Conversations List
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

    // Extract filters from query
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // OPEN, CLOSED, etc.
    const mode = searchParams.get('mode'); // BOT, HUMAN, AI

    const filter = {};
    if (status) filter.status = status;
    if (mode) filter.mode = mode;

    const conversations = await WhatsAppConversation.find(filter)
      .populate('customer', 'phone name email')
      .populate('assignedAgent', 'name role')
      .sort({ lastMessageAt: -1 })
      .limit(100);

    return successResponse({ conversations });
  } catch (error) {
    logger.error('Error fetching admin WhatsApp conversations', error);
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
