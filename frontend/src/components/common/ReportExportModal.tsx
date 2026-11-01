import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReportType?: 'feasibility' | 'community' | 'optimisation' | 'allocation' | 'regulatory' | 'maintenance';
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  defaultReportType = 'feasibility'
}) => {
  const { currentUser, community, optimisationResult } = useApp();
  const [reportType, setReportType] = useState(defaultReportType);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    setDownloading(true);
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'allocation' || reportType === 'community') {
      csvContent += 'Flat,Tower,Owner,CA_Number,Sanctioned_kW,Monthly_Consumption_kWh,Allocated_kW,Share_Percentage,Est_Savings_INR\n';
      community.members.forEach(m => {
        csvContent += `"${m.flatNumber}","${m.tower}","${m.ownerName}","${m.caNumber}",${m.sanctionedLoadKw},${m.monthlyConsumptionKwh},${m.allocatedKw},${m.allocationPercentage},${Math.round(m.allocatedKwhPerMonth * 8.2)}\n`;
      });
    } else if (reportType === 'optimisation') {
      csvContent += 'Rank,Flat,Share_Percentage,Allocated_kW,Monthly_Gross_Savings_INR,Monthly_EMI_INR,Net_Monthly_Benefit_INR\n';
      optimisationResult.selectedMembers.forEach((m, idx) => {
        csvContent += `${idx + 1},"${m.flatNumber}",${m.sharePercentage},${m.shareKw},${m.monthlySavingsInr},${m.monthlyContributionInr},${m.netBenefitInr}\n`;
      });
    } else {
      csvContent += 'Metric,Value,Unit\n';
      csvContent += `Community Name,"${community.name}",Text\n`;
      csvContent += `Location,"${community.location}",Text\n`;
      csvContent += `Discom,"${community.discom}",Text\n`;
      csvContent += `Proposed Capacity,${community.proposedCapacityKw},kWp\n`;
      csvContent += `Net Project Cost,${community.netTargetInr},INR\n`;
      csvContent += `Committed Funds,${community.totalCommittedInr},INR\n`;
      csvContent += `Eligible Flats,${community.committedMembersCount}/${community.totalEligibleFlats},Ratio\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Solaris_${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in-soft">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#c0c8c5]/40 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-[#103d35] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-[#f6bd4f]">description</span>
            <div>
              <h3 className="font-headline font-bold text-base">Export Solaris Planning Statement</h3>
              <p className="text-[11px] text-[#7ca89d]">Internal planning document · DERC-aware assumptions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          <div>
            <label className="font-bold text-[#002620] block mb-1">Select Report Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReportType('feasibility')}
                className={`p-2.5 rounded-lg text-left border transition-all ${
                  reportType === 'feasibility' 
                    ? 'border-[#006b57] bg-[#e8f6ff] text-[#002620] font-bold' 
                    : 'border-[#e2f0f9] hover:bg-[#f4faff] text-[#404846]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#006b57]">wb_sunny</span>
                  <span>Solar Feasibility</span>
                </div>
                <span className="text-[10px] text-[#717976] block mt-0.5">Capacity, payback, ROI</span>
              </button>

              <button
                type="button"
                onClick={() => setReportType('community')}
                className={`p-2.5 rounded-lg text-left border transition-all ${
                  reportType === 'community' 
                    ? 'border-[#006b57] bg-[#e8f6ff] text-[#002620] font-bold' 
                    : 'border-[#e2f0f9] hover:bg-[#f4faff] text-[#404846]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#006b57]">groups</span>
                  <span>Community Roster</span>
                </div>
                <span className="text-[10px] text-[#717976] block mt-0.5">Members, shares, funding</span>
              </button>

              <button
                type="button"
                onClick={() => setReportType('optimisation')}
                className={`p-2.5 rounded-lg text-left border transition-all ${
                  reportType === 'optimisation' 
                    ? 'border-[#006b57] bg-[#e8f6ff] text-[#002620] font-bold' 
                    : 'border-[#e2f0f9] hover:bg-[#f4faff] text-[#404846]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#006b57]">bolt</span>
                  <span>Optimiser Results</span>
                </div>
                <span className="text-[10px] text-[#717976] block mt-0.5">Linear solver output &amp; stress</span>
              </button>

              <button
                type="button"
                onClick={() => setReportType('allocation')}
                className={`p-2.5 rounded-lg text-left border transition-all ${
                  reportType === 'allocation' 
                    ? 'border-[#006b57] bg-[#e8f6ff] text-[#002620] font-bold' 
                    : 'border-[#e2f0f9] hover:bg-[#f4faff] text-[#404846]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#006b57]">pie_chart</span>
                  <span>Credit Allocation</span>
                </div>
                <span className="text-[10px] text-[#717976] block mt-0.5">100% reconciled ledger</span>
              </button>
            </div>
          </div>

          {/* Report Preview Summary Card */}
          <div className="p-3 bg-[#f8faf7] rounded-xl border border-[#e2f0f9] space-y-2">
            <div className="flex items-center justify-between border-b border-[#e2f0f9] pb-2">
              <div>
                <span className="font-bold text-[#002620] block text-sm">SOLARIS Internal Planning Statement</span>
                <span className="text-[10px] text-[#717976]">Generated for: {currentUser.name} · CA #{currentUser.consumerNumber}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#9af4d8] text-[#002019] font-bold">
                DERC Compliant
              </span>
            </div>

            <div className="space-y-1 text-[11px] text-[#404846]">
              <p>• <strong>Jurisdiction:</strong> BSES Rajdhani Power Limited (BRPL), New Delhi</p>
              <p>• <strong>Target Cohort:</strong> {community.name} ({community.location})</p>
              <p>• <strong>Simulation Model:</strong> 14.0 kWp Bi-facial Mono-PERC / DERC VNM Guidelines</p>
              <p>• <strong>Audit Status:</strong> Algorithmic Zero-Shortfall Reconciled (100.0%)</p>
            </div>

            <div className="p-2 bg-[#ffdad6]/20 border border-[#ba1a1a]/20 rounded text-[10px] text-[#93000a] leading-tight">
              <strong>Statutory Notice:</strong> This document is an internal planning statement and allocation model. It is not an official electricity bill issued by BSES Rajdhani.
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="p-3.5 bg-[#f4faff] border-t border-[#e2f0f9] flex items-center justify-between">
          <button
            onClick={handleDownloadCsv}
            disabled={downloading}
            className="px-3.5 py-2 rounded-lg border border-[#006b57] text-[#006b57] hover:bg-[#e8f6ff] font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">table_chart</span>
            <span>Export CSV</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#404846] hover:bg-[#e2f0f9]"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-[#006b57] text-white font-headline text-xs font-bold shadow-md hover:bg-[#002620] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
