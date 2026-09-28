import crypto from 'crypto';
import { razorpay, isRazorpayDummy } from '@/lib/razorpay';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import { transitionBookingStatus } from '@/lib/bookingStateMachine';
import { dispatchBooking } from './dispatchService';

/**
 * Creates a payment order on Razorpay gateway
 */
export async function createPaymentOrder(bookingId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('BOOKING_NOT_FOUND');
  }
  
  if (booking.status !== 'PAYMENT_PENDING') {
    throw new Error('INVALID_BOOKING_STATUS');
  }
  
  const amountInPaise = booking.pricing.total;
  
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: booking.bookingNumber,
    notes: {
      bookingId: booking._id.toString(),
      customerPhone: booking.serviceAddressSnapshot?.phone || ''
    }
  });
  
  // Save order ID to booking
  booking.paymentOrderId = order.id;
  await booking.save();
  
  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency
  };
}

/**
 * Verifies Razorpay HMAC signature
 */
export function verifySignature(paymentId, orderId, signature) {
  if (isRazorpayDummy) {
    // In dummy mode, accept mock payments
    return paymentId.startsWith('pay_') && orderId.startsWith('order_');
  }
  
  const text = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(text)
    .digest('hex');
    
  return generatedSignature === signature;
}

/**
 * Handles payment verification and initiates dispatch workflow
 */
export async function handlePaymentSuccess(orderId, paymentId, signature, paymentMethod = 'card') {
  const isSignatureValid = verifySignature(paymentId, orderId, signature);
  if (!isSignatureValid) {
    throw new Error('SIGNATURE_VERIFICATION_FAILED');
  }
  
  const booking = await Booking.findOne({ paymentOrderId: orderId });
  if (!booking) {
    throw new Error('BOOKING_NOT_FOUND');
  }
  
  // Prevent double processing (idempotency check)
  if (booking.paymentStatus === 'PAID') {
    logger.info(`Payment already processed for order: ${orderId}. Skipping.`);
    return booking;
  }
  
  // Update payment fields
  booking.paymentStatus = 'PAID';
  booking.paymentDetails = {
    paymentId,
    signature,
    paidAt: new Date(),
    method: paymentMethod
  };
  
  // Transition booking status to PAYMENT_CONFIRMED
  await transitionBookingStatus(
    booking,
    'PAYMENT_CONFIRMED',
    'system',
    'Payment verified successfully.'
  );
  
  // Log payment ledger entry
  await Payment.create({
    bookingId: booking._id,
    paymentOrderId: orderId,
    gatewayTransactionId: paymentId,
    amount: booking.pricing.total,
    currency: 'INR',
    status: 'captured',
    paymentMethod,
    paidAt: new Date(),
    refundStatus: 'no_refund',
    refundAmount: 0
  });
  
  logger.info(`Payment capturing done for Booking ${booking.bookingNumber}. Triggering dispatch.`);
  
  // Trigger background dispatch asynchronously
  dispatchBooking(booking._id).catch(err => {
    logger.error(`Failed to trigger dispatch for Booking ${booking.bookingNumber}`, err);
  });
  
  return booking;
}
