import { createClient } from '@libsql/client'

function client() {
  return createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN || '',
  })
}

function now() { return new Date().toISOString() }
function uuid() { return crypto.randomUUID() }

export const db = {
  admin: {
    async findUnique({ where }: { where: { id?: string; username?: string } }) {
      const f = where.id ? 'id' : 'username'
      const v = where.id || where.username
      const r = await client().execute({ sql: `SELECT * FROM Admin WHERE ${f} = ? LIMIT 1`, args: [v!] })
      return r.rows[0] ?? null
    },
    async findFirst() {
      const r = await client().execute('SELECT * FROM Admin LIMIT 1')
      return r.rows[0] ?? null
    },
    async count() {
      const r = await client().execute('SELECT COUNT(*) as c FROM Admin')
      return Number(r.rows[0].c)
    },
    async create({ data }: { data: { username: string; password: string } }) {
      const id = uuid(), n = now()
      await client().execute({ sql: `INSERT INTO Admin (id,username,password,createdAt,updatedAt) VALUES (?,?,?,?,?)`, args: [id, data.username, data.password, n, n] })
      return { id, ...data, createdAt: n, updatedAt: n }
    },
    async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      const n = now()
      const fields = Object.keys(data).map(k => `${k}=?`).join(',')
      await client().execute({ sql: `UPDATE Admin SET ${fields},updatedAt=? WHERE id=?`, args: [...Object.values(data), n, where.id] })
      return { id: where.id, ...data }
    },
  },

  siteSettings: {
    async findMany() {
      const r = await client().execute('SELECT * FROM SiteSettings')
      return r.rows
    },
    async findUnique({ where }: { where: { key: string } }) {
      const r = await client().execute({ sql: `SELECT * FROM SiteSettings WHERE key=? LIMIT 1`, args: [where.key] })
      return r.rows[0] ?? null
    },
    async create({ data }: { data: { key: string; value: string } }) {
      const id = uuid(), n = now()
      await client().execute({ sql: `INSERT INTO SiteSettings (id,key,value,updatedAt) VALUES (?,?,?,?)`, args: [id, data.key, data.value, n] })
      return { id, ...data }
    },
    async update({ where, data }: { where: { key: string }; data: { value: string } }) {
      const n = now()
      await client().execute({ sql: `UPDATE SiteSettings SET value=?,updatedAt=? WHERE key=?`, args: [data.value, n, where.key] })
      return { ...where, ...data }
    },
    async upsert({ where, update, create }: { where: { key: string }; update: { value?: string }; create: { key: string; value: string } }) {
      const existing = await db.siteSettings.findUnique({ where })
      if (existing) {
        if (update.value !== undefined) return db.siteSettings.update({ where, data: { value: update.value } })
        return existing
      }
      return db.siteSettings.create({ data: create })
    },
  },

  monthlyChart: {
    async findMany({ include }: { include?: { days?: boolean | object } } = {}) {
      const r = await client().execute('SELECT * FROM MonthlyChart ORDER BY year DESC, month DESC')
      if (!include?.days) return r.rows
      return Promise.all(r.rows.map(async chart => {
        const days = await client().execute({ sql: `SELECT * FROM DayData WHERE chartId=? ORDER BY day ASC`, args: [chart.id as string] })
        return { ...chart, days: days.rows }
      }))
    },
    async findUnique({ where, include }: { where: { month_year?: { month: number; year: number }; id?: string }; include?: { days?: boolean | object } }) {
      let row = null
      if (where.id) {
        const r = await client().execute({ sql: `SELECT * FROM MonthlyChart WHERE id=? LIMIT 1`, args: [where.id] })
        row = r.rows[0] ?? null
      } else if (where.month_year) {
        const r = await client().execute({ sql: `SELECT * FROM MonthlyChart WHERE month=? AND year=? LIMIT 1`, args: [where.month_year.month, where.month_year.year] })
        row = r.rows[0] ?? null
      }
      if (!row || !include?.days) return row
      const days = await client().execute({ sql: `SELECT * FROM DayData WHERE chartId=? ORDER BY day ASC`, args: [row.id as string] })
      return { ...row, days: days.rows }
    },
    async create({ data }: { data: { month: number; year: number; visible?: boolean; days?: { create: Record<string, unknown>[] } } }) {
      const id = uuid(), n = now()
      await client().execute({ sql: `INSERT INTO MonthlyChart (id,month,year,visible,createdAt,updatedAt) VALUES (?,?,?,?,?,?)`, args: [id, data.month, data.year, data.visible ?? 1, n, n] })
      if (data.days?.create) {
        for (const day of data.days.create) {
          const did = uuid()
          await client().execute({ sql: `INSERT INTO DayData (id,day,chartId,slot1,slot2,slot3,slot4,slot5,slot6,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, args: [did, day.day, id, day.slot1 ?? null, day.slot2 ?? null, day.slot3 ?? null, day.slot4 ?? null, day.slot5 ?? null, day.slot6 ?? null, n, n] })
        }
      }
      return { id, ...data }
    },
    async update({ where, data }: { where: { id: string }; data: { visible?: boolean } }) {
      const n = now()
      await client().execute({ sql: `UPDATE MonthlyChart SET visible=?,updatedAt=? WHERE id=?`, args: [data.visible ? 1 : 0, n, where.id] })
      return { id: where.id, ...data }
    },
    async delete({ where }: { where: { id: string } }) {
      await client().execute({ sql: `DELETE FROM MonthlyChart WHERE id=?`, args: [where.id] })
      return { id: where.id }
    },
  },

  dayData: {
    async findUnique({ where }: { where: { chartId_day?: { chartId: string; day: number }; id?: string } }) {
      if (where.id) {
        const r = await client().execute({ sql: `SELECT * FROM DayData WHERE id=? LIMIT 1`, args: [where.id] })
        return r.rows[0] ?? null
      }
      if (where.chartId_day) {
        const r = await client().execute({ sql: `SELECT * FROM DayData WHERE chartId=? AND day=? LIMIT 1`, args: [where.chartId_day.chartId, where.chartId_day.day] })
        return r.rows[0] ?? null
      }
      return null
    },
    async findMany({ where }: { where: { chartId: string } }) {
      const r = await client().execute({ sql: `SELECT * FROM DayData WHERE chartId=? ORDER BY day ASC`, args: [where.chartId] })
      return r.rows
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const id = uuid(), n = now()
      await client().execute({ sql: `INSERT INTO DayData (id,day,chartId,slot1,slot2,slot3,slot4,slot5,slot6,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, args: [id, data.day, data.chartId, data.slot1 ?? null, data.slot2 ?? null, data.slot3 ?? null, data.slot4 ?? null, data.slot5 ?? null, data.slot6 ?? null, n, n] })
      return { id, ...data }
    },
    async createMany({ data }: { data: Record<string, unknown>[] }) {
      const n = now()
      for (const row of data) {
        const id = uuid()
        await client().execute({ sql: `INSERT INTO DayData (id,day,chartId,slot1,slot2,slot3,slot4,slot5,slot6,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, args: [id, row.day, row.chartId, row.slot1 ?? null, row.slot2 ?? null, row.slot3 ?? null, row.slot4 ?? null, row.slot5 ?? null, row.slot6 ?? null, n, n] })
      }
      return { count: data.length }
    },
    async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      const n = now()
      const fields = Object.keys(data).map(k => `${k}=?`).join(',')
      await client().execute({ sql: `UPDATE DayData SET ${fields},updatedAt=? WHERE id=?`, args: [...Object.values(data), n, where.id] })
      return { id: where.id, ...data }
    },
    async upsert({ where, update, create }: { where: { chartId_day: { chartId: string; day: number } }; update: Record<string, unknown>; create: Record<string, unknown> }) {
      const existing = await db.dayData.findUnique({ where })
      if (existing) return db.dayData.update({ where: { id: existing.id as string }, data: update })
      return db.dayData.create({ data: { ...create, chartId: where.chartId_day.chartId, day: where.chartId_day.day } })
    },
  },
}

export default db