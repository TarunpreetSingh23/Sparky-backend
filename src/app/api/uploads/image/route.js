import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'public'; // public or private
    
    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return errorResponse('Invalid form-data payload', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const file = formData.get('image');
    if (!file) {
      return errorResponse('Missing file parameter: image', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Str = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    const isPrivate = type === 'private';
    const folder = isPrivate ? 'sparky_private_docs' : 'sparky_public_assets';
    
    const result = await uploadToCloudinary(base64Str, folder, isPrivate);
    
    return successResponse({
      uploaded: true,
      publicId: result.publicId,
      url: result.secureUrl
    });
    
  } catch (error) {
    logger.error('Error uploading image asset', error, { endpoint: '/api/uploads/image' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
