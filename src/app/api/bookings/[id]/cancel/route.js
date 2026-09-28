import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { cancelBooking } from '@/services/cancellationService';
import Booking from '@/models/Booking';
import Customer from '@/models/Customer';
import Professional from '@/models/Professional';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = params; // booking ID or bookingNumber
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { bookingNumber: id }] }
      : { bookingNumber: id };
      
    const booking = await Booking.findOne(query);
    if (!booking) {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    // Access and ownership check
    let hasPermission = false;
    let role = user.role; // customer or professional
    
    if (user.role === 'customer') {
      const customer = await Customer.findOne({ userId: user.userId });
      if (customer && booking.customerId.toString() === customer._id.toString()) {
        hasPermission = true;
      }
    } else if (user.role === 'professional') {
      const professional = await Professional.findOne({ userId: user.userId });
      if (professional && booking.professionalId?.toString() === professional._id.toString()) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission && user.role !== 'admin') {
      return errorResponse('Access denied. You do not have permission to cancel this booking.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const body = await req.json().catch(() => ({}));
    const { reason, toWallet } = body;
    
    const result = await cancelBooking(
      booking._id,
      role,
      reason || 'User cancelled booking request',
      !!toWallet,
      user.userId
    );
    
    return successResponse({
      cancelled: true,
      bookingNumber: result.booking.bookingNumber,
      cancellationFee: result.cancellationFee,
      refundAmount: result.refundAmount,
      refundDetails: result.refundDetails,
      status: result.booking.status
    });
    
  } catch (error) {
    logger.error('Error cancelling booking', error, { bookingId: params.id });
    if (error.message === 'BOOKING_NOT_FOUND') {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    if (error.message === 'ALREADY_TERMINATED') {
      return errorResponse('Booking is already completed or cancelled.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    if (error.message === 'SERVICE_ALREADY_STARTED') {
      return errorResponse('Active services that have already started cannot be cancelled.', 'CANCELLATION_NOT_ALLOWED', 400);
    }
    return errorResponse(error.message || 'Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
