import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { logger } from '@/lib/logger';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
    
    // Build tree
    const parentCategories = categories.filter(c => !c.parentId);
    const subCategoriesMap = {};
    
    categories.forEach(c => {
      if (c.parentId) {
        const pId = c.parentId.toString();
        if (!subCategoriesMap[pId]) subCategoriesMap[pId] = [];
        subCategoriesMap[pId].push(c.toObject());
      }
    });
    
    const hierarchicalList = parentCategories.map(parent => {
      const pObj = parent.toObject();
      pObj.subcategories = subCategoriesMap[parent._id.toString()] || [];
      return pObj;
    });
    
    return successResponse({ categories: hierarchicalList });
  } catch (error) {
    logger.error('Error fetching categories', error, { endpoint: '/api/categories' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
