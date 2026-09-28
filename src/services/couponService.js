import Coupon from '@/models/Coupon';
import CouponUsage from '@/models/CouponUsage';
import Booking from '@/models/Booking';

/**
 * Validates a coupon code against booking context
 */
export async function validateCouponCode(code, customerId, serviceId, subtotal) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) {
    return { valid: false, reason: 'Coupon code not found or inactive.' };
  }
  
  const now = new Date();
  if (coupon.validFrom > now) {
    return { valid: false, reason: 'Coupon offer has not started yet.' };
  }
  if (coupon.validUntil < now) {
    return { valid: false, reason: 'Coupon offer has expired.' };
  }
  
  // Order subtotal check
  if (subtotal < coupon.minOrderAmount) {
    return { valid: false, reason: `Minimum order amount of ₹${(coupon.minOrderAmount / 100).toFixed(2)} is required.` };
  }
  
  // Applicable services check
  if (coupon.applicableServices.length > 0 && serviceId) {
    const isApplicable = coupon.applicableServices.map(s => s.toString()).includes(serviceId.toString());
    if (!isApplicable) {
      return { valid: false, reason: 'Coupon is not applicable to the selected service.' };
    }
  }
  
  // Usage limits check
  if (coupon.usageLimitTotal !== null && coupon.usageCount >= coupon.usageLimitTotal) {
    return { valid: false, reason: 'Coupon usage limit has been reached.' };
  }
  
  // Per-user usage limits check
  if (customerId) {
    const userUsageCount = await CouponUsage.countDocuments({
      couponId: coupon._id,
      customerId
    });
    if (userUsageCount >= coupon.usageLimitPerUser) {
      return { valid: false, reason: 'You have exceeded the usage limit for this coupon.' };
    }
    
    // First booking check
    if (coupon.isFirstBookingOnly) {
      const bookingsCount = await Booking.countDocuments({
        customerId,
        status: { $nin: ['PAYMENT_PENDING', 'PAYMENT_FAILED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_ADMIN'] }
      });
      if (bookingsCount > 0) {
        return { valid: false, reason: 'This coupon is only valid for your first service booking.' };
      }
    }
  }
  
  // Calculate discount
  let discount = 0;
  if (coupon.discountType === 'flat') {
    discount = coupon.discountValue;
  } else if (coupon.discountType === 'percent') {
    const calculated = Math.round((subtotal * coupon.discountValue) / 100);
    discount = coupon.maxDiscountCap > 0 
      ? Math.min(calculated, coupon.maxDiscountCap)
      : calculated;
  }
  
  discount = Math.min(discount, subtotal);
  
  return {
    valid: true,
    coupon,
    discountAmount: discount
  };
}

/**
 * Returns active coupons applicable to a customer
 */
export async function getAvailableCouponsForCustomer(customerId) {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  });
  
  const applicable = [];
  
  for (const coupon of coupons) {
    // Check usage limits total
    if (coupon.usageLimitTotal !== null && coupon.usageCount >= coupon.usageLimitTotal) {
      continue;
    }
    
    // Check user limits
    if (customerId) {
      const userUsageCount = await CouponUsage.countDocuments({
        couponId: coupon._id,
        customerId
      });
      if (userUsageCount >= coupon.usageLimitPerUser) {
        continue;
      }
      
      if (coupon.isFirstBookingOnly) {
        const bookingsCount = await Booking.countDocuments({
          customerId,
          status: { $nin: ['PAYMENT_PENDING', 'PAYMENT_FAILED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_ADMIN'] }
        });
        if (bookingsCount > 0) continue;
      }
    }
    
    applicable.push(coupon);
  }
  
  return applicable;
}
