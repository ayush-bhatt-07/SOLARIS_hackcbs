import mongoose, { Schema, Document } from 'mongoose';
import type { BusinessProperty } from '../../src/types/commercial';

export interface IProperty extends Document, Omit<BusinessProperty, 'weatherSite'> {
  createdAt: Date;
  updatedAt: string;
}

const MallShopSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  floor: { type: Number, required: true },
  category: { type: String, required: true },
  consumptionKwh: { type: Number, required: true },
  status: { type: String, required: true, enum: ['active', 'pending', 'eligible', 'unconfigured', 'issue'] },
  meterId: { type: String, required: true },
  agreement: { type: String, required: true },
}, { _id: false });

const BusinessQuoteSchema = new Schema({
  id: { type: String, required: true },
  installerId: { type: String, required: true },
  installerName: { type: String, required: true },
  capacityKwp: { type: Number, required: true },
  status: { type: String, required: true, enum: ['requested', 'demo_quote', 'selected'] },
  amountInr: { type: Number },
  createdAt: { type: String, required: true },
  warranty: { type: String },
  timelineWeeks: { type: Number },
}, { _id: false });

const BillSchema = new Schema({
  month: { type: String, required: true },
  consumptionKwh: { type: Number, required: true },
  sourceState: { type: String, required: true, enum: ['SYNTHETIC', 'USER_CONFIRMED'] },
}, { _id: false });

const MeterSchema = new Schema({
  id: { type: String, required: true },
  kind: { type: String, required: true, enum: ['MAIN_DISCOM', 'SUBMETER'] },
  parentId: { type: String },
  shopId: { type: String },
}, { _id: false });

const ReadingSchema = new Schema({
  meterId: { type: String, required: true },
  period: { type: String, required: true },
  consumptionKwh: { type: Number, required: true },
  sourceState: { type: String, required: true, enum: ['SYNTHETIC', 'USER_CONFIRMED'] },
}, { _id: false });

const BenefitPolicySchema = new Schema({
  version: { type: Number, required: true },
  effectiveFrom: { type: String, required: true },
  period: { type: String, required: true },
  sharingPercent: { type: Number, required: true },
  eligibleShopIds: [{ type: String }],
  method: { type: String, required: true, default: 'CONSUMPTION_WEIGHTED' },
  state: { type: String, required: true, default: 'ILLUSTRATIVE' },
  sourceState: { type: String, required: true, default: 'SYNTHETIC' },
  rounding: { type: String, required: true, default: 'LARGEST_REMAINDER_PAISE' },
}, { _id: false });

const PropertySchema = new Schema<IProperty>({
  id: { type: String, required: true, unique: true, index: true },
  organisationId: { type: String, required: true, index: true },
  inputs: {
    name: { type: String, required: true },
    city: { type: String, required: true },
    discom: { type: String, required: true },
    roofAreaM2: { type: Number, required: true },
    consumptionKwh: { type: Number, required: true },
    tariff: { type: Number, required: true },
    fixedCharges: { type: Number, required: true },
    demandKw: { type: Number, required: true },
    demandRate: { type: Number, required: true },
    yieldKwhPerKwp: { type: Number, required: true },
    selfUseRatio: { type: Number, required: true },
    exportRate: { type: Number, required: true },
    costPerKwp: { type: Number, required: true },
    sharingPercent: { type: Number, required: true },
  },
  selectedCapacity: { type: Number, required: true, default: 200 },
  shops: [MallShopSchema],
  quotes: [BusinessQuoteSchema],
  sourceState: { type: String, required: true, enum: ['SYNTHETIC', 'USER_CONFIRMED'], default: 'SYNTHETIC' },
  bills: [BillSchema],
  policyVersion: { type: Number, required: true, default: 1 },
  updatedAt: { type: String, required: true },
  meters: [MeterSchema],
  readings: [ReadingSchema],
  benefitPolicies: [BenefitPolicySchema],
}, {
  timestamps: true,
  collection: 'properties',
});

PropertySchema.index({ organisationId: 1, id: 1 });

export const PropertyModel = mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);
