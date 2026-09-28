import { connectDB } from '@/lib/mongodb';
import { successResponse, errorResponse, ERROR_CODES } from '@/lib/apiResponse';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { calculateBookingPrice } from '@/services/pricingEngine';
import Address from '@/models/Address';
import Customer from '@/models/Customer';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    
    // Auth validation is optional here (public pricing estimation)
    let customerId = null;
    try {
      const auth = await requireAuth(req);
      if (auth.user) {
        const customer = await Customer.findOne({ userId: auth.user.userId });
        if (customer) customerId = customer._id;
      }
    } catch (e) {
      // Ignore auth failure for public estimate
    }
    
    const body = await req.json().catch(() => ({}));
    const { serviceId, packageId, addonIds, couponCode, addressId } = body;
    
    if (!serviceId || !packageId) {
      return errorResponse('Missing serviceId or packageId parameters', ERROR_CODES.VALIDATION_ERROR, 400);
    }
    
    // Resolve zoneId if addressId is provided
    let zoneId = null;
    if (addressId) {
      const address = await Address.findById(addressId);
      if (address) {
        zoneId = address.zoneId;
      }
    }
    
    const breakdown = await calculateBookingPrice(
      serviceId,
      packageId,
      addonIds || [],
      couponCode || null,
      customerId,
      zoneId
    );
    
    return successResponse({ pricing: breakdown });
    
  } catch (error) {
    logger.error('Error calculating dynamic pricing', error, { endpoint: '/api/pricing/calculate' });
    return errorResponse(error.message || 'Internal server error', ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
