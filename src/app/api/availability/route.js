import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import { getAvailableSlots } from '@/services/availabilityService';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get('date'); // YYYY-MM-DD
    const serviceId = searchParams.get('serviceId');
    const cityQuery = searchParams.get('city'); // city slug
    
    if (!dateQuery || !serviceId || !cityQuery) {
      return errorResponse('Missing required query parameters: date, serviceId, city', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateQuery)) {
      return errorResponse('Date must be in YYYY-MM-DD format.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const bookingDate = new Date(dateQuery);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return errorResponse('Date cannot be in the past.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const slots = await getAvailableSlots(dateQuery, serviceId, cityQuery);
    return successResponse({ slots });
    
  } catch (error) {
    logger.error('Error fetching availability slots', error, { endpoint: '/api/availability' });
    if (error.message === 'CITY_UNAVAILABLE') {
      return errorResponse('Service city not found or inactive.', 'CITY_UNAVAILABLE', 400);
    }
    if (error.message === 'SERVICE_UNAVAILABLE') {
      return errorResponse('Service not found or inactive.', ERROR_CODES.SERVICE_UNAVAILABLE, 400);
    }
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
