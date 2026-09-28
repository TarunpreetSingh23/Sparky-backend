import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import { getAvailableSlots } from '@/services/availabilityService';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const startDateQuery = searchParams.get('startDate'); // YYYY-MM-DD
    const endDateQuery = searchParams.get('endDate'); // YYYY-MM-DD
    const serviceId = searchParams.get('serviceId');
    const cityQuery = searchParams.get('city');
    
    if (!startDateQuery || !endDateQuery || !serviceId || !cityQuery) {
      return errorResponse('Missing required query parameters: startDate, endDate, serviceId, city', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDateQuery) || !dateRegex.test(endDateQuery)) {
      return errorResponse('Dates must be in YYYY-MM-DD format.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const start = new Date(startDateQuery);
    const end = new Date(endDateQuery);
    
    // Check bounds
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today || end < today) {
      return errorResponse('Dates cannot be in the past.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Restrict date range to max 7 days
    const rangeMs = end.getTime() - start.getTime();
    const rangeDays = rangeMs / (1000 * 60 * 60 * 24);
    if (rangeDays < 0 || rangeDays > 7) {
      return errorResponse('Date range limit exceeded. Maximum calendar window is 7 days.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const calendar = {};
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      try {
        const slots = await getAvailableSlots(dateStr, serviceId, cityQuery);
        calendar[dateStr] = slots;
      } catch (err) {
        calendar[dateStr] = [];
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return successResponse({ calendar });
    
  } catch (error) {
    logger.error('Error in availability slots range handler', error, { endpoint: '/api/availability/slots' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
