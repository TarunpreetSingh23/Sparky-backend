import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { checkRBAC } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import Coupon from '@/models/Coupon';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'MARKETING_ADMIN');
    if (!rbac.allowed) return rbac.error;
    
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return successResponse({ coupons });
    
  } catch (error) {
    logger.error('Error fetching admin coupons', error, { endpoint: '/api/admin/coupons' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}

export async function POST(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    // RBAC validation
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'MARKETING_ADMIN');
    if (!rbac.allowed) return rbac.error;
    
    const body = await req.json().catch(() => ({}));
    const {
      code, discountType, discountValue, maxDiscountCap, minOrderAmount,
      validFrom, validUntil, usageLimitTotal, usageLimitPerUser,
      applicableServices, isFirstBookingOnly, description
    } = body;
    
    if (!code || !discountType || discountValue === undefined || minOrderAmount === undefined || !validFrom || !validUntil) {
      return errorResponse('Missing required fields', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Validate uniqueness of code
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return errorResponse('Coupon code already exists', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      maxDiscountCap: maxDiscountCap || 0,
      minOrderAmount,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      usageLimitTotal: usageLimitTotal !== undefined ? usageLimitTotal : null,
      usageLimitPerUser: usageLimitPerUser || 1,
      applicableServices: applicableServices || [],
      isFirstBookingOnly: !!isFirstBookingOnly,
      description,
      usageCount: 0,
      isActive: true
    });
    
    return successResponse({ coupon }, 201);
    
  } catch (error) {
    logger.error('Error creating coupon in admin', error, { endpoint: '/api/admin/coupons' });
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
    const rbac = await checkRBAC(user, 'SUPER_ADMIN', 'MARKETING_ADMIN');
    if (!rbac.allowed) return rbac.error;
    
    const body = await req.json().catch(() => ({}));
    const { id, ...updates } = body;
    
    if (!id) {
      return errorResponse('Missing coupon id parameter', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    if (updates.code) {
      updates.code = updates.code.toUpperCase();
      const existing = await Coupon.findOne({ code: updates.code, _id: { $ne: id } });
      if (existing) {
        return errorResponse('Coupon code already exists', ERROR_CODES.VALIDATION_ERROR, 400);
      }
    }
    
    if (updates.validFrom) updates.validFrom = new Date(updates.validFrom);
    if (updates.validUntil) updates.validUntil = new Date(updates.validUntil);
    
    const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true });
    if (!coupon) {
      return errorResponse('Coupon not found', ERROR_CODES.NOT_FOUND, 404);
    }
    
    return successResponse({ coupon });
    
  } catch (error) {
    logger.error('Error updating coupon in admin', error, { endpoint: '/api/admin/coupons' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
