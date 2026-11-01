import mongoose, { Schema, Document } from 'mongoose';

export interface IResidentialState extends Document {
  accountId: string;
  organisationId: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentialStateSchema = new Schema<IResidentialState>({
  accountId: { type: String, required: true, index: true },
  organisationId: { type: String, required: true, index: true },
  data: { type: Schema.Types.Mixed, required: true, default: {} },
}, {
  timestamps: true,
  collection: 'residential_states',
});

ResidentialStateSchema.index({ accountId: 1, organisationId: 1 }, { unique: true });

export const ResidentialStateModel = mongoose.models.ResidentialState || mongoose.model<IResidentialState>('ResidentialState', ResidentialStateSchema);
