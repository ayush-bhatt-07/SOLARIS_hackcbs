import mongoose, { Schema, Document } from 'mongoose';
import type { Workspace } from '../../src/types/commercial';

export interface IMembership extends Document {
  accountId: string;
  organisationId: string;
  workspace: Workspace;
  role: 'household_member' | 'property_owner' | 'facility_manager' | 'shop_tenant' | 'installer_admin' | 'installer_engineer';
  status: 'active' | 'inactive';
  propertyId?: string;
  shopId?: string;
  assignedProjectIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>({
  accountId: { type: String, required: true, index: true },
  organisationId: { type: String, required: true, index: true },
  workspace: { type: String, required: true, enum: ['household', 'commercial', 'installer'] },
  role: {
    type: String,
    required: true,
    enum: ['household_member', 'property_owner', 'facility_manager', 'shop_tenant', 'installer_admin', 'installer_engineer']
  },
  status: { type: String, required: true, enum: ['active', 'inactive'], default: 'active' },
  propertyId: { type: String, index: true },
  shopId: { type: String },
  assignedProjectIds: [{ type: String }],
}, {
  timestamps: true,
  collection: 'memberships',
});

MembershipSchema.index({ accountId: 1, organisationId: 1, workspace: 1 });

export const MembershipModel = mongoose.models.Membership || mongoose.model<IMembership>('Membership', MembershipSchema);
