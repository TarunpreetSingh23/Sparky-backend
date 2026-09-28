import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import SupportTicket from '@/models/SupportTicket';
import Customer from '@/models/Customer';
import Professional from '@/models/Professional';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    let profileId = null;
    let userType = 'customer';
    
    if (user.role === 'customer') {
      const customer = await Customer.findOne({ userId: user.userId });
      if (!customer) return errorResponse('Customer profile not found.', ERROR_CODES.NOT_FOUND, 404);
      profileId = customer._id;
      userType = 'customer';
    } else if (user.role === 'professional') {
      const professional = await Professional.findOne({ userId: user.userId });
      if (!professional) return errorResponse('Professional profile not found.', ERROR_CODES.NOT_FOUND, 404);
      profileId = professional._id;
      userType = 'professional';
    } else {
      return errorResponse('Admins cannot open customer support tickets.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const body = await req.json().catch(() => ({}));
    const { bookingId, category, subject, description } = body;
    
    if (!category || !subject || !description) {
      return errorResponse('Missing required fields: category, subject, description', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const validCategories = ['payment_issue', 'professional_issue', 'quality', 'refund', 'safety', 'quality_complaint', 'professional_behaviour', 'app_issue', 'refund_request', 'other'];
    const catLower = (category || 'other').toLowerCase();
    let normalizedCategory = validCategories.find(c => c === catLower || c.startsWith(catLower) || catLower.startsWith(c)) || 'other';

    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const count = await SupportTicket.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });
    const ticketNumber = `TKT${dateStr}${String(count + 1).padStart(4, '0')}`;
    const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const ticket = await SupportTicket.create({
      ticketNumber,
      slaDeadline,
      bookingId: bookingId || undefined,
      customerId: userType === 'customer' ? profileId : undefined,
      professionalId: userType === 'professional' ? profileId : undefined,
      category: normalizedCategory,
      subject,
      description,
      status: 'open',
      priority: 'medium',
      messages: [{
        senderId: user.userId,
        senderType: user.role === 'customer' ? 'Customer' : 'Professional',
        senderRole: user.role,
        message: description,
        sentAt: new Date(),
        timestamp: new Date()
      }]
    });
    
    return successResponse({ ticket }, 201);
    
  } catch (error) {
    logger.error('Error creating support ticket', error, { endpoint: '/api/support/tickets' });
    return errorResponse(error.message || 'Internal server error', ERROR_CODES.INTERNAL_ERROR, 500, { stack: error.stack });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const filter = {};
    
    if (user.role === 'customer') {
      const customer = await Customer.findOne({ userId: user.userId });
      if (!customer) return successResponse({ tickets: [] });
      filter.customerId = customer._id;
    } else if (user.role === 'professional') {
      const professional = await Professional.findOne({ userId: user.userId });
      if (!professional) return successResponse({ tickets: [] });
      filter.professionalId = professional._id;
    }
    
    const tickets = await SupportTicket.find(filter).sort({ createdAt: -1 });
    return successResponse({ tickets });
    
  } catch (error) {
    logger.error('Error fetching support tickets', error, { endpoint: '/api/support/tickets' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
