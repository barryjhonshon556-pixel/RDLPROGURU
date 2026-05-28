# Cloudflare Pages Build Configuration

## Build Settings in Cloudflare Dashboard

If you have API routes with Prisma, Cloudflare Pages **must** use its `next-on-pages` bridge. Cloudflare Pages cannot natively host `.next/server` Node.js folders because it runs on serverless V8 Workers instead of traditional VPS servers.

To fix the `Error: Output directory ".next\server" not found.` error, you need to update your Cloudflare Project Settings.

### The Correct Settings:

- **Framework preset**: Select `Next.js`
- **Build command**: `npm run build`
- **Build output directory**: `.vercel/output/static` (Cloudflare generates this automatically when you use the Next.js preset)

## Instructions to Fix

1. Log in to your Cloudflare Dashboard and navigate to your `rdl-pro-matka` Pages project.
2. Go to **Settings** → **Builds & Deployments**.
3. Under **Build configurations**, click **Edit**.
4. Set the field exactly as follows:
   - Framework preset: **Next.js**
   - Build command: `npm run build && npx @cloudflare/next-on-pages`
   - Build output directory: `.vercel/output/static`
5. Click **Save** and trigger a new deployment.

*(By running `npx @cloudflare/next-on-pages` directly after your build, it takes the `.next` artifacts we just successfully compiled and converts them into Cloudflare Worker compatible edge functions!)*

---

## Environment Variables (Set in Cloudflare Dashboard)

For **Production** environment:

```
DATABASE_URL=libsql://your-database.turso.io?authToken=your-token
NODE_ENV=production
```
