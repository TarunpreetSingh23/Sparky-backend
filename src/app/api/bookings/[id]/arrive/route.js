import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { transitionBookingStatus } from '@/lib/bookingStateMachine';
import Booking from '@/models/Booking';
import Professional from '@/models/Professional';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    if (user.role !== 'professional') {
      return errorResponse('Only professionals can trigger arrival.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const professional = await Professional.findOne({ userId: user.userId });
    if (!professional) {
      return errorResponse('Professional profile not found.', ERROR_CODES.NOT_FOUND, 404);
    }
    
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { bookingNumber: id }] }
      : { bookingNumber: id };
      
    const booking = await Booking.findOne(query);
    if (!booking) {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    // Ownership check
    if (booking.professionalId?.toString() !== professional._id.toString()) {
      return errorResponse('Access denied. This booking is not assigned to you.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    // Transition status to PROFESSIONAL_ARRIVED
    await transitionBookingStatus(
      booking,
      'PROFESSIONAL_ARRIVED',
      user.userId,
      'Professional arrived at customer location.'
    );
    
    return successResponse({ status: booking.status });
    
  } catch (error) {
    logger.error('Error in professional arrive handler', error, { endpoint: `/api/bookings/${params.id}/arrive` });
    return errorResponse(error.message || 'Internal server error', 'INVALID_TRANSITION', 400);
  }
}
