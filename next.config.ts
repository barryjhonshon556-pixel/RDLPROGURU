import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ['@prisma/client', '@libsql/client'],
};

export default nextConfig;