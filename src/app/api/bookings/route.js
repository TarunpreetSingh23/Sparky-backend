import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { calculateBookingPrice } from '@/services/pricingEngine';
import Booking from '@/models/Booking';
import Customer from '@/models/Customer';
import Address from '@/models/Address';
import Service from '@/models/Service';
import ServicePackage from '@/models/ServicePackage';
import Professional from '@/models/Professional';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    if (user.role !== 'customer') {
      return errorResponse('Only customers can create bookings.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    // Fetch customer profile
    const customer = await Customer.findOne({ userId: user.userId });
    if (!customer) {
      return errorResponse('Customer profile not found. Please complete onboarding.', 'PROFILE_NOT_FOUND', 400);
    }
    
    const body = await req.json().catch(() => ({}));
    const { serviceId, packageId, addonIds, scheduledDate, timeSlot, addressId, couponCode, notes } = body;
    
    if (!serviceId || !packageId || !scheduledDate || !timeSlot || !addressId) {
      return errorResponse('Missing required booking parameters', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Validate date is not in the past
    const bookingDate = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return errorResponse('Scheduled date cannot be in the past.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Check address ownership
    const address = await Address.findOne({ _id: addressId, userId: user.userId, isActive: true });
    if (!address) {
      return errorResponse('Address not found or does not belong to this user.', ERROR_CODES.ADDRESS_NOT_FOUND, 400);
    }
    
    // Check service availability
    const service = await Service.findOne({ _id: serviceId, isActive: true });
    if (!service) {
      return errorResponse('Service is not active or unavailable.', ERROR_CODES.SERVICE_UNAVAILABLE, 400);
    }
    
    // Verify city matches
    if (!service.availableCities.map(c => c.toLowerCase()).includes(address.city.toLowerCase())) {
      return errorResponse('This service is not available in your city.', ERROR_CODES.SERVICE_UNAVAILABLE, 400);
    }
    
    // Idempotency: Same customer + service + slot + date within 5 mins returns existing booking
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicate = await Booking.findOne({
      customerId: customer._id,
      serviceId,
      scheduledDate: bookingDate,
      scheduledTimeSlot: timeSlot,
      createdAt: { $gte: fiveMinsAgo },
      status: { $nin: ['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_ADMIN', 'PAYMENT_FAILED'] }
    });
    
    if (duplicate) {
      logger.info(`Idempotency triggered for customer ${customer._id}. Returning duplicate booking.`);
      return successResponse({ booking: duplicate, alreadyExists: true });
    }
    
    // Calculate final price breakdown
    let priceDetails;
    try {
      priceDetails = await calculateBookingPrice(serviceId, packageId, addonIds, couponCode, customer._id, address.zoneId);
    } catch (pricingError) {
      logger.error('Pricing calculation failed', pricingError);
      return errorResponse(pricingError.message || 'Pricing error', 'INVALID_ITEM', 400);
    }
    
    // Generate 4-digit OTPs
    const plainStartOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const plainCompleteOtp = Math.floor(1000 + Math.random() * 9000).toString();
    
    const startOtpHash = await bcrypt.hash(plainStartOtp, 10);
    const completeOtpHash = await bcrypt.hash(plainCompleteOtp, 10);
    
    // Address snapshot
    const serviceAddressSnapshot = {
      addressLine1: address.addressLine1,
      area: address.addressLine2 || '',
      city: address.city,
      pincode: address.pincode,
      coordinates: address.coordinates
    };
    
    // Atomic sequential Booking Number generation with retry loop
    let booking = null;
    let attempts = 0;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dateStr = startOfDay.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    
    while (!booking && attempts < 5) {
      const count = await Booking.countDocuments({ createdAt: { $gte: startOfDay } });
      const sequence = String(count + 1 + attempts).padStart(4, '0');
      const bookingNumber = `SP${dateStr}${sequence}`;
      
      try {
        booking = await Booking.create({
          bookingNumber,
          bookingId: bookingNumber,
          customerId: customer._id,
          serviceId,
          packageId,
          addonIds,
          scheduledDate: bookingDate,
          scheduledTimeSlot: timeSlot,
          scheduledDuration: service.durationMinutes || 30,
          serviceAddressId: addressId,
          serviceAddressSnapshot,
          pricing: priceDetails,
          couponCode: couponCode ? couponCode.toUpperCase() : undefined,
          discountAmount: priceDetails.discount,
          status: 'PAYMENT_PENDING',
          statusHistory: [{
            status: 'PAYMENT_PENDING',
            timestamp: new Date(),
            updatedBy: user.userId,
            reason: 'Booking initiated'
          }],
          startOtpHash,
          completeOtpHash,
          paymentStatus: 'PENDING',
          notes,
          source: body.source || 'web'
        });
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate key error on bookingNumber. Try again.
          attempts++;
        } else {
          throw err;
        }
      }
    }
    
    if (!booking) {
      throw new Error('Failed to generate unique booking number after retries');
    }
    
    // Log plain OTPs in development mode for frontend developer testing
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[DEV MODE] Booking ${booking.bookingNumber} created: Start OTP: ${plainStartOtp}, Complete OTP: ${plainCompleteOtp}`);
    }
    
    const responsePayload = { booking };
    if (process.env.NODE_ENV === 'development') {
      responsePayload.plainStartOtp = plainStartOtp;
      responsePayload.plainCompleteOtp = plainCompleteOtp;
    }
    
    return successResponse(responsePayload, 201);
    
  } catch (error) {
    logger.error('Error creating booking', error, { endpoint: '/api/bookings' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

export async function GET(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const { searchParams } = new URL(req.url);
    const statusQuery = searchParams.get('status');
    const startDateQuery = searchParams.get('startDate');
    const endDateQuery = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const filter = {};
    
    // Role based scoping
    if (user.role === 'customer') {
      const customer = await Customer.findOne({ userId: user.userId });
      if (!customer) return successResponse({ bookings: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      filter.customerId = customer._id;
    } else if (user.role === 'professional') {
      const professional = await Professional.findOne({ userId: user.userId });
      if (!professional) return successResponse({ bookings: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      filter.professionalId = professional._id;
    }
    
    // Status filter
    if (statusQuery) {
      filter.status = statusQuery;
    }
    
    // Date filter
    if (startDateQuery || endDateQuery) {
      filter.scheduledDate = {};
      if (startDateQuery) filter.scheduledDate.$gte = new Date(startDateQuery);
      if (endDateQuery) {
        const end = new Date(endDateQuery);
        if (endDateQuery.length === 10) end.setHours(23, 59, 59, 999);
        filter.scheduledDate.$lte = end;
      }
    }
    
    const skip = (page - 1) * limit;
    const total = await Booking.countDocuments(filter);
    
    const bookings = await Booking.find(filter)
      .populate('customerId', 'name')
      .populate('professionalId', 'name rating profilePhoto')
      .populate('serviceId', 'name imageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    // Apply address masking for professionals during search phase
    if (user.role === 'professional') {
      bookings.forEach(b => {
        const showFullAddress = ['PROFESSIONAL_ACCEPTED', 'PROFESSIONAL_ON_THE_WAY', 'PROFESSIONAL_ARRIVED', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'CUSTOMER_CONFIRMED', 'COMPLETED'].includes(b.status);
        if (!showFullAddress && b.serviceAddressSnapshot) {
          b.serviceAddressSnapshot.addressLine1 = '[MASKED]';
          b.serviceAddressSnapshot.coordinates = undefined;
        }
      });
    }
    
    return successResponse({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    logger.error('Error listing bookings', error, { endpoint: '/api/bookings' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
