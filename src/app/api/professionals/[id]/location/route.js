import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rateLimit';
import Professional from '@/models/Professional';
import Booking from '@/models/Booking';
import LocationHistory from '@/models/LocationHistory';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // Find professional by userId or profileId
    const query = mongoose.isValidObjectId(id)
      ? { $or: [{ userId: id }, { _id: id }] }
      : { userId: id };
      
    const professional = await Professional.findOne(query);
    if (!professional) {
      return errorResponse('Professional profile not found', ERROR_CODES.NOT_FOUND, 404);
    }
    
    // Ownership check
    const isOwner = user.userId === professional.userId.toString();
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return errorResponse('Access denied.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    // Rate limit check: 1 per 20 seconds
    const limit = rateLimit(`pro-loc:${professional._id}`, 1, 20 * 1000);
    if (!limit.allowed) {
      return errorResponse('Location updates are rate-limited. Maximum 1 update per 20 seconds.', ERROR_CODES.RATE_LIMITED, 429);
    }
    
    const body = await req.json().catch(() => ({}));
    const { lat, lng } = body;
    
    if (lat === undefined || lng === undefined) {
      return errorResponse('Missing coordinates parameters (lat, lng)', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return errorResponse('Invalid coordinates values', 'INVALID_COORDINATES', 400);
    }
    
    // Check if the professional has an active job in transit/started
    const activeBooking = await Booking.findOne({
      professionalId: professional._id,
      status: {
        $in: [
          'PROFESSIONAL_ACCEPTED', 'PROFESSIONAL_ON_THE_WAY', 
          'PROFESSIONAL_ARRIVED', 'SERVICE_STARTED'
        ]
      }
    });
    
    if (!activeBooking && !isAdmin) {
      return errorResponse('Location updates are only allowed during an active job.', 'NOT_ACTIVE_JOB', 403);
    }
    
    // Update professional current location
    professional.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude],
      updatedAt: new Date()
    };
    await professional.save();
    
    // Log location history
    await LocationHistory.create({
      professionalId: professional._id,
      bookingId: activeBooking ? activeBooking._id : null,
      coordinates: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });
    
    return successResponse({ updated: true });
    
  } catch (error) {
    logger.error('Error updating professional location', error, { endpoint: `/api/professionals/${params.id}/location` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
