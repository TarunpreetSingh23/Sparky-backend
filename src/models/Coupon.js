import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  description: String,
  discountType: { type: String, enum: ['flat', 'percent'], required: true },
  discountValue: { type: Number, required: true }, // flat amount in paise, or percentage value
  maxDiscountCap: { type: Number, default: 0 }, // in paise
  minOrderAmount: { type: Number, default: 0 }, // in paise
  
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  
  usageLimitTotal: { type: Number, default: null }, // null = unlimited
  usageLimitPerUser: { type: Number, default: 1 },
  usageCount: { type: Number, default: 0 },
  
  applicableServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }], // empty = all
  applicableCities: [{ type: String }], // empty = all
  isFirstBookingOnly: { type: Boolean, default: false },
  isNewUserOnly: { type: Boolean, default: false },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
