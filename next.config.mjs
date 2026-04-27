/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
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
