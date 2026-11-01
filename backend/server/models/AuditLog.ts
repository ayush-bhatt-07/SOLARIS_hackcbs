import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: string;
  organisationId: string;
  action: string;
  at: string;
  propertySnapshot?: Record<string, unknown>;
}

const AuditLogSchema = new Schema<IAuditLog>({
  actorId: { type: String, required: true, index: true },
  organisationId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  at: { type: String, required: true },
  propertySnapshot: { type: Schema.Types.Mixed },
}, {
  timestamps: false,
  collection: 'audit_logs',
});

AuditLogSchema.index({ organisationId: 1, at: -1 });

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
