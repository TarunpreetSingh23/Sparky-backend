import Booking from '@/models/Booking';
import Professional from '@/models/Professional';
import { logger } from '@/lib/logger';
import { transitionBookingStatus } from '@/lib/bookingStateMachine';
import { processRefund } from './refundService';

/**
 * Calculates cancellation fee based on timing and progress
 */
export function calculateCancellationFee(booking, cancelledByRole) {
  // Only customers are charged cancellation fees
  if (cancelledByRole !== 'customer') {
    return 0;
  }
  
  if (booking.status === 'PAYMENT_PENDING' || booking.paymentStatus === 'PENDING') {
    return 0;
  }
  
  if (booking.status === 'PROFESSIONAL_ARRIVED') {
    return 15000; // ₹150 late fee if pro has arrived
  }
  
  // Calculate hours before start
  const [hours, minutes] = booking.scheduledTimeSlot.split(':').map(Number);
  const scheduledTime = new Date(booking.scheduledDate);
  scheduledTime.setHours(hours, minutes, 0, 0);
  
  const diffHours = (scheduledTime.getTime() - Date.now()) / (1000 * 60 * 60);
  
  // If cancelled within 4 hours of appointment
  if (diffHours <= 4 || booking.status === 'PROFESSIONAL_ON_THE_WAY') {
    return 10000; // ₹100 fee
  }
  
  return 0; // Free cancellation
}

/**
 * Processes booking cancellation, fees, refunds, and state transitions
 */
export async function cancelBooking(bookingId, cancelledByRole, reason = '', requestWalletRefund = false, triggeredByUserId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('BOOKING_NOT_FOUND');
  }
  
  const terminalStates = ['COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROFESSIONAL', 'CANCELLED_BY_ADMIN', 'NO_PROFESSIONAL_AVAILABLE'];
  if (terminalStates.includes(booking.status)) {
    throw new Error('ALREADY_TERMINATED');
  }
  
  if (booking.status === 'SERVICE_STARTED' && cancelledByRole !== 'admin') {
    throw new Error('SERVICE_ALREADY_STARTED');
  }
  
  const cancellationFee = calculateCancellationFee(booking, cancelledByRole);
  const paidAmount = booking.paymentStatus === 'PAID' ? booking.pricing.total : 0;
  const refundAmount = Math.max(0, paidAmount - cancellationFee);
  
  // Process refund if paid
  let refundDetails = null;
  if (refundAmount > 0) {
    refundDetails = await processRefund(booking, refundAmount, reason, requestWalletRefund);
  }
  
  // Handle professional release and compensation if pro cancels
  if (cancelledByRole === 'professional' && booking.professionalId) {
    const professional = await Professional.findById(booking.professionalId);
    if (professional) {
      // Stub: Penalize pro completion/acceptance rate
      professional.cancellationRate = (professional.cancellationRate || 0) + 1;
      await professional.save();
    }
  }
  
  // Determine target state
  let targetState = 'CANCELLED_BY_CUSTOMER';
  if (cancelledByRole === 'admin') {
    targetState = 'CANCELLED_BY_ADMIN';
  } else if (cancelledByRole === 'professional') {
    targetState = 'CANCELLED_BY_PROFESSIONAL';
  }
  
  booking.cancelledBy = cancelledByRole;
  booking.cancellationFee = cancellationFee;
  
  // Execute state machine transition
  await transitionBookingStatus(
    booking,
    targetState,
    triggeredByUserId,
    reason || `Cancelled by ${cancelledByRole}.`
  );
  
  // If professional cancelled, we also clear assignments
  if (cancelledByRole === 'professional') {
    booking.professionalId = null;
    await booking.save();
  }
  
  return {
    booking,
    cancellationFee,
    refundAmount,
    refundDetails
  };
}
