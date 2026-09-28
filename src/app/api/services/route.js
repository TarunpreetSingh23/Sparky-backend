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
    const categoryQuery = searchParams.get('category');
    const cityQuery = searchParams.get('city'); // City slug e.g. 'amritsar'
    const sortQuery = searchParams.get('sort') || 'sortOrder';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    const filter = { isActive: true };
    
    // City filter
    if (cityQuery) {
      filter.availableCities = cityQuery.toLowerCase();
    }
    
    // Category filter (supports either slug or categoryId)
    if (categoryQuery) {
      const category = await Category.findOne({
        $or: [
          { slug: categoryQuery },
          { _id: Object.is(categoryQuery.match(/^[a-f\d]{24}$/i), null) ? undefined : categoryQuery }
        ].filter(Boolean)
      });
      
      if (category) {
        // Find if this is a parent category or child
        const subcategories = await Category.find({ parentId: category._id, isActive: true });
        const categoryIds = [category._id, ...subcategories.map(s => s._id)];
        
        filter.$or = [
          { categoryId: { $in: categoryIds } },
          { subcategoryId: { $in: categoryIds } }
        ];
      } else {
        // If query category isn't found in DB, return empty list
        return successResponse({
          services: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        });
      }
    }
    
    // Sorting
    let sortObj = {};
    if (sortQuery === 'rating') {
      sortObj = { avgRating: -1, reviewCount: -1 };
    } else if (sortQuery === 'popular') {
      sortObj = { bookingCount: -1 };
    } else {
      sortObj = { sortOrder: 1, name: 1 };
    }
    
    const skip = (page - 1) * limit;
    const total = await Service.countDocuments(filter);
    const services = await Service.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);
      
    return successResponse({
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    logger.error('Error fetching services', error, { endpoint: '/api/services' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
