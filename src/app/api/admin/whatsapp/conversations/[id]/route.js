import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import WhatsAppConversation from '@/models/WhatsAppConversation';
import WhatsAppMessage from '@/models/WhatsAppMessage';
import WhatsAppCustomer from '@/models/WhatsAppCustomer';
import { sendTextMessage } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * GET Conversation Details & Message History
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

    const conversation = await WhatsAppConversation.findById(id)
      .populate('customer', 'phone name email botEnabled humanHandoff')
      .populate('assignedAgent', 'name role');

    if (!conversation) {
      return errorResponse('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
    }

    const messages = await WhatsAppMessage.find({ conversation: conversation._id })
      .sort({ createdAt: 1 })
      .limit(200);

    return successResponse({ conversation, messages });
  } catch (error) {
    logger.error('Error fetching admin conversation details', error, { conversationId: params.id });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

/**
 * POST Agent Reply to WhatsApp Customer
 */
export async function POST(req, { params }) {
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
    const { text } = body;

    if (!text) {
      return errorResponse('Message text is required', ERROR_CODES.VALIDATION_ERROR, 400);
    }

    const conversation = await WhatsAppConversation.findById(id);
    if (!conversation) {
      return errorResponse('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
    }

    const customer = await WhatsAppCustomer.findById(conversation.customer);
    if (!customer) {
      return errorResponse('WhatsApp customer not found', 'CUSTOMER_NOT_FOUND', 404);
    }

    // Send actual WhatsApp message via Graph API
    // Note: Meta allows sending messages to customers in a 24-hour window from their last message.
    const result = await sendTextMessage(customer.phone, text);

    if (!result.success) {
      return errorResponse(result.error || 'Failed to send WhatsApp message', 'META_API_ERROR', 500);
    }

    // Auto-switch conversation to HUMAN mode since an agent is replying
    conversation.mode = 'HUMAN';
    conversation.assignedAgent = rbac.adminProfile.userId; // Assign to current agent
    conversation.lastMessageAt = new Date();
    await conversation.save();

    customer.humanHandoff = true;
    await customer.save();

    // Save Outgoing Message
    const agentMsg = await WhatsAppMessage.create({
      conversation: conversation._id,
      customer: customer._id,
      phone: customer.phone,
      whatsappMessageId: result.messageId,
      direction: 'OUTGOING',
      messageType: 'text',
      text: text,
      metadata: { sentByAgent: rbac.adminProfile.userId }
    });

    return successResponse({ message: agentMsg });
  } catch (error) {
    logger.error('Error sending agent WhatsApp reply', error, { conversationId: params.id });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

/**
 * PATCH Conversation Properties (Assign, Release, Close)
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
    const { status, mode, assignedAgent } = body;

    const conversation = await WhatsAppConversation.findById(id);
    if (!conversation) {
      return errorResponse('Conversation not found', 'CONVERSATION_NOT_FOUND', 404);
    }

    if (status !== undefined) conversation.status = status;
    if (mode !== undefined) conversation.mode = mode;
    if (assignedAgent !== undefined) conversation.assignedAgent = assignedAgent;

    // If closing conversation or resetting to BOT mode, release human handoff
    if (status === 'CLOSED' || mode === 'BOT') {
      const customer = await WhatsAppCustomer.findById(conversation.customer);
      if (customer) {
        customer.humanHandoff = false;
        await customer.save();
      }
      conversation.assignedAgent = undefined;
      conversation.currentState = 'MAIN_MENU';
    }

    await conversation.save();

    return successResponse({ conversation });
  } catch (error) {
    logger.error('Error updating admin conversation status', error, { conversationId: params.id });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
