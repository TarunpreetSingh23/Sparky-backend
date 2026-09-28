import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import Booking from '@/models/Booking';
import Customer from '@/models/Customer';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
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
    
    // Ownership check: customer owner or admin
    let isOwner = false;
    if (user.role === 'customer') {
      const customer = await Customer.findOne({ userId: user.userId });
      if (customer && booking.customerId.toString() === customer._id.toString()) {
        isOwner = true;
      }
    }
    
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return errorResponse('Access denied. You can only reschedule your own bookings.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const body = await req.json().catch(() => ({}));
    const { scheduledDate, timeSlot } = body;
    
    if (!scheduledDate || !timeSlot) {
      return errorResponse('Missing scheduledDate or timeSlot parameters', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Check reschedule count limit
    if (booking.rescheduleCount >= 1 && !isAdmin) {
      return errorResponse('Rescheduling limit exceeded. Maximum 1 reschedule allowed.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Check if current slot is within 4 hours
    const [hours, minutes] = booking.scheduledTimeSlot.split(':').map(Number);
    const currentScheduledTime = new Date(booking.scheduledDate);
    currentScheduledTime.setHours(hours, minutes, 0, 0);
    
    const timeDiffMs = currentScheduledTime.getTime() - Date.now();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
    
    if (timeDiffHours < 4 && !isAdmin) {
      return errorResponse('Cannot reschedule less than 4 hours before the appointment time.', 'CANCELLATION_NOT_ALLOWED', 400);
    }
    
    // Validate new scheduled date is in the future
    const newBookingDate = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newBookingDate < today) {
      return errorResponse('New scheduled date cannot be in the past.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Update booking schedule
    booking.scheduledDate = newBookingDate;
    booking.scheduledTimeSlot = timeSlot;
    booking.rescheduleCount += 1;
    
    // Append to status history
    booking.statusHistory.push({
      status: booking.status,
      timestamp: new Date(),
      updatedBy: user.userId,
      reason: `Rescheduled from ${currentScheduledTime.toLocaleDateString()} ${booking.scheduledTimeSlot} by user.`
    });
    
    await booking.save();
    
    return successResponse({
      rescheduled: true,
      booking
    });
    
  } catch (error) {
    logger.error('Error rescheduling booking', error, { endpoint: `/api/bookings/${params.id}/reschedule` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
