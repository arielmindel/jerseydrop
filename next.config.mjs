/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Bypass Vercel's Image Optimization pipeline globally. Product images are
    // now served directly from Cloudflare R2 (pub-*.r2.dev) — no need to round-
    // trip through Vercel, which preserves Image Optimization + Fast Data
    // Transfer quota. R2 already returns immutable, long-cache-control bytes.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-d34bb61c40b54c02a01ad6f15a82b6a1.r2.dev",
        pathname: "/**",
      },
      { protocol: "https", hostname: "cdn.shopify.com", pathname: "/**" },
      { protocol: "https", hostname: "photo.yupoo.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
    // 30 days — Shopify URLs include cache-busting `?v=` params, safe to cache long.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
