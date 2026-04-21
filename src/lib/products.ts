import productsJson from "@/data/products.json";
import type { Product, ProductVersion } from "./types";
import { CUSTOMIZATION_FEE } from "./constants";

export const products: Product[] = productsJson as Product[];

export function getAllProducts(): Product[] {
  return products;
}

export function getFeaturedProducts(limit = 8): Product[] {
  return products.filter((p) => p.featured).slice(0, limit);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByLeague(leagueSlug: string): Product[] {
  return products.filter((p) => p.league === leagueSlug);
}

export function getProductsByNation(nationSlug: string): Product[] {
  return products.filter((p) => p.nation === nationSlug);
}

export function getProductsByCategory(category: Product["category"]): Product[] {
  return products.filter((p) => p.category === category);
}

export function getRelatedProducts(product: Product, limit = 6): Product[] {
  const pool = products.filter((p) => p.id !== product.id);
  const sameGroup = pool.filter((p) =>
    product.league
      ? p.league === product.league
      : p.nation === product.nation,
  );
  const picks = [...sameGroup];
  if (picks.length < limit) {
    const filler = pool.filter((p) => !sameGroup.includes(p));
    picks.push(...filler);
  }
  return picks.slice(0, limit);
}

export function priceFor(product: Product, version: ProductVersion): number {
  if (version === "retro" && product.priceRetro) return product.priceRetro;
  if (version === "player") return product.pricePlayer;
  return product.priceFan;
}

export function totalWithCustomization(
  base: number,
  hasCustomization: boolean,
): number {
  return base + (hasCustomization ? CUSTOMIZATION_FEE : 0);
}
