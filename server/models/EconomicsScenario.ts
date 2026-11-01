import mongoose, { Schema, Document } from 'mongoose';
import type { EconomicsScenario } from '../../src/types/economics';

export interface IEconomicsScenario extends Document, EconomicsScenario {
  createdAt: string;
}

const EconomicsScenarioSchema = new Schema<IEconomicsScenario>({
  id: { type: String, required: true, unique: true, index: true },
  propertyId: { type: String, required: true, index: true },
  organisationId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  version: { type: Number, required: true },
  createdAt: { type: String, required: true },
  result: { type: Schema.Types.Mixed, required: true },
}, {
  timestamps: false,
  collection: 'economics_scenarios',
});

EconomicsScenarioSchema.index({ propertyId: 1, organisationId: 1, name: 1, version: 1 });
EconomicsScenarioSchema.index({ propertyId: 1, organisationId: 1, createdAt: -1 });

export const EconomicsScenarioModel = mongoose.models.EconomicsScenario || mongoose.model<IEconomicsScenario>('EconomicsScenario', EconomicsScenarioSchema);
