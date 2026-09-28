import mongoose from 'mongoose';

const CouponUsageSchema = new mongoose.Schema({
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  discountApplied: { type: Number, required: true }, // in paise
  usedAt: { type: Date, default: Date.now }
}, { timestamps: true });

CouponUsageSchema.index({ couponId: 1, customerId: 1 });

export default mongoose.models.CouponUsage || mongoose.model('CouponUsage', CouponUsageSchema);
