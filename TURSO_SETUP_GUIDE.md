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

### Important: Local Development vs Production

Your project uses:
- **Local Development**: SQLite database (works great)
- **Production (Cloudflare)**: Turso database via API

### For Local Development (NOW)

Your `.env` is correctly configured:
```
DATABASE_URL=file:./db/custom.db
```

Run Prisma migration:
```bash
npx prisma db push
```

Expected output:
```
✔ Generated Prisma Client
```

This creates your local SQLite database with all tables.

### For Production with Turso (LATER)

When you deploy to Cloudflare Pages later:
1. Create your Turso database (steps 1-3 above)
2. In Cloudflare dashboard, set these environment variables:
   ```
   DATABASE_URL=libsql://your-db.turso.io?authToken=xxx
   ```
3. Cloudflare will use that URL for your production app
4. Your code works the same - Prisma client handles it automatically

**How it works**: SQLite driver can connect to both local files AND Turso databases via HTTP. The connection details are controlled by the environment variables.

### Verify Migration

```bash
npx prisma studio
# Opens web UI showing your database tables
# Verify: Admin, MonthlyChart, DayData, SiteSettings tables exist
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

### Local Development (CURRENT) ✅

Your `.env` file is perfect for local development:
```
DATABASE_URL=file:./db/custom.db
JWT_SECRET=dev-local-jwt-secret-change-in-production
CRON_SECRET=dev-local-cron-secret-change-in-production
```

Works great! Your database is already set up and migrated.

### Cloudflare Pages Production (WHEN YOU DEPLOY)

When deploying to Cloudflare later, you'll set these in the Cloudflare dashboard **Environment Variables**:

```
DATABASE_URL = libsql://your-db-name-your-org.turso.io?authToken=YOUR_TOKEN
JWT_SECRET = [generate-32-char-random-string]
CRON_SECRET = [generate-32-char-random-string]
```

**How it works:**
- Your code doesn't change
- The `DATABASE_URL` env var tells Prisma whether to use local SQLite or Turso
- Cloudflare will build and deploy with the Turso URLs
- Everything else stays the same

**To get your Turso credentials:**
1. Go to https://turso.tech/dashboard
2. Create database: `rdl-pro-matka`
3. Copy Connection URL: `libsql://...`
4. Copy Auth Token
5. Paste into Cloudflare env vars (don't commit to Git!)

---

### Important: Never Commit Production Secrets!

✅ `.env` is in `.gitignore` for local dev  
✅ Production secrets only in Cloudflare dashboard  
✅ Never paste Turso tokens into `.env` for commits  

The setup is secure by default.

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
