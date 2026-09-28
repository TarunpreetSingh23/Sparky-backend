import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { getSignedCloudinaryUrl } from '@/lib/cloudinary';
import Professional from '@/models/Professional';
import ProfessionalDocuments from '@/models/ProfessionalDocuments';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
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
    
    const docs = await ProfessionalDocuments.findOne({ professionalId: professional._id });
    if (!docs) {
      return errorResponse('No documents found for this professional', ERROR_CODES.NOT_FOUND, 404);
    }
    
    // Generate signed URLs (24h expiry) for Aadhaar, PAN, and Police verification
    const signedDocs = {
      aadhaar: {
        frontImageUrl: docs.documents.aadhaar.frontImageUrl ? getSignedCloudinaryUrl(docs.documents.aadhaar.frontImageUrl) : '',
        backImageUrl: docs.documents.aadhaar.backImageUrl ? getSignedCloudinaryUrl(docs.documents.aadhaar.backImageUrl) : '',
        selfieWithAadhaarUrl: docs.documents.aadhaar.selfieWithAadhaarUrl ? getSignedCloudinaryUrl(docs.documents.aadhaar.selfieWithAadhaarUrl) : '',
        maskedNumber: docs.documents.aadhaar.maskedNumber,
        verificationStatus: docs.documents.aadhaar.verificationStatus
      },
      pan: {
        imageUrl: docs.documents.pan.imageUrl ? getSignedCloudinaryUrl(docs.documents.pan.imageUrl) : '',
        maskedNumber: docs.documents.pan.maskedNumber,
        verificationStatus: docs.documents.pan.verificationStatus
      },
      experienceCertificates: (docs.documents.experienceCertificates || []).map(cert => ({
        url: cert.url ? getSignedCloudinaryUrl(cert.url) : '',
        description: cert.description,
        uploadedAt: cert.uploadedAt
      })),
      policeVerification: {
        status: docs.documents.policeVerification?.status,
        certificate: docs.documents.policeVerification?.certificate ? getSignedCloudinaryUrl(docs.documents.policeVerification.certificate) : ''
      }
    };
    
    return successResponse({
      professionalId: professional._id,
      documents: signedDocs,
      uploadedAt: docs.uploadedAt
    });
    
  } catch (error) {
    logger.error('Error fetching signed document URLs', error, { endpoint: `/api/admin/professionals/${params.id}/documents` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
