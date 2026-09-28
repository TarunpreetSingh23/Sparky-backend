import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import ServicePackage from '@/models/ServicePackage';

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
      serviceId, name, description, basePrice, productCost, professionalPayout,
      platformCommission, gstPercent, durationMinutes, isDefault, sortOrder
    } = body;
    
    if (!serviceId || !name || basePrice === undefined || professionalPayout === undefined || platformCommission === undefined) {
      return errorResponse('Missing required fields', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Validate prices are integers
    if (!Number.isInteger(basePrice) || !Number.isInteger(professionalPayout) || !Number.isInteger(platformCommission)) {
      return errorResponse('All prices must be integers representing paise', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const gstPercentVal = gstPercent || 18;
    const gstAmount = Math.round(basePrice * (gstPercentVal / 100));
    
    // If making default, reset other packages for this service
    if (isDefault) {
      await ServicePackage.updateMany({ serviceId }, { isDefault: false });
    }
    
    const servicePackage = await ServicePackage.create({
      serviceId, name, description, basePrice, productCost, professionalPayout,
      platformCommission, gstPercent: gstPercentVal, gstAmount, durationMinutes, isDefault, sortOrder
    });
    
    return successResponse({ servicePackage }, 201);
    
  } catch (error) {
    logger.error('Error creating package in admin', error, { endpoint: '/api/admin/packages' });
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
      return errorResponse('Missing package id parameter', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // If updating pricing, re-validate and calculate GST
    if (updates.basePrice !== undefined) {
      if (!Number.isInteger(updates.basePrice)) {
        return errorResponse('Price must be an integer representing paise', ERROR_CODES.VALIDATION_ERROR, 400);
      }
      
      const gstPercentVal = updates.gstPercent !== undefined ? updates.gstPercent : 18;
      updates.gstAmount = Math.round(updates.basePrice * (gstPercentVal / 100));
    }
    
    const pkg = await ServicePackage.findById(id);
    if (!pkg) {
      return errorResponse('Package not found', ERROR_CODES.NOT_FOUND, 404);
    }
    
    // If setting default, unset others for the same serviceId
    if (updates.isDefault) {
      await ServicePackage.updateMany({ serviceId: pkg.serviceId }, { isDefault: false });
    }
    
    const servicePackage = await ServicePackage.findByIdAndUpdate(id, updates, { new: true });
    
    return successResponse({ servicePackage });
    
  } catch (error) {
    logger.error('Error updating package in admin', error, { endpoint: '/api/admin/packages' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
