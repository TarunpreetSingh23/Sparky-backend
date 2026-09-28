import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
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
    const { status, reason, notes } = body;
    
    if (status !== undefined) {
      const oldStatus = booking.status;
      booking.status = status;
      booking.statusHistory.push({
        status,
        timestamp: new Date(),
        updatedBy: user.userId,
        reason: reason || `Admin force override from ${oldStatus} to ${status}.`
      });
      
      // Update date helper properties based on target status
      if (status === 'COMPLETED') {
        booking.serviceCompletedAt = new Date();
      } else if (status === 'SERVICE_STARTED') {
        booking.serviceStartedAt = new Date();
      }
    }
    
    if (notes !== undefined) {
      booking.notes = notes;
    }
    
    await booking.save();
    
    logger.info(`Admin override: Booking ${booking.bookingNumber} updated to status ${booking.status} by admin ${user.userId}.`);
    
    return successResponse({
      statusUpdated: true,
      booking
    });
    
  } catch (error) {
    logger.error('Error overriding booking details in admin', error, { endpoint: `/api/admin/bookings/${params.id}` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
