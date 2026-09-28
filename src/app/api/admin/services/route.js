import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import Service from '@/models/Service';

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
    const {
      name, slug, categoryId, subcategoryId, description, shortDescription,
      imageUrl, videoUrl, includedItems, durationMinutes, availableCities,
      requiredSkills, requiredGender, genderApplicability, isFeatured, sortOrder
    } = body;
    
    if (!name || !slug || !categoryId) {
      return errorResponse('Missing required fields name, slug, or categoryId', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Check if slug is unique
    const existing = await Service.findOne({ slug });
    if (existing) {
      return errorResponse('A service with this slug already exists', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const service = await Service.create({
      name, slug, categoryId, subcategoryId, description, shortDescription,
      imageUrl, videoUrl, includedItems, durationMinutes, availableCities,
      requiredSkills, requiredGender, genderApplicability, isFeatured, sortOrder
    });
    
    return successResponse({ service }, 201);
    
  } catch (error) {
    logger.error('Error creating service in admin', error, { endpoint: '/api/admin/services' });
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
      return errorResponse('Missing service id parameter', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Check slug uniqueness if updating slug
    if (updates.slug) {
      const existing = await Service.findOne({ slug: updates.slug, _id: { $ne: id } });
      if (existing) {
        return errorResponse('A service with this slug already exists', ERROR_CODES.VALIDATION_ERROR, 400);
      }
    }
    
    const service = await Service.findByIdAndUpdate(id, updates, { new: true });
    if (!service) {
      return errorResponse('Service not found', 'SERVICE_NOT_FOUND', 404);
    }
    
    return successResponse({ service });
    
  } catch (error) {
    logger.error('Error updating service in admin', error, { endpoint: '/api/admin/services' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
