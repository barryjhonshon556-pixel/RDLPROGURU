import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@libsql/client'],
  },
};

export default nextConfig;