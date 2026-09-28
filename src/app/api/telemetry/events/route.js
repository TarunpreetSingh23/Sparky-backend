import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    // Auth validation is optional for telemetry
    let userId = null;
    try {
      const auth = await requireAuth(req);
      if (auth.user) userId = auth.user.userId;
    } catch (e) {
      // Ignore auth failure
    }
    
    const body = await req.json().catch(() => ({}));
    const eventName = body.eventName || body.event;
    const category = body.category || 'general';
    const metadata = body.metadata || body.properties || {};
    
    if (!eventName) {
      return errorResponse('Missing eventName or event parameter', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const validEvents = [
      'page_view', 'service_view', 'booking_started', 'booking_completed', 
      'payment_initiated', 'payment_completed', 'coupon_applied', 
      'review_submitted', 'professional_online', 'search_performed'
    ];
    const eventEnum = validEvents.includes(eventName) ? eventName : 'page_view';
    
    const event = await AnalyticsEvent.create({
      userId: userId || undefined,
      sessionId: body.sessionId || `sess_${Math.random().toString(36).substring(2)}`,
      event: eventEnum,
      eventName,
      category,
      properties: metadata,
      metadata,
      city: body.city,
      platform: body.platform || 'web',
      timestamp: new Date()
    });
    
    return successResponse({ ingested: true, id: event._id }, 201);
    
  } catch (error) {
    logger.error('Error ingesting telemetry event', error, { endpoint: '/api/telemetry/events' });
    return errorResponse(error.message || 'Internal server error', ERROR_CODES.INTERNAL_ERROR, 500, { stack: error.stack });
  }
}
