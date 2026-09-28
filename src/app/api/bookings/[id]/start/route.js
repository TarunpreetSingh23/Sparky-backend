import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
      return errorResponse('Only professionals can start the service.', ERROR_CODES.FORBIDDEN, 403);
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
    
    // Check lock
    if (booking.otpAttempts >= 3) {
      return errorResponse('Maximum OTP verification attempts exceeded. Please contact admin support.', 'MAX_OTP_ATTEMPTS_EXCEEDED', 403);
    }
    
    const body = await req.json().catch(() => ({}));
    const { otp } = body;
    
    if (!otp) {
      return errorResponse('OTP is required to start the service.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Compare OTP
    const isOtpValid = await bcrypt.compare(otp, booking.startOtpHash);
    if (!isOtpValid) {
      booking.otpAttempts += 1;
      await booking.save();
      
      const attemptsLeft = 3 - booking.otpAttempts;
      if (booking.otpAttempts >= 3) {
        logger.warn(`Admin Alert: Booking ${booking.bookingNumber} blocked due to 3 failed start OTP attempts.`);
        return errorResponse('OTP attempts limit exceeded. Support alert generated.', 'MAX_OTP_ATTEMPTS_EXCEEDED', 403);
      }
      
      return errorResponse('Invalid start OTP.', ERROR_CODES.INVALID_OTP, 400, { attemptsLeft });
    }
    
    // Reset OTP attempts and transition
    booking.otpAttempts = 0;
    await transitionBookingStatus(
      booking,
      'SERVICE_STARTED',
      user.userId,
      'Service started successfully using customer OTP verification.'
    );
    
    return successResponse({ status: booking.status });
    
  } catch (error) {
    logger.error('Error in professional start service handler', error, { endpoint: `/api/bookings/${params.id}/start` });
    return errorResponse(error.message || 'Internal server error', 'INVALID_TRANSITION', 400);
  }
}
