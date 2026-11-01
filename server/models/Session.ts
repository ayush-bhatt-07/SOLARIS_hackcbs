import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  digest: string;
  accountId: string;
  expires: number;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  digest: { type: String, required: true, unique: true, index: true },
  accountId: { type: String, required: true, index: true },
  expires: { type: Number, required: true },
}, {
  timestamps: true,
  collection: 'sessions',
});

// Auto-expire documents when session expires
SessionSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
