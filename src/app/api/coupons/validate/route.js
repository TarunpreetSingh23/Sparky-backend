import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { validateCouponCode } from '@/services/couponService';
import Customer from '@/models/Customer';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    
    // Auth validation
    const { user, error: authError } = await requireAuth(req);
    if (authError) return authError;
    
    const customer = await Customer.findOne({ userId: user.userId });
    if (!customer) {
      return errorResponse('Customer profile not found.', ERROR_CODES.NOT_FOUND, 404);
    }
    
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const serviceId = searchParams.get('serviceId');
    const subtotalStr = searchParams.get('subtotal');
    
    if (!code || !subtotalStr) {
      return errorResponse('Missing required query parameters: code, subtotal', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const subtotal = parseInt(subtotalStr, 10);
    if (isNaN(subtotal) || subtotal < 0) {
      return errorResponse('Subtotal must be a valid integer representing paise.', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    const result = await validateCouponCode(code, customer._id, serviceId, subtotal);
    
    if (!result.valid) {
      return errorResponse(result.reason, 'INVALID_COUPON', 400);
    }
    
    return successResponse({
      valid: true,
      discountAmount: result.discountAmount,
      coupon: {
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        description: result.coupon.description
      }
    });
    
  } catch (error) {
    logger.error('Error validating coupon', error, { endpoint: '/api/coupons/validate' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
