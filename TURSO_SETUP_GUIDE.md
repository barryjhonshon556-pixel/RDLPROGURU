# Turso Database Setup Guide (RDL Pro Matka)

Complete step-by-step guide for setting up Turso as your production database.

---

## What is Turso?

Turso is a SQLite-compatible database platform:
- ✅ Drop-in replacement for SQLite
- ✅ Globally distributed (low latency)
- ✅ HTTP API (perfect for serverless/Cloudflare)
- ✅ Free tier: 9GB storage, perfect for matka data
- ✅ No local file management needed

---

## Step 1: Create Turso Account

1. Go to https://turso.tech
2. Click "Sign up"
3. Choose GitHub login (recommended) or email
4. Verify email
5. Dashboard will appear

---

## Step 2: Create Database

### Via Turso Dashboard

1. Click **"Create a database"** button
2. Fill in:
   - **Name**: `rdl-pro-matka` (or your project name)
   - **Region**: Choose closest to your users:
     - `mia` = Miami (North America)
     - `ams` = Amsterdam (Europe)
     - `sin` = Singapore (Asia)
     - `syd` = Sydney (Australia)
   - **Type**: Primary (default)
3. Click **"Create"**
4. Wait 10-15 seconds for creation

### Via Turso CLI (Alternative)

```bash
# Install Turso CLI
scoop install turso  # Windows

# Login
turso auth login

# Create database
turso db create rdl-pro-matka --location mia
```

---

## Step 3: Get Connection Credentials

### From Dashboard

1. Open your database: **Databases** → **rdl-pro-matka**
2. Copy the **URL** shown (format: `libsql://[database-name].turso.io?authToken=[token]`)
3. You'll also see an **Auth Token** - save both

### Via CLI

```bash
turso db show rdl-pro-matka

# Output will show connection details
# Connection URL: libsql://...
# Auth Token: [token]
```

---

## Step 4: Migrate Your Schema

### Option A: Using Prisma CLI (Recommended)

1. Update `.env.local` temporarily:
```
DATABASE_URL=libsql://[your-database-name].turso.io?authToken=[your-token]
DATABASE_AUTH_TOKEN=[your-token]
```

2. Run migration:
```bash
npx prisma db push
```

This will:
- Validate schema
- Create all tables (Admin, MonthlyChart, DayData, SiteSettings)
- Prepare database for use

3. Verify migration:
```bash
npx prisma studio
# Opens web UI showing your database tables
```

### Option B: Using Turso CLI (Manual)

```bash
# Create table structure manually if needed
turso db shell rdl-pro-matka << 'EOF'
CREATE TABLE IF NOT EXISTS Admin (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME
);

CREATE TABLE IF NOT EXISTS MonthlyChart (
  id TEXT PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  visible BOOLEAN DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME,
  UNIQUE(month, year)
);

-- (add other tables as needed)
EOF
```

---

## Step 5: Test Connection

### Test 1: Prisma Connection
```bash
npx prisma db execute --stdin < /dev/null
# Should not error
```

### Test 2: CLI Connection
```bash
turso db show rdl-pro-matka
# Should show database info
```

### Test 3: Query Data
```bash
turso db shell rdl-pro-matka "SELECT COUNT(*) FROM Admin"
```

---

## Step 6: Seed Initial Data (Optional)

If you want to populate with test data:

```bash
# Using your app's local setup first
npm install
npm run db:generate

# Then call the setup endpoint locally
curl http://localhost:3000/api/setup
```

Then:
```bash
# Copy the SQLite to Turso
turso db backup rdl-pro-matka > backup.sql
```

Or use the built-in seed after deployment:
```bash
# After deploying to Cloudflare
curl -X GET https://your-domain.com/api/seed-data \
  -H "Authorization: Bearer [JWT_TOKEN]"
```

---

## Step 7: Environment Variables

### For Local Development

Create `.env.local`:
```
DATABASE_URL=libsql://rdl-pro-matka-[org].turso.io?authToken=[token]
DATABASE_AUTH_TOKEN=[token]
JWT_SECRET=dev-local-secret-change-in-prod
CRON_SECRET=dev-local-secret-change-in-prod
```

### For Cloudflare Pages Production

In Cloudflare Dashboard → Pages → Settings → Environment Variables:

**Production Deployment:**
```
DATABASE_URL = libsql://[database-name].turso.io?authToken=[token]
DATABASE_AUTH_TOKEN = [token]
JWT_SECRET = [generate-32-char-random-string]
CRON_SECRET = [generate-32-char-random-string]
```

