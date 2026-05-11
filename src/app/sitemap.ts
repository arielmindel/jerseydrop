import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";
import { LEAGUES, NATIONS, SITE_URL } from "@/lib/constants";

const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/leagues`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/nations`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/retro`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/kids`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/shipping`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/returns`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/size-guide`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/size-chart`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/care-instructions`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/track-order`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/accessibility`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/collections/special`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/collections/surprise`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/collections/long-sleeve`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/collections/retro-90s`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
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
