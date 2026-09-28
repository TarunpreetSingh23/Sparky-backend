import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import Professional from '@/models/Professional';
import ProfessionalDocuments from '@/models/ProfessionalDocuments';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation: HR_ADMIN or SUPER_ADMIN
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'HR_ADMIN');
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
    const { status, reason } = body; // APPROVED or VERIFICATION_FAILED
    
    if (!status || !['APPROVED', 'VERIFICATION_FAILED'].includes(status)) {
      return errorResponse('Invalid status. Allowed values: APPROVED, VERIFICATION_FAILED', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const docs = await ProfessionalDocuments.findOne({ professionalId: professional._id });
    
    if (status === 'APPROVED') {
      professional.verificationStatus = 'TRAINING_PENDING'; // Transition to next stage
      professional.verifiedAt = new Date();
      professional.verifiedBy = user.userId;
      
      if (docs) {
        docs.documents.aadhaar.verificationStatus = 'verified';
        docs.documents.aadhaar.verifiedAt = new Date();
        docs.documents.pan.verificationStatus = 'verified';
        docs.documents.pan.verifiedAt = new Date();
        if (docs.documents.policeVerification) {
          docs.documents.policeVerification.status = 'clear';
          docs.documents.policeVerification.verifiedAt = new Date();
        }
        docs.reviewedAt = new Date();
        docs.reviewedBy = user.userId;
        await docs.save();
      }
    } else {
      professional.verificationStatus = 'VERIFICATION_FAILED';
      
      if (docs) {
        docs.documents.aadhaar.verificationStatus = 'failed';
        docs.documents.aadhaar.rejectionReason = reason || 'Documents did not pass verification checks';
        docs.documents.pan.verificationStatus = 'failed';
        docs.documents.pan.rejectionReason = reason || 'Documents did not pass verification checks';
        docs.reviewedAt = new Date();
        docs.reviewedBy = user.userId;
        await docs.save();
      }
    }
    
    await professional.save();
    
    // Simulate WhatsApp Notification Trigger
    logger.info(`[WHATSAPP NOTIFICATION] Sent verification update to professional ${professional.name} (${professional.verificationStatus}). Reason: ${reason || 'N/A'}`);
    
    return successResponse({
      verificationStatus: professional.verificationStatus,
      message: `Professional verification status updated to ${professional.verificationStatus}`
    });
    
  } catch (error) {
    logger.error('Error verifying professional', error, { endpoint: `/api/admin/professionals/${params.id}/verify` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
