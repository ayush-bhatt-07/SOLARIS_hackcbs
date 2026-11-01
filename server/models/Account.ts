import mongoose, { Schema, Document } from 'mongoose';
import type { Workspace } from '../../src/types/commercial';

export interface IAccount extends Document {
  id: string;
  name: string;
  email: string;
  password: string;
  workspace: Workspace;
  organisationId: string;
  demo: boolean;
  commercialRole?: 'property_owner' | 'facility_manager' | 'shop_tenant' | 'installer_admin' | 'installer_engineer';
  shopId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true },
  workspace: { type: String, required: true, enum: ['household', 'commercial', 'installer'] },
  organisationId: { type: String, required: true, index: true },
  demo: { type: Boolean, default: false },
  commercialRole: { type: String, enum: ['property_owner', 'facility_manager', 'shop_tenant', 'installer_admin', 'installer_engineer'] },
  shopId: { type: String },
}, {
  timestamps: true,
  collection: 'accounts',
});

AccountSchema.index({ organisationId: 1, workspace: 1 });

export const AccountModel = mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);
