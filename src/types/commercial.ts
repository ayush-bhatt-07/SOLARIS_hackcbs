export type Workspace = 'household' | 'commercial' | 'installer';
export interface OrganisationMembership {
  accountId: string; organisationId: string; workspace: Workspace;
  role: 'household_member' | 'property_owner' | 'facility_manager' | 'shop_tenant' | 'installer_admin' | 'installer_engineer';
  status: 'active' | 'inactive'; propertyId?: string; shopId?: string;
}
export interface TenantBenefitPolicy {
  version: number; effectiveFrom: string; period: string; sharingPercent: number;
  eligibleShopIds: string[]; method: 'CONSUMPTION_WEIGHTED'; state: 'ILLUSTRATIVE';
  sourceState: 'SYNTHETIC'; rounding: 'LARGEST_REMAINDER_PAISE';
}
export interface EnergyMeter { id: string; kind: 'MAIN_DISCOM' | 'SUBMETER'; parentId?: string; shopId?: string; }
export interface EnergyReading { meterId: string; period: string; consumptionKwh: number; sourceState: 'SYNTHETIC' | 'USER_CONFIRMED'; }
export interface BusinessInputs {
  name: string; city: string; discom: string; roofAreaM2: number;
  consumptionKwh: number; tariff: number; fixedCharges: number;
  demandKw: number; demandRate: number; yieldKwhPerKwp: number;
  selfUseRatio: number; exportRate: number; costPerKwp: number; sharingPercent: number;
}
export type ShopStatus = 'active' | 'pending' | 'eligible' | 'unconfigured' | 'issue';
export interface MallShop {
  id: string; name: string; floor: number; category: string; consumptionKwh: number;
  status: ShopStatus; meterId: string; agreement: string;
}
export interface BusinessQuote {
  id: string; installerId: string; installerName: string; capacityKwp: number;
  status: 'requested' | 'demo_quote' | 'selected'; amountInr?: number;
  createdAt: string; warranty?: string; timelineWeeks?: number;
}
export interface BusinessProperty {
  weatherSite?: import('./weatherDetective').WeatherSite;
  id: string; organisationId: string; inputs: BusinessInputs; selectedCapacity: number;
  shops: MallShop[]; quotes: BusinessQuote[]; sourceState: 'SYNTHETIC' | 'USER_CONFIRMED';
  bills: { month: string; consumptionKwh: number; sourceState: 'SYNTHETIC' | 'USER_CONFIRMED' }[];
  policyVersion: number; updatedAt: string;
  meters?: EnergyMeter[]; readings?: EnergyReading[]; benefitPolicies?: TenantBenefitPolicy[];
}