---

## Turso CLI Commands Reference

```bash
# List all databases
turso db list

# Show database details
turso db show rdl-pro-matka

# Create SQL shell
turso db shell rdl-pro-matka

# Backup database
turso db backup rdl-pro-matka > backup.sql

# Restore from backup
turso db restore rdl-pro-matka < backup.sql

# Delete database
turso db delete rdl-pro-matka

# Create replica (for high availability)
turso db replicate rdl-pro-matka --location sin
```

---

## Turso Web Console

For GUI database management:

1. Go to https://dashboard.turso.io
2. Select your database
3. Click **"Console"**
4. Run SQL queries directly
5. View table structure
6. Check data

---

## Common Issues & Fixes

### Issue: "Auth token invalid"
```
Error: libsql is not available in this build
```

**Fix:**
- Ensure `DATABASE_URL` includes `?authToken=[token]`
- Verify token hasn't expired
- Regenerate token in Turso dashboard

### Issue: "Database connection timeout"
```
Error: Unable to connect to database
```

**Fix:**
- Check internet connection
- Verify database region is accessible from your location
- Try different region (e.g., change `mia` to `ams`)

### Issue: Schema mismatch
```
Error: column "xyz" does not exist
```

**Fix:**
- Run `npx prisma db push` again
- Check `prisma/schema.prisma` for correct table definitions

---

## Monitoring & Performance

### Check Database Usage

```bash
# Via CLI
turso org show

# Shows:
# - Storage used (rows/data size)
# - API calls made
# - Cost (if upgraded)
```

### View Logs

In Turso Dashboard:
1. Select database
2. Click **"Logs"** tab
3. See query history and performance metrics

### Performance Tips

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_daydata_chart_day ON DayData(chartId, day);
CREATE INDEX idx_monthlychart_month_year ON MonthlyChart(month, year);
```

---

## Backup & Disaster Recovery

### Automated Backups

```bash
# Daily backup script (save as backup.sh)
#!/bin/bash
BACKUP_FILE="backup-$(date +%Y%m%d).sql"
turso db backup rdl-pro-matka > $BACKUP_FILE
echo "Backup saved to $BACKUP_FILE"
```

Schedule with cron or GitHub Actions:
```yaml
# .github/workflows/daily-backup.yml
name: Daily Backup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Turso Database
        run: |
          turso db backup rdl-pro-matka > backup-$(date +%s).sql
        env:
          TURSO_API_TOKEN: ${{ secrets.TURSO_API_TOKEN }}
```

---

## Migration from SQLite to Turso

If you already have local SQLite data:

```bash
# 1. Export SQLite data
sqlite3 ./db/custom.db ".dump" > export.sql

# 2. Import to Turso
turso db shell rdl-pro-matka < export.sql

# 3. Verify data transferred
turso db shell rdl-pro-matka "SELECT COUNT(*) FROM Admin, MonthlyChart, DayData"
```

---

## Cost Estimation

**Free Tier:**
- 9 GB storage (enough for ~10 years of matka data)
- Unlimited API requests
- Unlimited bandwidth
- Perfect for this project

**When to upgrade:**
- Storage needs exceed 9GB
- Want higher SLA/support
- Need advanced features

---

## Turso + Cloudflare Integration

### Why this combo works?

1. **Turso** = Global database (SQL over HTTP)
2. **Cloudflare Pages** = Global CDN + edge computing
3. **Result** = Fast, scalable, zero-configuration setup

### Latency Benefits

- Cloudflare edge functions serve static content
- API requests go to nearest Turso replica
- Database response time: ~50-200ms globally

---

## Next Steps

1. ✅ Create Turso database
2. ✅ Get connection credentials  
3. ✅ Run Prisma migration
4. ✅ Set up environment variables
5. ✅ Deploy to Cloudflare Pages
6. ✅ Call setup endpoint
7. ✅ Monitor usage

See **DEPLOYMENT_GUIDE.md** for full Cloudflare Pages setup!

---

## Support & Resources

- **Turso Docs**: https://docs.turso.tech
- **Prisma Turso Guide**: https://www.prisma.io/docs/orm/overview/databases/turso
- **Turso CLI**: https://docs.turso.tech/cli
- **Community**: Discord at https://discord.gg/turso

---

**Happy deploying! 🚀**
