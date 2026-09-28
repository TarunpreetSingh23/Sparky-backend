import mongoose from 'mongoose';

const SupportMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderType: { type: String, default: 'Customer' },
  senderRole: { type: String },
  message: { type: String, required: true },
  attachments: [{ type: String }], // Cloudinary URLs
  sentAt: { type: Date, default: Date.now },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const SupportTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true, index: true }, // generated in pre-validate
  customerId: { type: mongoose.Schema.Types.ObjectId, index: true }, // compat with doc8
  creatorId: { type: mongoose.Schema.Types.ObjectId, index: true }, // compat with prompt18
  creatorModel: { type: String, default: 'Customer' },
  userType: { type: String, enum: ['customer', 'professional'], default: 'customer' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  
  category: {
    type: String,
    required: true
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
  subject: { type: String, required: true },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  
  messages: [SupportMessageSchema],
  
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Ref Admin/User
  resolvedAt: Date,
  resolution: String,
  
  slaDeadline: { type: Date },
  slaBreach: { type: Boolean, default: false }
}, { timestamps: true });

SupportTicketSchema.pre('validate', async function(next) {
  if (!this.ticketNumber) {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });
    const sequence = String(count + 1).padStart(4, '0');
    this.ticketNumber = `TKT${dateStr}${sequence}`;
  }
  if (!this.slaDeadline) {
    this.slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h default SLA
  }
  next();
});

export default mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema);
