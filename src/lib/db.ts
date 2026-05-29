import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

declare global {
  var prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
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

function getDb(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    return createPrismaClient()
  }
  if (!global.prisma) {
    global.prisma = createPrismaClient()
  }
  return global.prisma
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  }
})

export default db