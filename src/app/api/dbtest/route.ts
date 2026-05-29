import { createClient } from '@libsql/client'

export async function GET() {
  const url = process.env.DATABASE_URL
  const token = process.env.DATABASE_AUTH_TOKEN

  if (!url) return Response.json({ error: 'DATABASE_URL is undefined' }, { status: 500 })

  try {
    const client = createClient({ url, authToken: token || '' })
    const result = await client.execute('SELECT 1 as test')
    return Response.json({ success: true, result: result.rows })
  } catch (e: unknown) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}