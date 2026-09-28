import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import Professional from '@/models/Professional';
import ProfessionalEarning from '@/models/ProfessionalEarning';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
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
    
    // Ownership check: owner or admin
    const isOwner = user.userId === professional.userId.toString();
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return errorResponse('Access denied.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const { searchParams } = new URL(req.url);
    const startDateQuery = searchParams.get('startDate');
    const endDateQuery = searchParams.get('endDate');
    
    const filter = { professionalId: professional._id };
    
    if (startDateQuery || endDateQuery) {
      filter.completedAt = {};
      if (startDateQuery) {
        filter.completedAt.$gte = new Date(startDateQuery);
      }
      if (endDateQuery) {
        // Set to end of the day if YYYY-MM-DD
        const end = new Date(endDateQuery);
        if (endDateQuery.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
        filter.completedAt.$lte = end;
      }
    }
    
    const earnings = await ProfessionalEarning.find(filter)
      .populate('bookingId', 'bookingNumber scheduledDate scheduledTimeSlot status')
      .sort({ completedAt: -1 });
      
    const totalServiceEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalIncentives = earnings.reduce((sum, e) => sum + (e.incentive || 0), 0);
    const netEarnings = totalServiceEarnings + totalIncentives;
    
    return successResponse({
      earnings,
      summary: {
        totalServiceEarnings,
        totalIncentives,
        netEarnings,
        count: earnings.length
      }
    });
    
  } catch (error) {
    logger.error('Error fetching professional earnings', error, { endpoint: `/api/professionals/${params.id}/earnings` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
