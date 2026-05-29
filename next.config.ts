import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ['@prisma/client', '@libsql/client', '@prisma/adapter-libsql'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL || '',
    DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN || '',
  }
};

export default nextConfig;