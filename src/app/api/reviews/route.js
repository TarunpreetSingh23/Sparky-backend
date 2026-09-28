import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import Booking from '@/models/Booking';
import Customer from '@/models/Customer';
import Professional from '@/models/Professional';
import Review from '@/models/Review';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    if (user.role !== 'customer') {
      return errorResponse('Only customers can review services.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const customer = await Customer.findOne({ userId: user.userId });
    if (!customer) {
      return errorResponse('Customer profile not found.', ERROR_CODES.NOT_FOUND, 404);
    }
    
    const body = await req.json().catch(() => ({}));
    const { bookingId, rating, comment } = body;
    
    if (!bookingId || rating === undefined) {
      return errorResponse('Missing required fields: bookingId and rating', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return errorResponse('Rating must be an integer between 1 and 5.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }
    
    // Ownership check
    if (booking.customerId.toString() !== customer._id.toString()) {
      return errorResponse('Access denied. You can only review your own bookings.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    // Status check
    const completeStates = ['SERVICE_COMPLETED', 'CUSTOMER_CONFIRMED', 'COMPLETED'];
    if (!completeStates.includes(booking.status)) {
      return errorResponse('You can only review bookings that have been completed.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Duplicate check
    const existingReview = await Review.findOne({ bookingId: booking._id });
    if (existingReview) {
      return errorResponse('You have already submitted a review for this booking.', 'ALREADY_REVIEWED', 400);
    }
    
    if (!booking.professionalId) {
      return errorResponse('This booking has no professional assigned to review.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Create review
    const review = await Review.create({
      bookingId: booking._id,
      customerId: customer._id,
      professionalId: booking.professionalId,
      rating,
      comment: comment || '',
      isActive: true
    });
    
    // Recalculate Professional's Rating
    const stats = await Review.aggregate([
      { $match: { professionalId: booking.professionalId, isActive: true } },
      {
        $group: {
          _id: '$professionalId',
          avgRating: { $avg: '$rating' },
          totalCount: { $sum: 1 }
        }
      }
    ]);
    
    const professional = await Professional.findById(booking.professionalId);
    if (professional && stats.length > 0) {
      professional.rating = Math.round(stats[0].avgRating * 100) / 100; // round to 2 decimals
      professional.reviewCount = stats[0].totalCount;
      await professional.save();
    }
    
    return successResponse({ review }, 201);
    
  } catch (error) {
    logger.error('Error submitting review', error, { endpoint: '/api/reviews' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const professionalId = searchParams.get('professionalId');
    const bookingId = searchParams.get('bookingId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const filter = { isActive: true };
    if (professionalId) filter.professionalId = professionalId;
    if (bookingId) filter.bookingId = bookingId;

    const skip = (page - 1) * limit;
    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('customerId', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return successResponse({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching reviews', error, { endpoint: '/api/reviews' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
