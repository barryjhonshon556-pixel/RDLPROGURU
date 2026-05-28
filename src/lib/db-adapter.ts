// src/lib/db-adapter.ts
/**
 * Database Adapter
 * Handles both SQLite (local) and Turso (production)
 * 
 * The Prisma client is the same for both - this adapter
 * just configures which database to use based on environment
 */

import { PrismaClient } from "@prisma/client";

// Check if we're using Turso (production) or SQLite (local development)
const isProduction = process.env.NODE_ENV === "production";
const isDatabaseUrlTurso = process.env.DATABASE_URL?.startsWith("libsql://");

/**
 * For production/Cloudflare: DATABASE_URL will be libsql://...
 * For development: DATABASE_URL will be file:./db/...
 */

// Initialize Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

/**
 * Database Info
 * Useful for debugging which database is being used
 */
export const getDbInfo = () => {
  const url = process.env.DATABASE_URL || "Not set";
  return {
    type: isDatabaseUrlTurso ? "Turso (HTTP)" : "SQLite (File)",
    url: isDatabaseUrlTurso ? url.split("?")[0] : url, // Hide token
    environment: process.env.NODE_ENV || "development",
  };
};

export default db;
