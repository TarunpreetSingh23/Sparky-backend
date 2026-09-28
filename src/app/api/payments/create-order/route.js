import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createPaymentOrder } from '@/services/paymentService';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const body = await req.json().catch(() => ({}));
    const { bookingId } = body;
    
    if (!bookingId) {
      return errorResponse('Missing bookingId parameter', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const orderDetails = await createPaymentOrder(bookingId);
    return successResponse(orderDetails);
    
  } catch (error) {
    logger.error('Error creating payment order', error, { endpoint: '/api/payments/create-order' });
    if (error.message === 'BOOKING_NOT_FOUND') {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    if (error.message === 'INVALID_BOOKING_STATUS') {
      return errorResponse('Booking is already paid or cancelled.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
