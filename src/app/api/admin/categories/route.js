import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'CONTENT_ADMIN');
    if (!rbac.allowed) return rbac.error;
    
    const body = await req.json().catch(() => ({}));
    const { name, slug, description, icon, imageUrl, sortOrder, genderApplicability, parentId } = body;
    
    if (!name || !slug) {
      return errorResponse('Missing required fields name or slug', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Check if slug exists
    const existing = await Category.findOne({ slug });
    if (existing) {
      return errorResponse('A category with this slug already exists', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const category = await Category.create({
      name, slug, description, icon, imageUrl, sortOrder, genderApplicability, parentId: parentId || null
    });
    
    return successResponse({ category }, 201);
    
  } catch (error) {
    logger.error('Error creating category in admin', error, { endpoint: '/api/admin/categories' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

export async function PATCH(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'CONTENT_ADMIN');
    if (!rbac.allowed) return rbac.error;
    
    const body = await req.json().catch(() => ({}));
    const { id, ...updates } = body;
    
    if (!id) {
      return errorResponse('Missing category id parameter', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    if (updates.slug) {
      const existing = await Category.findOne({ slug: updates.slug, _id: { $ne: id } });
      if (existing) {
        return errorResponse('A category with this slug already exists', ERROR_CODES.VALIDATION_ERROR, 400);
      }
    }
    
    const category = await Category.findByIdAndUpdate(id, updates, { new: true });
    if (!category) {
      return errorResponse('Category not found', ERROR_CODES.NOT_FOUND, 404);
    }
    
    return successResponse({ category });
    
  } catch (error) {
    logger.error('Error updating category in admin', error, { endpoint: '/api/admin/categories' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
