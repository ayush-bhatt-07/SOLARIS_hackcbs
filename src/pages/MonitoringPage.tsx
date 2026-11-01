import React from 'react';
import { MAINTENANCE_TICKETS } from '../data/mockData';

export const MonitoringPage: React.FC = () => {
  return (
    <div className="flex flex-col w-full pb-16 max-w-4xl mx-auto px-4 space-y-4 fade-in-soft">
      <div className="pt-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#9af4d8]/60 text-[#00725d] text-xs font-semibold mb-1">
          <span className="material-symbols-outlined text-[14px]">query_stats</span>
          <span>Synthetic O&amp;M Panel</span>
        </div>
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-[#002620]">
          Plant Operations &amp; Maintenance
        </h1>
        <p className="text-xs sm:text-sm text-[#404846] mt-0.5">
          Illustrative O&amp;M snapshot using synthetic data. No live inverter or DISCOM integration.
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e2f0f9] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006b57] text-[20px]">monitor_heart</span>
            <h2 className="font-headline text-sm font-bold text-[#002620]">Synthetic Plant Health Snapshot</h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#ca962b]">Illustrative only</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-[#f8faf7] rounded-lg border border-[#e2f0f9]">
            <span className="text-[10px] text-[#717976] block">Inverter Status</span>
            <span className="font-headline text-sm font-bold text-[#006b57] flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#006b57] animate-pulse"></span> Online
            </span>
            <span className="text-[10px] text-[#717976]">Grid-Tied · 50.02 Hz</span>
          </div>

          <div className="p-3 bg-[#f8faf7] rounded-lg border border-[#e2f0f9]">
            <span className="text-[10px] text-[#717976] block">Current Output</span>
            <span className="font-headline text-base font-bold text-[#002620] mt-0.5 block font-mono">8.92 kW</span>
            <span className="text-[10px] text-[#006b57] font-semibold">74% of 12 kWp</span>
          </div>

          <div className="p-3 bg-[#f8faf7] rounded-lg border border-[#e2f0f9]">
            <span className="text-[10px] text-[#717976] block">Today's Generation</span>
            <span className="font-headline text-base font-bold text-[#002620] mt-0.5 block font-mono">48.2 kWh</span>
            <span className="text-[10px] text-[#ca962b] font-semibold">Irradiance 5.2 kWh/m²</span>
          </div>

          <div className="p-3 bg-[#f8faf7] rounded-lg border border-[#e2f0f9]">
            <span className="text-[10px] text-[#717976] block">Performance Ratio</span>
            <span className="font-headline text-base font-bold text-[#006b57] mt-0.5 block font-mono">82.4%</span>
            <span className="text-[10px] text-[#717976]">Baseline 80.0%</span>
          </div>
        </div>

        <div className="p-3 bg-[#f8faf7] rounded-lg border border-[#e2f0f9] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#717976]">Expected vs Actual (Today)</span>
            <span className="font-mono font-bold text-[#002620]">50.0 / 48.2 kWh · 96.4%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#717976]">Grid Availability</span>
            <span className="font-mono font-bold text-[#006b57]">99.4%</span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#002620] block">Synthetic Maintenance Alerts</span>
          {MAINTENANCE_TICKETS.slice(0, 2).map((ticket) => (
            <div
              key={ticket.id}
              className="p-3 bg-[#f8faf7] rounded-lg border border-[#e2f0f9] flex items-start justify-between gap-2 text-xs cursor-pointer hover:border-[#006b57]/40 transition-colors"
            >
              <div>
                <span className="font-bold text-[#002620] block">{ticket.title}</span>
                <span className="text-[10px] text-[#717976]">
                  {ticket.component} · Reported {ticket.reportedDate}
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                  ticket.status === 'resolved'
                    ? 'bg-[#9af4d8] text-[#00725d]'
                    : ticket.status === 'investigating'
                    ? 'bg-[#ffdea7] text-[#271900]'
                    : 'bg-[#dceaf4] text-[#002620]'
                }`}
              >
                {ticket.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
