import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InviteModal } from '../components/common/InviteModal';
import { ReportExportModal } from '../components/common/ReportExportModal';

export const CommunityPage: React.FC = () => {
  const { community, navigateTo, setIsConsentModalOpen, toggleMemberConsent } = useApp();
  const [activeTab, setActiveTab] = useState<'roster' | 'governance' | 'timeline'>('roster');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Calculate capitalization stats from live members
  const fundedPercentage = Math.min(100, Math.round((community.totalCommittedInr / community.netTargetInr) * 1000) / 10);
  const signedCount = community.members.filter(m => m.consentSigned).length;
  const eligibleFlats = Math.max(community.totalEligibleFlats, community.members.length);
  const signedPercentage = Math.min(100, Math.round((signedCount / Math.max(1, eligibleFlats)) * 100));

  return (
    <div className="flex flex-col w-full pb-16 max-w-3xl mx-auto px-4 space-y-4 fade-in-soft">
      
      {/* Ambient Banner */}
      <div className="pt-2">
        <div className="relative overflow-hidden rounded-xl bg-[#002620] text-white p-4 shadow-md">
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-[#006b57]/30 blur-2xl pointer-events-none"></div>
          <div className="absolute right-4 bottom-2 text-white/5 select-none pointer-events-none">
            <span className="material-symbols-outlined text-[96px] leading-none">solar_power</span>
          </div>

          <div className="relative z-10 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#006b57] text-white text-[10px] font-bold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9af4d8] animate-pulse"></span>
                ACTIVE COHORT
              </span>
              <span className="text-[11px] text-[#dceaf4] bg-[#103d35] px-2.5 py-0.5 rounded-full font-mono">
                DERC VNM · 2024
              </span>
            </div>

            <div>
              <h1 className="font-headline text-xl sm:text-2xl font-bold tracking-tight">
                {community.name}
              </h1>
              <p className="text-xs text-[#dceaf4] flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[16px] text-[#f6bd4f]">location_on</span>
                {community.location}
              </p>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full bg-[#9af4d8] flex items-center justify-center text-[#002019] shrink-0">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-white font-medium truncate">{community.coordinatorName}</span>
                <span className="text-[10px] text-[#7ca89d] truncate">{community.coordinatorRole}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics & Funding Progress */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2f0f9] space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#404846] font-bold">
              Community Pod Capitalization
            </span>
            <p className="font-headline text-sm font-bold text-[#101d24]">Phase 3: Member Consent</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#9af4d8] text-[#00725d]">
            {fundedPercentage}% Funded
          </span>
        </div>

        {/* Financial Progress Meter */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline text-xs font-mono">
            <span className="text-[#101d24] font-bold">
              ₹{community.totalCommittedInr.toLocaleString('en-IN')} <span className="text-[#404846] font-normal">committed</span>
            </span>
            <span className="text-[#404846]">
              Net Target: <strong className="text-[#101d24]">₹{community.netTargetInr.toLocaleString('en-IN')}</strong>
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-[#dceaf4] overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#006b57] to-[#f6bd4f] transition-all duration-700 ease-out" 
              style={{ width: `${fundedPercentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-[#404846] pt-0.5">
            <span className="flex items-center gap-1 font-semibold text-[#002620]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006b57]"></span> {signedCount} of {eligibleFlats} Flats Committed ({signedPercentage}%)
            </span>
            <span className="italic text-[#ca962b]">Subsidy applied: ₹{community.subsidyEligibleInr.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Quick Numbers Bento Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-[#e8f6ff] p-2.5 rounded-lg flex flex-col border border-[#d6e5ee]">
            <span className="text-[11px] text-[#404846]">System Size</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-headline text-lg font-bold text-[#002620]">{community.proposedCapacityKw}</span>
              <span className="text-xs text-[#404846]">kWp</span>
            </div>
            <span className="text-[10px] text-[#404846]/80 mt-0.5">Potential: 18.5 kWp</span>
          </div>
          <div className="bg-[#e8f6ff] p-2.5 rounded-lg flex flex-col border border-[#d6e5ee]">
            <span className="text-[11px] text-[#404846]">Gross Outlay</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-headline text-lg font-bold text-[#002620]">
                ₹{(community.grossOutlayInr / 100000).toFixed(2)}
              </span>
              <span className="text-xs text-[#404846]">Lacs</span>
            </div>
            <span className="text-[10px] text-[#006b57] font-semibold mt-0.5">DERC Net Model</span>
          </div>
        </div>
      </div>

{/* Segmented Navigation */}
      <div className="p-1 rounded-xl bg-[#e2f0f9] flex items-center justify-between text-center" role="tablist" aria-label="Community workspace sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'roster'}
          onClick={() => setActiveTab('roster')}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
            activeTab === 'roster'
              ? 'bg-white text-[#002620] shadow-sm'
              : 'text-[#404846] hover:text-[#002620]'
          }`}
        >
          Roster & Shares
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'governance'}
          onClick={() => setActiveTab('governance')}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
            activeTab === 'governance'
              ? 'bg-white text-[#002620] shadow-sm'
              : 'text-[#404846] hover:text-[#002620]'
          }`}
        >
          Agreements
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'timeline'}
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2 ${
            activeTab === 'timeline'
              ? 'bg-white text-[#002620] shadow-sm'
              : 'text-[#404846] hover:text-[#002620]'
          }`}
        >
          Timeline
        </button>
      </div>

      {/* TAB 1: Roster & Allocation */}
      {activeTab === 'roster' && (
        <div className="space-y-3 fade-in-soft">
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#006b57]">groups</span>
              <h2 className="font-headline text-sm font-bold text-[#101d24]">Member Allocations</h2>
            </div>
            <span className="text-xs text-[#404846] font-mono">Pod 3 Quota ({community.members.length} Units)</span>
          </div>

          <div className="space-y-2.5">
            {community.members.slice(0, 4).map((member) => (
              <button
                type="button"
                key={member.id}
                onClick={() => toggleMemberConsent(member.id)}
                className="bg-white rounded-xl p-3.5 shadow-sm border border-[#e2f0f9] space-y-2.5 w-full text-left hover:border-[#006b57]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#9af4d8]/60 text-[#006b57] flex items-center justify-center font-bold text-xs">
                      {member.flatNumber.replace('Flat ', '')}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-headline text-xs sm:text-sm font-bold text-[#101d24]">
                          {member.flatNumber} ({member.tower})
                        </span>
                      </div>
                      <span className="text-[11px] text-[#404846]">
                        {member.ownerName} · CA #{member.caNumber}
                      </span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    member.consentSigned
                      ? 'bg-[#9af4d8] text-[#00725d]'
                      : 'bg-[#ffdea7] text-[#271900]'
                  }`}>
                    <span className="material-symbols-outlined text-[12px]">
                      {member.consentSigned ? 'check_circle' : 'hourglass_top'}
                    </span>
                    {member.consentSigned ? 'Signed & Deposited' : 'KYC / Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 bg-[#e8f6ff] p-2 rounded-lg border border-[#d6e5ee]">
                  <div>
                    <span className="text-[10px] text-[#404846] font-medium">Target Solar Share</span>
                    <p className="text-xs font-bold text-[#002620]">
                      {member.allocationPercentage > 0 ? `${member.allocationPercentage}%` : 'Pending Lock'}{' '}
                      {member.allocatedKw > 0 && <span className="font-normal text-[#404846] text-[10px]">({member.allocatedKw} kWp)</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#404846] font-medium">Deposit Transferred</span>
<p className="text-xs font-bold text-[#006b57] font-mono">
                       {member.depositPaidInr > 0 ? `₹${member.depositPaidInr.toLocaleString('en-IN')}` : 'Escrow Allocated'}
                     </p>
                   </div>
                 </div>
               </button>
             ))}

            {/* Invite Button Card */}
            <div className="rounded-xl p-4 bg-[#e2f0f9]/50 border border-dashed border-[#c0c8c5] flex flex-col items-center justify-center text-center space-y-2 py-4">
              <div className="w-9 h-9 rounded-full bg-[#d6e5ee] flex items-center justify-center text-[#404846]">
                <span className="material-symbols-outlined text-[18px]">person_add</span>
              </div>
              <div className="max-w-xs">
                <span className="text-xs font-bold text-[#101d24]">Pending Invites Available</span>
                <p className="text-[11px] text-[#404846] mt-0.5">
                  Room for additional units or surplus capacity rebalancing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteOpen(true)}
                className="mt-1 px-4 py-2 rounded-lg bg-white text-[#006b57] text-xs font-bold hover:bg-[#e8f6ff] transition-all flex items-center gap-1.5 shadow-sm active:scale-95 border border-[#e2f0f9]"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Invite Neighbor / Flat Owner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Statutory & Legal */}
      {activeTab === 'governance' && (
        <div className="space-y-3 fade-in-soft">
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#006b57]">fact_check</span>
              <h2 className="font-headline text-sm font-bold text-[#101d24]">Agreement &amp; approval records</h2>
            </div>
            <span className="text-xs text-[#006b57] font-semibold">2 of 3 recorded</span>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2f0f9] space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#9af4d8] text-[#00725d] flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#101d24]">RWA SGM Resolution</h3>
                  <span className="text-[11px] font-bold text-[#006b57]">Passed (82%)</span>
                </div>
                <p className="text-xs text-[#404846] mt-0.5">
                  Special General Meeting quorum achieved for common roof grant under Bye-Law 14(b).
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#e8f6ff] text-[#404846] text-[11px] font-mono inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">description</span> SGM_Res_2024_03.pdf
                  </span>
                </div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-[#e2f0f9]"></div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#9af4d8] text-[#00725d] flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[18px]">gavel</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#101d24]">Terrace Access Agreement</h3>
                  <span className="text-[11px] font-bold text-[#006b57]">Executed</span>
                </div>
                <p className="text-xs text-[#404846] mt-0.5">
                  Signed between Gulmohar BMC &amp; Pod 3 Members for uninterrupted structural access &amp; maintenance.
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#e8f6ff] text-[#404846] text-[11px] font-mono inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">lock</span> BMC_Annexure_B.pdf
                  </span>
                </div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-[#e2f0f9]"></div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ffdea7] text-[#271900] flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[18px]">edit_document</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#101d24]">BRPL Form A-VNM Draft</h3>
                  <span className="text-[11px] font-bold text-[#ca962b]">Pending Signature</span>
                </div>
                <p className="text-xs text-[#404846] mt-0.5">
                  DISCOM submission bundle prepared with all aggregated CA numbers and flat allotment matrices.
                </p>
<div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setIsConsentModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#9af4d8] text-[#006b57] text-xs font-bold hover:bg-[#006b57] hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
                  >
                    Review Draft & Sign e-KYC
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-3 fade-in-soft">
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#006b57]">timeline</span>
              <h2 className="font-headline text-sm font-bold text-[#101d24]">Audit Trail &amp; Alerts</h2>
            </div>
            <span className="text-xs text-[#404846]">Activity log</span>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2f0f9] space-y-3">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-[#103d35] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[15px]">engineering</span>
                </div>
                <div className="w-0.5 h-full bg-[#dceaf4] my-1"></div>
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101d24]">BSES Feeder Verification Scheduled</span>
                  <span className="text-[10px] text-[#717976]">Today, 09:20 AM</span>
                </div>
                <p className="text-xs text-[#404846] mt-0.5">
                  Site inspector appointment confirmed for local transformer capacity audit on Friday, 11:00 AM.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-[#9af4d8] text-[#00725d] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[15px]">savings</span>
                </div>
                <div className="w-0.5 h-full bg-[#dceaf4] my-1"></div>
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101d24]">MNRE Central Subsidy Batch Opened</span>
                  <span className="text-[10px] text-[#717976]">Yesterday</span>
                </div>
                <p className="text-xs text-[#404846] mt-0.5">
                  PM Surya Ghar portal allocation quota assigned under Batch #2 for Delhi East circle.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-[#dceaf4] text-[#404846] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[15px]">group_add</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#101d24]">Flat 204 Deposit Confirmed</span>
                  <span className="text-[10px] text-[#717976]">2 days ago</span>
                </div>
                <p className="text-xs text-[#404846] mt-0.5">
                  Escrow contribution of ₹1,44,200 received via Axis RWA Escrow Pool.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rooftop Site Snapshot Preview Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2f0f9] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#f6bd4f]">roofing</span>
            <h2 className="font-headline text-sm font-bold text-[#101d24]">Designated Roof Envelope</h2>
          </div>
          <span className="text-xs text-[#006b57] font-semibold">Block C Terrace (1,840 sq.ft)</span>
        </div>

        <div className="relative w-full h-36 rounded-lg overflow-hidden border border-[#c0c8c5]/30">
          <img 
            alt="Aerial view of rooftop solar installation" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFTWUPLIcFwouasknzrb0ywUOsIM1dTjAnsMKK73QtPZnU5ZElWH0f1ABCirbjnHAHbR4gqksOffSS_U05gime5LR5YG_0LB-bkGmi3LULXbNPVmeKL0Er1FrXsbRxCqQzrIPMUwxu5HqG_RQ4yspTS3yMly3Vnnd0ltbcwcQpb6NJ7_EGMM5e-PWV8d2EugcTZHUf7oKePkjHPPg1CvhL6oyB-NQptU1TdeH6e7gAPlgdb6EH8xrEOA"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#002620]/80 via-transparent to-transparent"></div>
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-1 text-[11px] font-medium">
              <span className="material-symbols-outlined text-[14px] text-[#f6bd4f]">wb_sunny</span>
              Daily Yield: ~62.4 kWh avg
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#002620]/80 backdrop-blur-sm text-white font-semibold">
              Shadow-Free: 94%
            </span>
          </div>
        </div>
      </div>

      {/* Advisory Note */}
      <div className="p-3.5 rounded-xl bg-[#e8f6ff] flex items-start gap-2.5 border border-[#d6e5ee]">
        <span className="material-symbols-outlined text-[20px] text-[#006b57] shrink-0 mt-0.5">info</span>
        <div className="space-y-1">
          <span className="text-xs font-bold text-[#101d24]">Where Solaris stops</span>
          <p className="text-xs text-[#404846] leading-relaxed">
            Community membership confirms internal investment and allocation agreement. Final electricity credit settlement is executed exclusively by BSES Rajdhani via monthly billing adjustment under Delhi VNM Regulations.
          </p>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="pt-2 space-y-2.5">
        <button
          type="button"
          onClick={() => navigateTo('/credit-allocation')}
          className="w-full h-12 rounded-lg bg-[#006b57] text-white font-headline text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#002620] transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
        >
          <span>Review credit reconciliation</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>
        <button
          type="button"
          onClick={() => setIsExportOpen(true)}
          className="w-full h-11 rounded-lg bg-white text-[#101d24] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm border border-[#e2f0f9] hover:bg-[#f4faff] transition-all focus:outline-none focus:ring-2 focus:ring-[#9af4d8]/60 focus:ring-offset-2"
        >
          <span className="material-symbols-outlined text-[18px] text-[#006b57]">picture_as_pdf</span>
          <span>Export Community Proposal (PDF)</span>
        </button>
      </div>

      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      <ReportExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} defaultReportType="community" />

    </div>
  );
};
