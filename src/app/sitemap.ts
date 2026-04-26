import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";
import { LEAGUES, NATIONS } from "@/lib/constants";

const BASE = "https://jerseydrop.co.il";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/leagues`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/nations`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/retro`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/israeli`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/kids`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/size-guide`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  const leagueRoutes: MetadataRoute.Sitemap = LEAGUES.map((l) => ({
    url: `${BASE}/leagues/${l.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const nationRoutes: MetadataRoute.Sitemap = NATIONS.map((n) => ({
    url: `${BASE}/nations/${n.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const products = getAllProducts();
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE}/products/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    // Boost priority slightly for products with active pricing or WC2026 tag
    priority: p.isWorldCup2026 ? 0.85 : 0.7,
  }));

  return [...staticRoutes, ...leagueRoutes, ...nationRoutes, ...productRoutes];
}
