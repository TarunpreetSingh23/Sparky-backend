import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { transitionBookingStatus } from '@/lib/bookingStateMachine';
import Professional from '@/models/Professional';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id, jid } = params; // id = professional ID, jid = booking ID or bookingNumber
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    if (user.role !== 'professional') {
      return errorResponse('Only professionals can accept jobs.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const professional = await Professional.findOne({ userId: user.userId });
    if (!professional) {
      return errorResponse('Professional profile not found.', ERROR_CODES.NOT_FOUND, 404);
    }
    
    // Validate professional matches url
    if (professional._id.toString() !== id && professional.userId.toString() !== id) {
      return errorResponse('Access denied. Professional profile mismatch.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const query = mongoose.isValidObjectId(jid)
      ? { _id: jid }
      : { bookingNumber: jid };
      
    const booking = await Booking.findOne(query);
    if (!booking) {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    // Validate assigned professional
    if (booking.professionalId?.toString() !== professional._id.toString()) {
      return errorResponse('This job is no longer assigned to you.', 'JOB_UNAVAILABLE', 400);
    }
    
    // Validate status is notified
    if (booking.status !== 'PROFESSIONAL_NOTIFIED') {
      return errorResponse('This job is no longer available to accept.', 'JOB_UNAVAILABLE', 400);
    }
    
    // Check deadline
    if (booking.responseDeadline && booking.responseDeadline < new Date()) {
      return errorResponse('Job offer has expired.', 'JOB_UNAVAILABLE', 400);
    }
    
    // Accept booking
    await transitionBookingStatus(
      booking,
      'PROFESSIONAL_ACCEPTED',
      user.userId,
      `Job accepted by professional ${professional.name}.`
    );
    
    return successResponse({
      accepted: true,
      status: booking.status
    });
    
  } catch (error) {
    logger.error('Error in professional job accept handler', error, { endpoint: `/api/professionals/${params.id}/jobs/${params.jid}/accept` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
