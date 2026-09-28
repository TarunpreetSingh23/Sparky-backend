import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { isRazorpayDummy, razorpay } from '@/lib/razorpay';
import { handlePaymentSuccess } from '@/services/paymentService';
import Booking from '@/models/Booking';
import { transitionBookingStatus } from '@/lib/bookingStateMachine';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    
    // Signature verification (unless in mock payment mode)
    if (!isRazorpayDummy) {
      if (!signature) {
        return errorResponse('Missing webhook signature header', ERROR_CODES.FORBIDDEN, 400);
      }
      
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.webhookSecret)
        .update(rawBody)
        .digest('hex');
        
      if (expectedSignature !== signature) {
        logger.error('Webhook signature mismatch', { expected: expectedSignature, received: signature });
        return errorResponse('Invalid webhook signature', 'SIGNATURE_VERIFICATION_FAILED', 400);
      }
    }
    
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    
    logger.info(`Received Razorpay webhook event: ${event}`);
    
    if (event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const method = paymentEntity?.method || 'card';
      
      if (orderId && paymentId) {
        // Handle success verification idempotently
        await handlePaymentSuccess(orderId, paymentId, signature || 'sig_mock_webhook', method);
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      
      if (orderId) {
        const booking = await Booking.findOne({ paymentOrderId: orderId });
        if (booking && booking.paymentStatus === 'PENDING') {
          booking.paymentStatus = 'FAILED';
          await transitionBookingStatus(
            booking,
            'PAYMENT_FAILED',
            'system',
            'Payment failed according to gateway event.'
          );
        }
      }
    }
    
    return successResponse({ received: true });
    
  } catch (error) {
    logger.error('Error handling webhook event', error, { endpoint: '/api/payments/webhook' });
    // Always return a 200/202 to Razorpay to prevent retry flooding, unless it's a validation crash
    return successResponse({ received: true, error: error.message });
  }
}
