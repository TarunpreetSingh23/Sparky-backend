import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import Service from '@/models/Service';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const city = searchParams.get('city') || 'amritsar';
    
    if (!query) {
      return successResponse({ services: [], categories: [] });
    }
    
    const regex = new RegExp(query, 'i');
    
    // Search Services
    const serviceFilter = {
      isActive: true,
      availableCities: city.toLowerCase(),
      $or: [
        { name: regex },
        { description: regex },
        { shortDescription: regex }
      ]
    };
    
    const services = await Service.find(serviceFilter).limit(10);
    
    // Search Categories
    const categoryFilter = {
      isActive: true,
      name: regex
    };
    
    const categories = await Category.find(categoryFilter).limit(5);
    
    return successResponse({
      services,
      categories
    });
    
  } catch (error) {
    logger.error('Error in global search endpoint', error, { endpoint: '/api/search' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
