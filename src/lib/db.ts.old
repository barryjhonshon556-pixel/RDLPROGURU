import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// Check if we are running in an environment where we need the adapter
// Note: In Cloudflare edge, process is sometimes mocked, but we should safely default to adapter if Turso is used
const connectionUrl = process.env.DATABASE_URL || 'file:./local.db'
const authToken = process.env.DATABASE_AUTH_TOKEN || ''

// We only use the libSQL adapter if we're using a libsql:// or https:// URL (Turso)
const isLibSql = connectionUrl.startsWith('libsql://') || connectionUrl.startsWith('https://')

let prismaInstance: PrismaClient;

if (isLibSql) {
  const adapter = new PrismaLibSql({
    url: connectionUrl,
    authToken: authToken,
  })
  prismaInstance = new PrismaClient({ adapter, log: ['query', 'error'] })
} else {
  prismaInstance = new PrismaClient({ log: ['query', 'error'] })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? prismaInstance

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db