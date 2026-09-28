import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { uploadToCloudinary } from '@/lib/cloudinary';
import Professional from '@/models/Professional';
import ProfessionalDocuments from '@/models/ProfessionalDocuments';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const professional = await Professional.findOne(
      mongoose.isValidObjectId(id)
        ? { $or: [{ userId: id }, { _id: id }] }
        : { userId: id }
    );
    
    if (!professional) {
      return errorResponse('Professional profile not found', ERROR_CODES.NOT_FOUND, 404);
    }
    
    // Ownership check
    const isOwner = user.userId === professional.userId.toString();
    const isAdmin = user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return errorResponse('Access denied. You can only upload your own KYC documents.', ERROR_CODES.FORBIDDEN, 403);
    }
    
    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return errorResponse('Invalid form-data payload', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const aadhaarFront = formData.get('aadhaarFront');
    const aadhaarBack = formData.get('aadhaarBack');
    const selfie = formData.get('selfie');
    const pan = formData.get('pan');
    const policeCert = formData.get('policeCert');
    const aadhaarNumber = formData.get('aadhaarNumber') || '';
    const panNumber = formData.get('panNumber') || '';
    
    if (!aadhaarFront || !aadhaarBack || !selfie || !pan) {
      return errorResponse('Missing required documents (aadhaarFront, aadhaarBack, selfie, and pan are mandatory)', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Helper to upload File object to Cloudinary private bucket
    const uploadDoc = async (file, folderName) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Str = `data:${file.type};base64,${buffer.toString('base64')}`;
      const result = await uploadToCloudinary(base64Str, `sparky_kyc/${professional._id}/${folderName}`, true);
      return result.publicId; // Store public ID to generate signed URLs later
    };
    
    // Execute uploads
    const aadhaarFrontUrl = await uploadDoc(aadhaarFront, 'aadhaar_front');
    const aadhaarBackUrl = await uploadDoc(aadhaarBack, 'aadhaar_back');
    const selfieUrl = await uploadDoc(selfie, 'selfie');
    const panUrl = await uploadDoc(pan, 'pan');
    let policeCertUrl = '';
    if (policeCert) {
      policeCertUrl = await uploadDoc(policeCert, 'police_verification');
    }
    
    // Masking numbers
    const maskedAadhaar = aadhaarNumber.length >= 4 
      ? `XXXX XXXX ${aadhaarNumber.slice(-4)}`
      : 'XXXX XXXX XXXX';
      
    const maskedPan = panNumber.length >= 10
      ? `${panNumber.slice(0, 5)}XX${panNumber.slice(-3)}`
      : 'ABCXX1234X';
      
    // Save to ProfessionalDocuments collection
    let docs = await ProfessionalDocuments.findOne({ professionalId: professional._id });
    if (!docs) {
      docs = new ProfessionalDocuments({
        professionalId: professional._id
      });
    }
    
    docs.documents = {
      aadhaar: {
        frontImageUrl: aadhaarFrontUrl,
        backImageUrl: aadhaarBackUrl,
        selfieWithAadhaarUrl: selfieUrl,
        maskedNumber: maskedAadhaar,
        verificationStatus: 'pending'
      },
      pan: {
        imageUrl: panUrl,
        maskedNumber: maskedPan,
        verificationStatus: 'pending'
      },
      policeVerification: {
        status: policeCert ? 'pending' : 'clear',
        certificate: policeCertUrl || undefined
      }
    };
    
    docs.uploadedAt = new Date();
    await docs.save();
    
    // Transition status to DOCUMENTS_PENDING (submitted and waiting admin review)
    professional.verificationStatus = 'DOCUMENTS_PENDING';
    await professional.save();
    
    return successResponse({
      verificationStatus: professional.verificationStatus,
      documentsUploaded: true
    });
    
  } catch (error) {
    logger.error('Error in KYC document upload', error, { endpoint: `/api/professionals/${params.id}/kyc` });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
