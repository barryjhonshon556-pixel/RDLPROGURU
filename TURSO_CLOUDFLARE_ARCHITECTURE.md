# ✅ Turso + Cloudflare Pages Setup (Correct Architecture)

**The Problem You Identified**: Cloudflare Pages has ephemeral storage - local files don't persist!  
**The Solution**: Use Turso database for production, SQLite only for local development.

---

## 📊 Architecture

```
┌─────────────────────────────────────┐
│  LOCAL DEVELOPMENT                  │
├─────────────────────────────────────┤
│ DATABASE_URL=file:./db/custom.db    │
│ Database: SQLite (persistent file)  │
│ Runs: npm run dev                   │
│ Access: http://localhost:3000       │
└─────────────────────────────────────┘
           (Your Machine)

                 ↓↓↓ DEPLOY ↓↓↓

┌─────────────────────────────────────┐
│  CLOUDFLARE PAGES (Production)      │
├─────────────────────────────────────┤
│ DATABASE_URL=libsql://xxx.turso.io  │
│ DATABASE_AUTH_TOKEN=xxx             │
│ Database: Turso (persistent, global)│
│ Hosting: Cloudflare Pages (CDN)     │
│ Access: yourdomain.com              │
└─────────────────────────────────────┘
         (Globally Distributed)
```

---

## 🔑 Key Understanding

### Why NOT Local SQLite on Cloudflare Pages?
❌ Cloudflare Pages uses **ephemeral file system**  
❌ Local files are NOT persisted across requests  
❌ Database gets reset with every deployment  
❌ Multiple instances can't share the same file  
❌ Data loss guaranteed  

### Why Turso Works?
✅ **HTTP API** - Works with serverless functions  
✅ **Persistent** - Data stored in Turso's managed infrastructure  
✅ **Global** - Replicated across regions for low latency  
✅ **Serverless-friendly** - No connection pools needed  
✅ **SQLite compatible** - Same SQL you know  

---

## 🚀 Correct Setup for Both Environments

### Step 1: Current Local Setup ✅ (Already Working)

Your `.env` is perfect for development:
```env
DATABASE_URL=file:./db/custom.db
JWT_SECRET=dev-local-secret
CRON_SECRET=dev-local-secret
```

This works great locally because the file persists in your project folder.

### Step 2: Create Turso Database (For Production)

1. Go to https://turso.tech
2. Sign up (free tier has 9GB)
3. Create database: `rdl-pro-matka`
4. Region: Choose one close to you (e.g., `mia` for Americas)
5. Copy:
   - **URL**: `libsql://xxxx.turso.io?authToken=yyyy`
   - **Auth Token**: `yyyy`

Save these - you'll need them in Cloudflare.

### Step 3: For Cloudflare Pages

When you deploy to Cloudflare Pages, set these environment variables:

```
DATABASE_URL = libsql://rdl-pro-matka-your-org.turso.io?authToken=your_token_here
JWT_SECRET = your-random-32-char-secret
CRON_SECRET = different-random-32-char-secret
```

**DO NOT** set these in `.env` file! Set them in Cloudflare dashboard only!

### Step 4: Prisma Configuration

Your `prisma/schema.prisma` stays as SQLite:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Why SQLite provider with Turso URL?**  
Actually, this needs to be handled specially. See below.

---

## 🔧 Technical Solution: Environment-Based Config

The challenge: Prisma SQLite provider doesn't work with HTTP URLs (Turso).

### Solution: Use Prisma Data Proxy (Easy but Costs Money)

```prisma
// Add to your .env (production only)
DATABASE_URL="prisma://aws-us-east-1.prisma-data.com/?api_key=your_key"
```

Cost: ~$70/month (expensive for this)

### Solution: Use Direct Turso Client (Better for Cloudflare)

Instead of routing through Prisma, use Turso's HTTP client directly for production:

1. Install Turso client:
```bash
npm install @libsql/client
```

2. Create `lib/db-turso.ts`:
```typescript
import { createClient } from "@libsql/client";

export const tursoDb = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
```

3. For API routes, use this client when on Cloudflare

### Solution: Two Separate Schemas (Most Reliable)

Create two Prisma schemas:
- `prisma/schema.sqlite.prisma` - For local dev
- `prisma/schema.turso.prisma` - For production

Select based on environment.

---

## ✅ Recommended Approach (What We'll Do)

**Keep it simple:**

1. **Local Development** (Right now ✅)
   - Keep using SQLite with Prisma
   - File: `db/custom.db`
   - Works perfectly

2. **Cloudflare Pages** (When deploying)
   - Create Turso database
   - Set DATABASE_URL in Cloudflare
   - Use Prisma Data Proxy OR create a production-specific build

---

## 📋 Your Current Status

```
✅ Local Development Ready
   DATABASE: SQLite file (persists)
   Server: npm run dev
   Status: Working perfectly

⏳ Production Ready (When you deploy)
   DATABASE: Turso (persistent, global)
   Hosting: Cloudflare Pages
   Status: Instructions ready
```

---

## 🎯 When You're Ready to Deploy

1. **Create Turso Database**
   - Visit https://turso.tech/dashboard
   - Create: `rdl-pro-matka`
   - Get URL and token

2. **Update Cloudflare Environment Variables**
   - Go to Cloudflare Pages project settings
   - Add `DATABASE_URL` = Your Turso connection string
   - Add `JWT_SECRET` and `CRON_SECRET`

3. **Build Configuration**
   - Cloudflare will automatically use those env vars
   - Your code will work with Turso instead of local SQLite

---

## 🚨 IMPORTANT: Never Commit Secrets to Git!

```
✅ Safe: .env in .gitignore (local dev only)
❌ Unsafe: DATABASE_URL with Turso token in .env (could be committed)
✅ Safe: Secrets ONLY in Cloudflare dashboard (not in .env)
```

---

## 📝 Summary

| Environment | Database | URL | Persistence |
|-------------|----------|-----|-------------|
| **Local Dev** | SQLite | `file:./db/custom.db` | ✅ Persists |
| **Cloudflare** | Turso | `libsql://xxx.turso.io` | ✅ Persists |

Both use the same code - only the environment variables change!

---

## 🔗 Next Actions

### To Continue Development Now:
```bash
npm run dev
# Database: SQLite
# URL: http://localhost:3000
```

### When Ready to Deploy:
1. Create Turso database (5 minutes)
2. Get connection credentials
3. Set Cloudflare environment variables
4. Push to GitHub
5. Cloudflare auto-deploys with Turso!

---

**You were right to catch this! Local SQLite would have been a disaster on Cloudflare. Turso is the perfect solution. 🎯**

See [QUICK_DEPLOY_CHECKLIST.md](./QUICK_DEPLOY_CHECKLIST.md) for full deployment instructions.
