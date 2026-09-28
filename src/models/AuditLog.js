import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // actorId / userId
  actorRole: { type: String, required: true },
  action: { type: String, required: true, index: true }, // e.g. 'professional.verified'
  resourceType: { type: String, required: true, index: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

AuditLogSchema.index({ actorId: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });

// Enforce immutability at Mongoose level
const throwImmutabilityError = function(next) {
  next(new Error('Audit logs are immutable and cannot be modified or deleted.'));
};

AuditLogSchema.pre('save', function(next) {
  if (!this.isNew) {
    return next(new Error('Audit logs are immutable and cannot be updated.'));
  }
  next();
});

AuditLogSchema.pre('updateOne', throwImmutabilityError);
AuditLogSchema.pre('updateMany', throwImmutabilityError);
AuditLogSchema.pre('findOneAndUpdate', throwImmutabilityError);
AuditLogSchema.pre('remove', throwImmutabilityError);
AuditLogSchema.pre('deleteOne', throwImmutabilityError);
AuditLogSchema.pre('deleteMany', throwImmutabilityError);
AuditLogSchema.pre('findOneAndDelete', throwImmutabilityError);
AuditLogSchema.pre('findOneAndRemove', throwImmutabilityError);

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
