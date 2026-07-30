import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1080, 1280, 1600, 1920],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "gsap"],
  },
  /**
   * Both apex and www resolve to this deployment, so www is folded into the
   * apex — the canonical host used by site.url, the sitemap and every OG tag.
   * Without this the two hosts serve identical pages as duplicate content.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.the-grace.com" }],
        destination: "https://the-grace.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
