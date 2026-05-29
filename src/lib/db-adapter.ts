// Redirect everything to db.ts — single source of truth
export { db, db as default } from './db'

export const getDbInfo = () => {
  const url = process.env.DATABASE_URL || 'Not set'
  const isTurso = url.startsWith('libsql://')
  return {
    type: isTurso ? 'Turso (libSQL)' : 'SQLite (File)',
    url: isTurso ? url.split('?')[0] : url,
    environment: process.env.NODE_ENV || 'development',
  }
}