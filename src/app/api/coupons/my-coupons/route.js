import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getAvailableCouponsForCustomer } from '@/services/couponService';
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
    
    const coupons = await getAvailableCouponsForCustomer(customer._id);
    
    // Scrub internal usage metrics/limits from user facing API
    const safeCoupons = coupons.map(c => ({
      id: c._id,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscountCap: c.maxDiscountCap,
      minOrderAmount: c.minOrderAmount,
      description: c.description,
      validUntil: c.validUntil,
      isFirstBookingOnly: c.isFirstBookingOnly
    }));
    
    return successResponse({ coupons: safeCoupons });
    
  } catch (error) {
    logger.error('Error fetching available coupons', error, { endpoint: '/api/coupons/my-coupons' });
    return errorResponse('Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
