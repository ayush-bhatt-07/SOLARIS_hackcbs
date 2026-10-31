import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const shops = Array.from({ length: 24 }, (_, index) => ({
  id: `shop-${index + 1}`,
  name: `Shop ${String(index + 1).padStart(2, '0')}`,
  floor: Math.floor(index / 8) + 1,
  meterId: `meter-shop-${index + 1}`,
  tenantUserId: `user-shop-tenant-${(index % 4) + 1}`,
  monthlyConsumptionKwh: 4200 + (index % 6) * 380,
  benefitStatus: (['active', 'pending', 'eligible', 'unconfigured', 'issue'][index % 5])
}));

const bills = Array.from({ length: 12 }, (_, monthIndex) => ({
  billingMonth: `2026-${String(monthIndex + 1).padStart(2, '0')}`,
  meterId: 'meter-main-sunrise-mall',
  consumptionKwh: 132000 + monthIndex * 2100,
  tariffInrPerKwh: 9.2,
  fixedChargesInr: 18000,
  demandChargesInr: 42000,
  sourceState: 'SYNTHETIC'
}));

const seed = {
  synthetic: true,
  generatedFor: 'Solaris 2.0 Hackathon MVP',
  property: { id: 'property-sunrise-mall', name: 'Sunrise Mall', location: 'Delhi' },
  meters: [
    { id: 'meter-main-sunrise-mall', type: 'MAIN_DISCOM', accountRef: 'SYN-MAIN-001' },
    ...shops.map((shop) => ({ id: shop.meterId, type: 'SHOP_SUBMETER', shopId: shop.id, accountRef: `SYN-${shop.id.toUpperCase()}` }))
  ],
  shops,
  bills,
  candidateCapacitiesKwp: [100, 200, 300],
  installers: [
    { id: 'installer-sun-grid', name: 'SunGrid Delhi (Demo)', serviceAreas: ['Delhi'], maxCapacityKwp: 350 },
    { id: 'installer-horizon', name: 'Solar Horizon Works (Demo)', serviceAreas: ['South Delhi'], maxCapacityKwp: 220 },
    { id: 'installer-green-crest', name: 'Green Crest EPC (Demo)', serviceAreas: ['NCR'], maxCapacityKwp: 500 }
  ]
};

const outputDirectory = join(process.cwd(), 'server', 'seed');
mkdirSync(outputDirectory, { recursive: true });
const outputPath = join(outputDirectory, 'demo-data.json');
writeFileSync(outputPath, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
console.log(`Wrote reproducible synthetic seed to ${outputPath}`);
