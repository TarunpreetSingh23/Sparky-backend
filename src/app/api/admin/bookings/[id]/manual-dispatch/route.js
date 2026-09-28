import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { transitionBookingStatus } from '@/lib/bookingStateMachine';
import Professional from '@/models/Professional';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = params; // booking ID or bookingNumber
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation: OPERATIONS_ADMIN, DISPATCH_MANAGER, or SUPER_ADMIN
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'DISPATCH_MANAGER');
    if (!rbac.allowed) return rbac.error;
    
    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { bookingNumber: id };
      
    const booking = await Booking.findOne(query);
    if (!booking) {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    // Validate booking status is currently search phase
    const dispatchable = ['PAYMENT_CONFIRMED', 'SEARCHING_PROFESSIONAL', 'PROFESSIONAL_NOTIFIED'].includes(booking.status);
    if (!dispatchable) {
      return errorResponse('Booking cannot be dispatched at its current status.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const body = await req.json().catch(() => ({}));
    const { professionalId } = body;
    
    if (!professionalId) {
      return errorResponse('Missing professionalId parameter', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const professional = await Professional.findById(professionalId);
    if (!professional) {
      return errorResponse('Professional not found', 'PRO_NOT_FOUND', 404);
    }
    
    if (professional.verificationStatus !== 'ACTIVE') {
      return errorResponse('Professional is not active or verified.', 'PRO_NOT_FOUND', 400);
    }
    
    // Reset deadline
    booking.professionalId = professional._id;
    booking.responseDeadline = null;
    
    // Transition status to PROFESSIONAL_ACCEPTED (bypass notifications timeout)
    await transitionBookingStatus(
      booking,
      'PROFESSIONAL_ACCEPTED',
      user.userId,
      `Manually assigned professional ${professional.name} by admin.`
    );
    
    return successResponse({
      dispatched: true,
      booking
    });
    
  } catch (error) {
    logger.error('Error in manual dispatch handler', error, { endpoint: `/api/admin/bookings/${params.id}/manual-dispatch` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
