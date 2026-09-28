import ServicePackage from '@/models/ServicePackage';
import ServiceAddon from '@/models/ServiceAddon';
import Zone from '@/models/Zone';
import Coupon from '@/models/Coupon';
import Customer from '@/models/Customer';
import Booking from '@/models/Booking';

/**
 * Calculates price breakdown for a booking
 */
export async function calculateBookingPrice(serviceId, packageId, addonIds = [], couponCode = null, customerId = null, zoneId = null) {
  // 1. Fetch package basePrice
  const pkg = await ServicePackage.findOne({ _id: packageId, serviceId, isActive: true });
  if (!pkg) {
    throw new Error('INVALID_PACKAGE');
  }

  const basePrice = pkg.basePrice; // in paise

  // 2. Sum addons prices
  let addonsPrice = 0;
  if (addonIds && addonIds.length > 0) {
    const addons = await ServiceAddon.find({ _id: { $in: addonIds }, serviceId, isActive: true });
    addonsPrice = addons.reduce((sum, a) => sum + a.price, 0);
  }

  // 3. Apply Zone multiplier & Surge
  let zoneMultiplier = 1.0;
  let surgeMultiplier = 1.0;
  if (zoneId) {
    const zone = await Zone.findById(zoneId);
    if (zone && zone.isActive) {
      zoneMultiplier = zone.pricingMultiplier || 1.0;
      if (zone.surgeActive) {
        surgeMultiplier = zone.surgeMultiplier || 1.0;
      }
    }
  }

  // Service Price & Addons Price calculations (surge & zone multiplied)
  const servicePrice = Math.round(basePrice * zoneMultiplier * surgeMultiplier);
  const calculatedAddonsPrice = Math.round(addonsPrice * zoneMultiplier * surgeMultiplier);
  const subtotal = servicePrice + calculatedAddonsPrice; // in paise

  // 4. Convenience Fee & GST
  const convenienceFee = 2900; // flat ₹29 in paise
  const gst = Math.round(convenienceFee * 0.18); // 18% GST on convenience fee = 522 paise

  // 5. Apply Coupon Discount if applicable
  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon) {
      const now = new Date();
      if (coupon.validFrom <= now && coupon.validUntil >= now) {
        // Verify min order amount
        if (subtotal >= coupon.minOrderAmount) {
          // Verify service applicability
          const isServiceApplicable = coupon.applicableServices.length === 0 || 
            coupon.applicableServices.map(s => s.toString()).includes(serviceId.toString());
            
          if (isServiceApplicable) {
            // Verify usage count
            const withinLimit = coupon.usageLimitTotal === null || coupon.usageCount < coupon.usageLimitTotal;
            
            if (withinLimit) {
              // Verify first booking condition
              let isFirstBookingValid = true;
              if (coupon.isFirstBookingOnly && customerId) {
                const bookingCount = await Booking.countDocuments({
                  customerId,
                  status: { $nin: ['PAYMENT_PENDING', 'PAYMENT_FAILED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_ADMIN'] }
                });
                if (bookingCount > 0) isFirstBookingValid = false;
              }
              
              if (isFirstBookingValid) {
                // Calculate discount
                if (coupon.discountType === 'flat') {
                  discount = coupon.discountValue; // flat value in paise
                } else if (coupon.discountType === 'percent') {
                  const percentDiscount = Math.round((subtotal * coupon.discountValue) / 100);
                  discount = coupon.maxDiscountCap > 0 
                    ? Math.min(percentDiscount, coupon.maxDiscountCap)
                    : percentDiscount;
                }
                
                // Cap discount at subtotal
                discount = Math.min(discount, subtotal);
              }
            }
          }
        }
      }
    }
  }

  // 6. Calculate total price
  const total = Math.max(0, subtotal - discount) + convenienceFee + gst;

  // 7. Calculate Professional Payout (75% of servicePrice + 75% of addonsPrice)
  const professionalPayout = Math.round((servicePrice + calculatedAddonsPrice) * 0.75);

  // 8. Platform Revenue
  const platformRevenue = total - professionalPayout;

  return {
    servicePrice,
    addonsPrice: calculatedAddonsPrice,
    convenienceFee,
    discount,
    gst,
    total,
    professionalPayout,
    platformRevenue
  };
}
