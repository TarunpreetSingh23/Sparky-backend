import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, required: true, unique: true, index: true }, // e.g. SP240215001
  bookingId: { type: String, unique: true, sparse: true, index: true }, // copy of bookingNumber for compatibility
  
  // Parties
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', default: null, index: true },
  
  // Service
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServicePackage', required: true },
  addonIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceAddon' }],
  
  // Schedule
  scheduledDate: { type: Date, required: true, index: true },
  scheduledTimeSlot: { type: String, required: true }, // e.g. '14:00'
  scheduledDuration: { type: Number, default: 30 }, // Minutes
  
  // Address
  serviceAddressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  serviceAddressSnapshot: {
    addressLine1: String,
    area: String,
    city: String,
    pincode: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] } // [longitude, latitude]
    }
  },
  
  // Pricing
  pricing: {
    servicePrice: { type: Number, required: true }, // in paise (integer)
    addonsPrice: { type: Number, default: 0 },
    convenienceFee: { type: Number, default: 2900 }, // in paise
    discount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    total: { type: Number, required: true }, // what customer paid (in paise)
    professionalPayout: { type: Number, required: true }, // what pro gets
    platformRevenue: { type: Number, required: true }
  },
  
  // Coupon
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  couponCode: String,
  discountAmount: { type: Number, default: 0 },
  
  // Statuses
  status: {
    type: String,
    enum: [
      'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'SEARCHING_PROFESSIONAL', 
      'PROFESSIONAL_NOTIFIED', 'PROFESSIONAL_ACCEPTED', 'PROFESSIONAL_ON_THE_WAY', 
      'PROFESSIONAL_ARRIVED', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 
      'CUSTOMER_CONFIRMED', 'COMPLETED', 'CANCELLED_BY_CUSTOMER', 
      'CANCELLED_BY_PROFESSIONAL', 'CANCELLED_BY_ADMIN', 'PAYMENT_FAILED', 
      'NO_PROFESSIONAL_AVAILABLE', 'REFUND_PENDING', 'REFUNDED', 'DISPUTED'
    ],
    default: 'PAYMENT_PENDING',
    index: true
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: mongoose.Schema.Types.ObjectId, // userId
    reason: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Dispatch timeouts
  responseDeadline: Date,
  dispatchAttempts: { type: Number, default: 0 },
  
  // OTPs (hashed)
  startOtpHash: String,
  completeOtpHash: String,
  
  // Timestamps
  assignedAt: Date,
  professionalDepartedAt: Date,
  professionalArrivedAt: Date,
  serviceStartedAt: Date,
  serviceCompletedAt: Date,
  
  // Payment
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'], default: 'PENDING', index: true },
  
  // Review
  reviewed: { type: Boolean, default: false },
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: null },
  
  // Cancellation
  cancellationReason: String,
  cancelledBy: { type: String, enum: ['customer', 'professional', 'admin', 'system'] },
  cancellationFee: { type: Number, default: 0 }, // paise
  rescheduleCount: { type: Number, default: 0 },
  otpAttempts: { type: Number, default: 0 },
  
  // Add-ons requested during service
  additionalAddons: [{
    addonId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceAddon' },
    requestedAt: { type: Date, default: Date.now },
    approvedByCustomer: { type: Boolean, default: false },
    price: Number // paise
  }],
  
  source: { type: String, default: 'web' },
  notes: String
}, { timestamps: true });

BookingSchema.index({ scheduledDate: 1, status: 1 });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
