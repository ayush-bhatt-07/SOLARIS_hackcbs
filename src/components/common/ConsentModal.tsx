import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';

export const ConsentModal: React.FC = () => {
  const { isConsentModalOpen, setIsConsentModalOpen, signUserConsent, currentUser } = useApp();
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [signerName, setSignerName] = useState(currentUser.name);
  const [isSigning, setIsSigning] = useState(false);

  if (!isConsentModalOpen) return null;

  const handleSign = () => {
    setIsSigning(true);
    setTimeout(() => {
      // Fire celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#006b57', '#f6bd4f', '#9af4d8', '#103d35']
        });
      } catch (e) {
        console.error(e);
      }
      signUserConsent();
      setIsSigning(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in-soft">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#c0c8c5]/40 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-[#103d35] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-[#f6bd4f]">draw</span>
            <div>
              <h3 className="font-headline font-bold text-base leading-tight">Member Consent Authorization</h3>
              <p className="text-[11px] text-[#7ca89d]">Delhi DERC Virtual Net Metering (VNM) Agreement</p>
            </div>
          </div>
          <button
            onClick={() => setIsConsentModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-[#1C2930]">
          
          {/* Summary Box */}
          <div className="p-3 bg-[#e8f6ff] rounded-xl border border-[#d6e5ee] space-y-1.5">
            <div className="flex items-center justify-between font-bold text-[#002620]">
              <span>Pod Allocation Summary</span>
              <span className="text-[#006b57]">Block C Rooftop Pod</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-[#687A80]">Participant Name:</span>
                <p className="font-semibold">{currentUser.name}</p>
              </div>
              <div>
                <span className="text-[#687A80]">Consumer CA:</span>
                <p className="font-semibold font-mono">#{currentUser.consumerNumber}</p>
              </div>
              <div>
                <span className="text-[#687A80]">Sanctioned Meter:</span>
                <p className="font-semibold">{currentUser.sanctionedLoadKw} kW (LT-1 Domestic)</p>
              </div>
              <div>
                <span className="text-[#687A80]">Proposed Share:</span>
                <p className="font-semibold text-[#006b57]">40.0% (5.6 kWp equivalent)</p>
              </div>
            </div>
          </div>

          {/* Legal Clauses */}
          <div className="space-y-2">
            <span className="font-bold text-[#002620] uppercase tracking-wider text-[11px] block">
              Statutory Declarations &amp; Terms
            </span>
            <div className="p-3 bg-[#f4faff] rounded-lg border border-[#e2f0f9] space-y-2 text-[#404846] leading-relaxed max-h-36 overflow-y-auto">
              <p>
                <strong>1. Virtual Net Metering Authorization:</strong> I hereby authorize Gulmohar Enclave RWA Block C Committee to aggregate my consumer account number with the group generation solar meter under BSES Rajdhani Power Limited (BRPL) jurisdiction.
              </p>
              <p>
                <strong>2. Credit Distribution:</strong> Generation credits will be apportioned pro-rata based upon the verified 100.0% reconciled algorithmic ledger in my monthly utility electricity bills.
              </p>
              <p>
                <strong>3. Structural Rooftop Grant:</strong> Common terrace roof area grant confirmed under RWA SGM Resolution 2024_03 with 82% member quorum.
              </p>
              <p>
                <strong>4. No Utility Representation:</strong> This document represents an internal cooperative consent agreement for discom filing, and does not replace official discom sanctioning orders.
              </p>
            </div>
          </div>

          {/* Digital Signature Input */}
          <div className="space-y-2 pt-1">
            <label className="font-bold text-[#002620] block text-[11px]">
              Full Legal Name for e-Sign Verification
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#c0c8c5] font-semibold text-[#101d24] focus:outline-none focus:border-[#006b57]"
            />
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="consentCheck"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 accent-[#006b57] rounded cursor-pointer"
              />
              <label htmlFor="consentCheck" className="text-[11px] text-[#404846] cursor-pointer">
                I accept the terms and authorize e-filing with BRPL regulatory desk.
              </label>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-3.5 bg-[#f4faff] border-t border-[#e2f0f9] flex items-center justify-end gap-2.5">
          <button
            onClick={() => setIsConsentModalOpen(false)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#404846] hover:bg-[#e2f0f9] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={!agreedTerms || !signerName.trim() || isSigning}
            className="px-5 py-2.5 rounded-lg bg-[#f6bd4f] text-[#271900] font-headline text-xs font-bold shadow-md hover:bg-[#ffdea7] disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {isSigning ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                <span>Authorizing e-Sign...</span>
              </>
            ) : (
              <>
                <span>Sign &amp; Commit Agreement</span>
                <span className="material-symbols-outlined text-[16px]">verified</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
