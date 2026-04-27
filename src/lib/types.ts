import type { Size as DefaultSize } from "./constants";

export type ProductCategory = "national" | "club";
export type ProductType =
  | "home"
  | "away"
  | "third"
  | "goalkeeper"
  | "special"
  | "retro";
export type ProductVersion = "fan" | "player" | "retro";
export type StockStatus = "in-stock" | "low" | "preorder";

/**
 * The `league` field is overloaded in the source catalog:
 * - For category=club it holds an actual league id (premier-league, …, israel)
 * - For category=national it holds a tier slug (tier-1 / tier-2 / tier-3)
 */
export type ProductLeague =
  | "premier-league"
  | "la-liga"
  | "serie-a"
  | "bundesliga"
  | "ligue-1"
  | "other"
  | "israel"
  | "tier-1"
  | "tier-2"
  | "tier-3";

/**
 * Some catalog rows have garbage size strings ("כן" etc.) — keep size as
 * string here so we don't reject valid imports. UI components fall back to
 * a generic message when the size list is malformed.
 */
export type ProductSize = DefaultSize | string;

export type Product = {
  id: string;
  sourceHandle: string;
  sourceUrl: string;
  slug: string;
  nameHe: string;
  nameEn: string;
  category: ProductCategory;
  league: ProductLeague;
  team: string;
  teamSlug: string;
  season: string | null;
  type: ProductType;
  isRetro: boolean;
  isKids: boolean;
  isWorldCup2026: boolean;
  isSpecial: boolean;
  isLongSleeve: boolean;
  /** Short-suit (matching shirt+shorts kit). Set when catalog === "short-suit". */
  isShortSuit?: boolean;
  /** Hebrew color label extracted from yupoo title (e.g. "ירוק"). */
  colorHe?: string | null;
  /** Original Chinese title from the supplier — INTERNAL, never display. */
  sourceHandleCn?: string;
  priceFan: number | null;
  pricePlayer: number | null;
  priceRetro: number | null;
  originalPrice: number | null;
  sizes: ProductSize[];
  images: string[];
  /** Backup local filenames — not used for rendering yet (Shopify CDN is primary). */
  imagesLocal?: string[];
  tags: string[];
  description: string;
  stock: StockStatus;
  /** INTERNAL — never display. Reference values from the source supplier. */
  sourcePriceMin: number | null;
  /** INTERNAL — never display. */
  sourcePriceMax: number | null;
};
