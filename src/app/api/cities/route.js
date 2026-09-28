import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import City from '@/models/City';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    const cities = await City.find({ isActive: true }).sort({ name: 1 });
    return successResponse({ cities });
  } catch (error) {
    logger.error('Error fetching cities', error, { endpoint: '/api/cities' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
