import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { cancelBooking } from '@/services/cancellationService';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = params; // booking ID or bookingNumber
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'OPERATIONS_ADMIN');
    if (!rbac.allowed) return rbac.error;
    
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { bookingNumber: id }] }
      : { bookingNumber: id };
      
    const booking = await Booking.findOne(query);
    if (!booking) {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    const body = await req.json().catch(() => ({}));
    const { reason, forceRefund } = body;
    
    // Admin cancels can trigger 100% refund, bypass cancellation fee checks by declaring cancelledByRole as 'admin'
    const result = await cancelBooking(
      booking._id,
      'admin',
      reason || 'Cancelled by admin operations.',
      false, // original source refund
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
    logger.error('Error in admin cancellation handler', error, { bookingId: params.id });
    if (error.message === 'BOOKING_NOT_FOUND') {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    if (error.message === 'ALREADY_TERMINATED') {
      return errorResponse('Booking is already completed or cancelled.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    return errorResponse(error.message || 'Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
