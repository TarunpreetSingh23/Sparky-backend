import Booking from '@/models/Booking';
import { logger } from './logger';

export const BookingStates = {
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  SEARCHING_PROFESSIONAL: 'SEARCHING_PROFESSIONAL',
  PROFESSIONAL_NOTIFIED: 'PROFESSIONAL_NOTIFIED',
  PROFESSIONAL_ACCEPTED: 'PROFESSIONAL_ACCEPTED',
  PROFESSIONAL_ON_THE_WAY: 'PROFESSIONAL_ON_THE_WAY',
  PROFESSIONAL_ARRIVED: 'PROFESSIONAL_ARRIVED',
  SERVICE_STARTED: 'SERVICE_STARTED',
  SERVICE_COMPLETED: 'SERVICE_COMPLETED',
  CUSTOMER_CONFIRMED: 'CUSTOMER_CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED_BY_CUSTOMER: 'CANCELLED_BY_CUSTOMER',
  CANCELLED_BY_PROFESSIONAL: 'CANCELLED_BY_PROFESSIONAL',
  CANCELLED_BY_ADMIN: 'CANCELLED_BY_ADMIN',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  NO_PROFESSIONAL_AVAILABLE: 'NO_PROFESSIONAL_AVAILABLE',
  REFUND_PENDING: 'REFUND_PENDING',
  REFUNDED: 'REFUNDED',
  DISPUTED: 'DISPUTED'
};

const StateTransitions = {
  [BookingStates.PAYMENT_PENDING]: [
    BookingStates.PAYMENT_CONFIRMED,
    BookingStates.PAYMENT_FAILED,
    BookingStates.CANCELLED_BY_CUSTOMER,
    BookingStates.CANCELLED_BY_ADMIN
  ],
  [BookingStates.PAYMENT_CONFIRMED]: [
    BookingStates.SEARCHING_PROFESSIONAL,
    BookingStates.CANCELLED_BY_CUSTOMER,
    BookingStates.CANCELLED_BY_ADMIN
  ],
  [BookingStates.SEARCHING_PROFESSIONAL]: [
    BookingStates.PROFESSIONAL_NOTIFIED,
    BookingStates.NO_PROFESSIONAL_AVAILABLE,
    BookingStates.CANCELLED_BY_CUSTOMER,
    BookingStates.CANCELLED_BY_ADMIN
  ],
  [BookingStates.PROFESSIONAL_NOTIFIED]: [
    BookingStates.PROFESSIONAL_ACCEPTED,
    BookingStates.SEARCHING_PROFESSIONAL, // declined/timeout -> re-dispatch
    BookingStates.CANCELLED_BY_CUSTOMER,
    BookingStates.CANCELLED_BY_ADMIN
  ],
  [BookingStates.PROFESSIONAL_ACCEPTED]: [
    BookingStates.PROFESSIONAL_ON_THE_WAY,
    BookingStates.CANCELLED_BY_CUSTOMER,
    BookingStates.CANCELLED_BY_PROFESSIONAL,
    BookingStates.CANCELLED_BY_ADMIN
  ],
  [BookingStates.PROFESSIONAL_ON_THE_WAY]: [
    BookingStates.PROFESSIONAL_ARRIVED,
    BookingStates.CANCELLED_BY_CUSTOMER,
    BookingStates.CANCELLED_BY_PROFESSIONAL,
    BookingStates.CANCELLED_BY_ADMIN
  ],
  [BookingStates.PROFESSIONAL_ARRIVED]: [
    BookingStates.SERVICE_STARTED,
    BookingStates.CANCELLED_BY_CUSTOMER,
    BookingStates.CANCELLED_BY_ADMIN
  ],
  [BookingStates.SERVICE_STARTED]: [
    BookingStates.SERVICE_COMPLETED,
    BookingStates.CANCELLED_BY_ADMIN,
    BookingStates.DISPUTED
  ],
  [BookingStates.SERVICE_COMPLETED]: [
    BookingStates.CUSTOMER_CONFIRMED,
    BookingStates.DISPUTED,
    BookingStates.COMPLETED
  ],
  [BookingStates.CUSTOMER_CONFIRMED]: [
    BookingStates.COMPLETED,
    BookingStates.DISPUTED
  ],
  [BookingStates.COMPLETED]: [],
  [BookingStates.CANCELLED_BY_CUSTOMER]: [BookingStates.REFUND_PENDING, BookingStates.REFUNDED],
  [BookingStates.CANCELLED_BY_PROFESSIONAL]: [BookingStates.SEARCHING_PROFESSIONAL, BookingStates.REFUND_PENDING, BookingStates.REFUNDED],
  [BookingStates.CANCELLED_BY_ADMIN]: [BookingStates.REFUND_PENDING, BookingStates.REFUNDED],
  [BookingStates.REFUND_PENDING]: [BookingStates.REFUNDED],
  [BookingStates.REFUNDED]: [],
  [BookingStates.DISPUTED]: [BookingStates.COMPLETED, BookingStates.REFUNDED, BookingStates.CANCELLED_BY_ADMIN]
};

/**
 * Transitions booking status while appending to history and firing hooks.
 */
export async function transitionBookingStatus(booking, newStatus, triggeredBy, reason = '', metadata = {}) {
  const currentStatus = booking.status;
  
  if (currentStatus === newStatus) {
    return booking; // no-op
  }
  
  const allowed = StateTransitions[currentStatus]?.includes(newStatus);
  if (!allowed) {
    throw new Error(`INVALID_TRANSITION: Cannot transition booking from ${currentStatus} to ${newStatus}`);
  }
  
  booking.status = newStatus;
  booking.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: triggeredBy,
    reason,
    metadata
  });
  
  // Set date properties
  if (newStatus === BookingStates.SERVICE_COMPLETED) {
    booking.serviceCompletedAt = new Date();
  } else if (newStatus === BookingStates.SERVICE_STARTED) {
    booking.serviceStartedAt = new Date();
  } else if (newStatus === BookingStates.PROFESSIONAL_ARRIVED) {
    booking.professionalArrivedAt = new Date();
  } else if (newStatus === BookingStates.PROFESSIONAL_ON_THE_WAY) {
    booking.professionalDepartedAt = new Date();
  } else if (newStatus === BookingStates.PROFESSIONAL_ACCEPTED) {
    booking.assignedAt = new Date();
  }
  
  await booking.save();
  
  logger.info(`Booking ${booking.bookingNumber} transitioned to ${newStatus} by ${triggeredBy}. Reason: ${reason}`);
  
  // Auto-transition hook: CUSTOMER_CONFIRMED -> COMPLETED immediately
  if (newStatus === BookingStates.CUSTOMER_CONFIRMED) {
    await transitionBookingStatus(booking, BookingStates.COMPLETED, triggeredBy, 'Auto-confirm completed.');
  }
  
  return booking;
}
