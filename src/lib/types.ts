import type { LeagueId, NationTier, Size } from "./constants";

export type ProductCategory = "national" | "club" | "retro" | "suit" | "cotton";
export type ProductType = "home" | "away" | "third" | "goalkeeper" | "special";
export type ProductVersion = "fan" | "player" | "retro";
export type StockStatus = "in-stock" | "low" | "preorder";

export type Product = {
  id: string;
  slug: string;
  nameHe: string;
  nameEn: string;
  category: ProductCategory;
  team: string;
  teamSlug: string;
  league?: LeagueId;
  nation?: string;
  nationTier?: NationTier;
  season: string;
  type: ProductType;
  versions: ProductVersion[];
  priceFan: number;
  pricePlayer: number;
  priceRetro?: number;
  originalPrice?: number;
  images: string[];
  sizes: Size[];
  customizable: boolean;
  tags: string[];
  stock: StockStatus;
  featured?: boolean;
};
