import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import Professional from '@/models/Professional';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
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
      return errorResponse('Access denied. You can only toggle your own status.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const body = await req.json().catch(() => ({}));
    const { isOnline } = body;
    
    if (isOnline === undefined || typeof isOnline !== 'boolean') {
      return errorResponse('Missing or invalid isOnline parameter', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Block status changes if professional is suspended
    if (professional.verificationStatus === 'SUSPENDED') {
      return errorResponse('Account is suspended. Cannot go online.', 'FORBIDDEN_ACCESS', 403);
    }
    
    professional.isOnline = isOnline;
    await professional.save();
    
    return successResponse({ isOnline: professional.isOnline });
    
  } catch (error) {
    logger.error('Error toggling professional status', error, { endpoint: `/api/professionals/${params.id}/status` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
