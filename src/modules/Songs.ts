import Shop from "../assets/shop.json";
// js typings & data retrival
export type Shop = ShopItem[];

export interface ShopItem {
  id: string;
  name: string;
  subtitle?: string;
  imageUrl: string;
  enabledUs: boolean;
  enabledEu: boolean;
  enabledIn: boolean;
  enabledXx: boolean;
  enabledCa: boolean;
  priceUs: number;
  priceGlobal: number;
  fulfilledAtEnd: boolean;
  comingSoon: boolean;
  outOfStock: boolean;
}

export function getShop(): Shop {
  return Shop;
}
export function getShopItem(id: string): ShopItem {
  return Shop.find((e) => e.id === id);
}

export function searchShop(query: string): ShopItem[] {
  return Shop.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()));
  // return Shop.filter(e => e.name.toLowerCase().includes(query.toLowerCase()));
}
