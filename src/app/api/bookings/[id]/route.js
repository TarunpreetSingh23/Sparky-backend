import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import Booking from '@/models/Booking';
import Customer from '@/models/Customer';
import Professional from '@/models/Professional';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ _id: id }, { bookingNumber: id }] }
      : { bookingNumber: id };
      
    const booking = await Booking.findOne(query)
      .populate('customerId', 'name phone')
      .populate('professionalId', 'name rating profilePhoto phone currentLocation')
      .populate('serviceId', 'name imageUrl requiredSkills description')
      .populate('packageId', 'name description');
      
    if (!booking) {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    // Access permission check
    let hasAccess = false;
    let isOwnerCustomer = false;
    let isOwnerProfessional = false;
    
    if (user.role === 'admin') {
      hasAccess = true;
    } else if (user.role === 'customer') {
      const customer = await Customer.findOne({ userId: user.userId });
      if (customer && booking.customerId._id.toString() === customer._id.toString()) {
        hasAccess = true;
        isOwnerCustomer = true;
      }
    } else if (user.role === 'professional') {
      const professional = await Professional.findOne({ userId: user.userId });
      if (professional && booking.professionalId && booking.professionalId._id.toString() === professional._id.toString()) {
        hasAccess = true;
        isOwnerProfessional = true;
      }
      // Also allow professionals to see details of searching jobs if they are active/dispatched (stub check)
      if (professional && booking.status === 'SEARCHING_PROFESSIONAL') {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return errorResponse('Access denied. You do not have permissions to view this booking.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const responseData = booking.toObject();
    
    // Apply Address Masking for professionals during search phase
    if (user.role === 'professional' && !isOwnerProfessional) {
      const showFullAddress = ['PROFESSIONAL_ACCEPTED', 'PROFESSIONAL_ON_THE_WAY', 'PROFESSIONAL_ARRIVED', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'CUSTOMER_CONFIRMED', 'COMPLETED'].includes(booking.status);
      if (!showFullAddress && responseData.serviceAddressSnapshot) {
        responseData.serviceAddressSnapshot.addressLine1 = '[MASKED]';
        responseData.serviceAddressSnapshot.coordinates = undefined;
        // Mask customer phone
        if (responseData.customerId) {
          responseData.customerId.phone = '[MASKED]';
        }
      }
    }
    
    return successResponse({ booking: responseData });
    
  } catch (error) {
    logger.error('Error fetching booking details', error, { endpoint: `/api/bookings/${params.id}` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
