import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
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
    
    // RBAC validation: OPERATIONS_ADMIN or SUPER_ADMIN (or PROFESSIONAL_MANAGER)
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'PROFESSIONAL_MANAGER');
    if (!rbac.allowed) return rbac.error;
    
    const professional = await Professional.findOne(
      mongoose.isValidObjectId(id)
        ? { $or: [{ userId: id }, { _id: id }] }
        : { userId: id }
    );
    if (!professional) {
      return errorResponse('Professional profile not found', ERROR_CODES.NOT_FOUND, 404);
    }
    
    const body = await req.json().catch(() => ({}));
    const { reason } = body;
    
    professional.verificationStatus = 'SUSPENDED';
    professional.isOnline = false; // Kick offline
    await professional.save();
    
    logger.info(`Professional ${professional.name} suspended by admin ${user.userId}. Reason: ${reason || 'N/A'}`);
    
    return successResponse({
      verificationStatus: professional.verificationStatus,
      isOnline: professional.isOnline,
      message: 'Professional has been suspended successfully.'
    });
    
  } catch (error) {
    logger.error('Error suspending professional', error, { endpoint: `/api/admin/professionals/${params.id}/suspend` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
