import React from 'react';

const portfolio = [
  { name: 'Residential cluster', capacity: '32 kWp', status: 'Commissioning', city: 'South Delhi' },
  { name: 'Industrial rooftop', capacity: '150 kWp', status: 'Quoted', city: 'Faridabad' },
  { name: 'Mall retrofit', capacity: '260 kWp', status: 'Design', city: 'Bawana' }
];

export const InstallerPage: React.FC = () => {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-16 pt-2">
      <div className="rounded-2xl border border-[#e2f0f9] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#006b57]">Installer portal</span>
            <h1 className="font-headline mt-1 text-2xl font-bold text-[#002620]">Project delivery and quotations</h1>
          </div>
          <span className="rounded-full bg-[#fff3d1] px-2 py-1 text-[10px] font-bold text-[#271900]">Organisation-based access</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#e2f0f9] bg-[#e8f6ff] p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[#404846]">Service areas</div>
          <div className="mt-2 font-headline text-2xl font-bold text-[#002620]">Delhi + NCR</div>
        </div>
        <div className="rounded-2xl border border-[#e2f0f9] bg-[#e8f6ff] p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[#404846]">Supported capacity</div>
          <div className="mt-2 font-headline text-2xl font-bold text-[#002620]">Up to 500 kWp</div>
        </div>
        <div className="rounded-2xl border border-[#e2f0f9] bg-[#e8f6ff] p-4 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[#404846]">Open enquiries</div>
          <div className="mt-2 font-headline text-2xl font-bold text-[#002620]">07</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e2f0f9] bg-white p-4 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#717976]">Portfolio</span>
        <div className="mt-4 space-y-3">
          {portfolio.map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-xl border border-[#d6e5ee] bg-[#f4faff] p-3">
              <div>
                <div className="text-sm font-bold text-[#002620]">{item.name}</div>
                <div className="text-[10px] text-[#404846]">{item.city}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#9af4d8] px-2 py-1 text-[10px] font-bold text-[#006b57]">{item.capacity}</span>
                <span className="rounded-full bg-[#fff3d1] px-2 py-1 text-[10px] font-bold text-[#271900]">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
