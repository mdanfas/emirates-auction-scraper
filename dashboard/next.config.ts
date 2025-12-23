import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/emirates-auction-scraper',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
