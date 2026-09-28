import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handlePaymentSuccess } from '@/services/paymentService';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const body = await req.json().catch(() => ({}));
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentMethod } = body;
    
    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return errorResponse('Missing required signature verification parameters', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const booking = await handlePaymentSuccess(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod || 'card'
    );
    
    return successResponse({
      verified: true,
      bookingNumber: booking.bookingNumber,
      status: booking.status
    });
    
  } catch (error) {
    logger.error('Error verifying payment signature', error, { endpoint: '/api/payments/verify' });
    if (error.message === 'SIGNATURE_VERIFICATION_FAILED') {
      return errorResponse('HMAC signature verification failed. Security alert.', 'SIGNATURE_VERIFICATION_FAILED', 400);
    }
    if (error.message === 'BOOKING_NOT_FOUND') {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
