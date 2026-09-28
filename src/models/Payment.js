import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  
  // Razorpay fields
  razorpayOrderId: { type: String, required: true, unique: true, index: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true, index: true },
  razorpaySignature: String,
  
  amount: { type: Number, required: true }, // in paise (integer)
  currency: { type: String, default: 'INR' },
  
  // Statuses: created, authorized, captured, failed, refunded
  status: { type: String, enum: ['created', 'authorized', 'captured', 'failed', 'refunded', 'captured_locally'], default: 'created', index: true },
  method: String, // card, upi, netbanking, wallet, cod
  
  refunds: [{
    razorpayRefundId: String,
    amount: Number, // in paise
    reason: String,
    status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    initiatedAt: { type: Date, default: Date.now },
    processedAt: Date,
  }],
  
  webhookEvents: [{
    event: String,
    payload: mongoose.Schema.Types.Mixed,
    receivedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
