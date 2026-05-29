import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const connectionUrl = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN || ''

  if (!connectionUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const isLibSql = connectionUrl.startsWith('libsql://') || connectionUrl.startsWith('https://')

  if (isLibSql) {
    const turso = createClient({ url: connectionUrl, authToken })
    const adapter = new PrismaLibSQL(turso)
    return new PrismaClient({ adapter })
  }

  return new PrismaClient()
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export default db