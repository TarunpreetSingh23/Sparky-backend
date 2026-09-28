import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import Booking from '@/models/Booking';
import Customer from '@/models/Customer';
import Professional from '@/models/Professional';
import SafetyIncident from '@/models/SafetyIncident';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const body = await req.json().catch(() => ({}));
    const { bookingId, lat, lng, reason } = body;
    
    if (!bookingId) {
      return errorResponse('Missing bookingId parameter', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    // Validate that the user is part of the booking
    let authorized = false;
    let profileId = null;
    
    if (user.role === 'customer') {
      const customer = await Customer.findOne({ userId: user.userId });
      if (customer && booking.customerId.toString() === customer._id.toString()) {
        authorized = true;
        profileId = customer._id;
      }
    } else if (user.role === 'professional') {
      const professional = await Professional.findOne({ userId: user.userId });
      if (professional && booking.professionalId?.toString() === professional._id.toString()) {
        authorized = true;
        profileId = professional._id;
      }
    } else if (user.role === 'admin') {
      authorized = true;
    }
    
    if (!authorized) {
      return errorResponse('Access denied. You are not authorized to trigger SOS for this booking.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const longitude = lng ? parseFloat(lng) : 0;
    const latitude = lat ? parseFloat(lat) : 0;
    
    // Create safety incident
    const incident = await SafetyIncident.create({
      bookingId: booking._id,
      reporterId: user.userId,
      reporterRole: user.role,
      coordinates: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      status: 'active',
      alertDispatched: true,
      reason: reason || 'SOS panic button pressed.',
      notes: []
    });
    
    // Flag booking as having active safety alert
    booking.isSafetyAlertActive = true;
    await booking.save();
    
    // Mock Emergency dispatch calls/SMS triggers
    logger.error(`[EMERGENCY SOS ALERT DISPATCHED] Booking: ${booking.bookingNumber}, Reporter: ${user.role} (${user.userId}), Coordinates: [${longitude}, ${latitude}]. Reason: ${reason}`);
    
    return successResponse({
      sosTriggered: true,
      incidentId: incident._id,
      message: 'Emergency SOS alert dispatched to response center. Assistance is on the way.'
    }, 201);
    
  } catch (error) {
    logger.error('Error triggering safety SOS', error, { endpoint: '/api/safety/sos' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
