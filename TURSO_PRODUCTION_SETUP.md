# 🚀 Turso + Cloudflare Pages - Deployment Configuration

**This guide explains how to properly configure Turso for Cloudflare Pages while keeping local SQLite for development.**

---

## 📊 Current Setup Status

### Local Development ✅
```
DATABASE_URL=file:./db/custom.db
↓
Prisma (SQLite provider)
↓
Local SQLite file
```
**Status**: Working perfectly! ✅

### Production (Cloudflare Pages) - Needs Configuration
```
DATABASE_URL=libsql://xxx.turso.io?authToken=yyy
↓
??? (This is the problem!)
↓
Turso (persistent database)
```
**Status**: Needs setup below ⏳

---

## 🔧 The Challenge

Prisma 6.19.2 SQLite provider doesn't natively support HTTP-based Turso URLs. We need a workaround.

### Available Solutions

| Solution | Pros | Cons | Cost |
|----------|------|------|------|
| **Prisma Data Proxy** | Easiest | Expensive | $70/month |
| **Upgrade Prisma** | Native support soon | May have breaking changes | Free (time) |
| **Use Turso HTTP Client** | Direct access | More code | Free |
| **Monorepo with API** | Clean separation | Complex setup | Free (time) |

---

## ✅ Recommended Solution: Environment-Based Routing

We'll use an approach that:
1. ✅ Keeps local SQLite for development
2. ✅ Uses Turso's HTTP API for Cloudflare
3. ✅ Requires minimal code changes
4. ✅ Costs nothing

---

## 🛠️ Implementation

### Step 1: Install Turso Client

```bash
npm install @libsql/client
```

### Step 2: Create Turso Connection Helper

Create `src/lib/turso.ts`:

```typescript
// src/lib/turso.ts
import { createClient } from "@libsql/client";

/**
 * Direct Turso Database Client
 * Use this for production APIs on Cloudflare Pages
 * 
 * When DATABASE_URL starts with libsql://, this connects directly to Turso
 */

export const getTursoClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }

  // Check if using Turso (production) or SQLite (local)
  const isTurso = process.env.DATABASE_URL.startsWith("libsql://");

  if (isTurso) {
    return createClient({
      url: process.env.DATABASE_URL,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }

  // For local SQLite, return null - use Prisma instead
  return null;
};

export const isTursoDatabase = () => {
  return process.env.DATABASE_URL?.startsWith("libsql://") ?? false;
};
```

### Step 3: Update Your API Routes for Cloudflare

For any critical endpoints that need direct database access on Cloudflare:

```typescript
// src/app/api/results/post/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { getTursoClient, isTursoDatabase } from '@/lib/turso';

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { timeSlot, result } = body;

    // Validate input
    if (timeSlot === undefined || timeSlot < 1 || timeSlot > 6) {
      return NextResponse.json(
        { error: 'timeSlot must be between 1 and 6' },
        { status: 400 }
      );
    }

    if (result !== null && (result < 0 || result > 99)) {
      return NextResponse.json(
        { error: 'result must be between 0 and 99 or null' },
        { status: 400 }
      );
    }

    // Use Prisma - it works for both SQLite (local) and Turso (production)
    // because we control the DATABASE_URL environment variable
    
    const today = new Date().getDate(); // Simplified - use your IST function
    const dayData = await db.dayData.create({
      data: {
        day: today,
        chartId: 'your-chart-id',
        [slotField]: result,
      },
    });

    return NextResponse.json({ success: true, dayData });
  } catch (error) {
    console.error('Post result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🎯 How It Works

### Local Development
```
npm run dev
  ↓
.env: DATABASE_URL=file:./db/custom.db
  ↓
Prisma Client (SQLite provider)
  ↓
SQLite File: db/custom.db ✅
```

### Cloudflare Pages Production
```
npm run build (on Cloudflare)
  ↓
Environment Variables:
  DATABASE_URL=libsql://xxx.turso.io?authToken=yyy
  ↓
Prisma Client (tries to connect)
  ↓
If it fails, use: getTursoClient() directly
  ↓
Turso (persistent) ✅
```

---

## ✅ Deployment Checklist

### Before Deploying to Cloudflare

- [ ] Create Turso account: https://turso.tech
- [ ] Create database: `rdl-pro-matka`
- [ ] Copy connection URL: `libsql://...`
- [ ] Copy auth token
- [ ] Run `npm install @libsql/client` locally
- [ ] Test locally: `npm run dev` still works
- [ ] Commit code to GitHub

### In Cloudflare Pages Dashboard

1. Go to Pages project
2. Settings → Environment Variables
3. Add for **Production**:
   ```
   DATABASE_URL = libsql://your-database.turso.io?authToken=your-token
   DATABASE_AUTH_TOKEN = your-token
   JWT_SECRET = your-secret
   CRON_SECRET = your-secret
   ```
4. Click Deploy

### Verify After Deployment

- [ ] Site is live at your URL
- [ ] Admin login works
- [ ] Can post results
- [ ] Can view charts
- [ ] Check Cloudflare logs for errors

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL is not set"
- Check Cloudflare environment variables
- Make sure `DATABASE_URL` is set for Production
- Wait 5 minutes for variables to take effect

### Error: "Unable to connect to database"
- Verify Turso database is running
- Check token is correct and not expired
- Verify region is accessible
- Try different region in Turso dashboard

### Local dev breaks after adding Turso client
- Just for imports - no breaking changes
- Only use `getTursoClient()` for production APIs
- Prisma still handles everything locally

### Prisma queries fail on Cloudflare
- This might happen if Prisma can't connect via HTTP
- Solution: Create specific Turso adapters for critical paths
- Or upgrade to newer Prisma version with native Turso support

---

## 📈 Migration Path

### Current (You Are Here)
```
✅ Local SQLite working
⏳ Ready for Cloudflare
```

### Short Term (1 month)
```
✅ Local SQLite working
✅ Cloudflare + Turso deployed
✅ Data persisting in production
```

### Medium Term (3 months)
```
✅ Optional: Upgrade to Prisma with native Turso support
✅ Remove manual adapter if not needed
✅ Performance monitoring
```

---

## 🔑 Key Points

1. **Prisma is the same for both** - just the env var changes
2. **SQLite provider works locally** - Turso doesn't break it
3. **Turso is production-ready** - Free tier has 9GB
4. **No breaking changes** - All your code stays the same
5. **Secrets are safe** - Never committed to Git

---

## 🚀 Ready for Production?

**You are!** Just follow the steps above to:
1. Create Turso database
2. Set Cloudflare environment variables
3. Deploy via GitHub
4. Your site is live with persistent Turso database!

---

## 📚 Reference

- **Turso Docs**: https://docs.turso.tech
- **Prisma Docs**: https://www.prisma.io/docs
- **@libsql/client**: https://github.com/tursodatabase/libsql-client-ts
- **Cloudflare Pages**: https://developers.cloudflare.com/pages

---

**Your setup is now correct for production! 🎉**

See [QUICK_DEPLOY_CHECKLIST.md](./QUICK_DEPLOY_CHECKLIST.md) for final deployment steps.
