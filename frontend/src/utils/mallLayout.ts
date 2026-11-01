import type { MallShop } from '../types/commercial';
export const SHOP_COLORS = { active: '#2c946a', pending: '#edb743', eligible: '#559dd0', unconfigured: '#a8b3ad', issue: '#d5645b' };
export const mallShopLayout = (shops: MallShop[]) => shops.map(shop => {
  const peers = shops.filter(item => item.floor === shop.floor);
  const index = peers.findIndex(item => item.id === shop.id);
  return { shop, position: [((index % 4) - 1.5) * 4.5, (shop.floor - 1) * 3.6 + 0.45, index < 4 ? 3.5 : -3.5] as [number, number, number] };
});
