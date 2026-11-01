import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
  const { inviteMember } = useApp();
  
  const [flatNumber, setFlatNumber] = useState('Flat 401');
  const [tower, setTower] = useState('Tower D');
  const [ownerName, setOwnerName] = useState('Naveen Kashyap');
  const [caNumber, setCaNumber] = useState('102948671');
  const [sanctionedLoad, setSanctionedLoad] = useState(5.0);
  const [monthlyConsumption, setMonthlyConsumption] = useState(540);
  const [maxBudget, setMaxBudget] = useState(120000);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMember({
      flatNumber,
      tower,
      ownerName,
      caNumber,
      sanctionedLoadKw: Number(sanctionedLoad),
      monthlyConsumptionKwh: Number(monthlyConsumption),
      monthlyBillInr: Math.round(Number(monthlyConsumption) * 8.5),
      maxUpfrontBudgetInr: Number(maxBudget),
      allocatedKw: 0,
      allocationPercentage: 0,
      allocatedKwhPerMonth: 0,
      depositPaidInr: 0,
      status: 'pending_invite',
      consentSigned: false,
      tier: 'Tier B'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in-soft">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#c0c8c5]/40 flex flex-col">
        
        <div className="p-4 bg-[#103d35] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#9af4d8]">person_add</span>
            <h3 className="font-headline font-bold text-base">Invite Neighbor to Solar Pod</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-[#101d24] block mb-1">Flat / Unit</label>
              <input
                type="text"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                required
                className="w-full h-9 px-2.5 rounded-lg border border-[#c0c8c5] focus:outline-none focus:border-[#006b57]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#101d24] block mb-1">Tower / Wing</label>
              <input
                type="text"
                value={tower}
                onChange={(e) => setTower(e.target.value)}
                required
                className="w-full h-9 px-2.5 rounded-lg border border-[#c0c8c5] focus:outline-none focus:border-[#006b57]"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#101d24] block mb-1">Owner / Resident Full Name</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
              className="w-full h-9 px-2.5 rounded-lg border border-[#c0c8c5] focus:outline-none focus:border-[#006b57]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-[#101d24] block mb-1">BSES CA Number</label>
              <input
                type="text"
                value={caNumber}
                onChange={(e) => setCaNumber(e.target.value)}
                required
                className="w-full h-9 px-2.5 rounded-lg border border-[#c0c8c5] font-mono focus:outline-none focus:border-[#006b57]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#101d24] block mb-1">Sanctioned Load (kW)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="20"
                value={sanctionedLoad}
                onChange={(e) => setSanctionedLoad(Number(e.target.value))}
                required
                className="w-full h-9 px-2.5 rounded-lg border border-[#c0c8c5] focus:outline-none focus:border-[#006b57]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold text-[#101d24] block mb-1">Avg Units (kWh/mo)</label>
              <input
                type="number"
                min="100"
                max="3000"
                value={monthlyConsumption}
                onChange={(e) => setMonthlyConsumption(Number(e.target.value))}
                required
                className="w-full h-9 px-2.5 rounded-lg border border-[#c0c8c5] focus:outline-none focus:border-[#006b57]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#101d24] block mb-1">Upfront Budget (₹)</label>
              <input
                type="number"
                step="5000"
                min="20000"
                max="500000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                required
                className="w-full h-9 px-2.5 rounded-lg border border-[#c0c8c5] focus:outline-none focus:border-[#006b57]"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#e8f6ff] text-[11px] text-[#404846]">
            New member will receive an automated invitation link to verify their meter and digitally sign consent.
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#404846] hover:bg-[#e2f0f9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#006b57] text-white font-headline text-xs font-bold shadow-md hover:bg-[#002620] transition-colors"
            >
              Add to Cohort
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
