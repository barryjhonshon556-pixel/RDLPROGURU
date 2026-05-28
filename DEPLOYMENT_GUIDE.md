# RDL Pro Matka - Deployment Guide (Cloudflare Pages + Turso)

Complete step-by-step guide to deploy your project live on Cloudflare Pages with Turso database.

---

## 📋 Prerequisites

- GitHub account (for connecting to Cloudflare)
- Cloudflare account (free tier works)
- Turso account (free tier available)
- Git installed locally
- Node.js 18+ (if testing locally)

---

## 🗂️ Part 1: Prepare Your Repository

### Step 1: Push to GitHub

1. Initialize git (if not already done):
```bash
cd c:\Users\HP\Downloads\rdl-pro-matka
git init
git add .
git commit -m "Initial commit - RDL Pro Matka"
```

2. Create a new repository on GitHub (https://github.com/new)
   - Name: `rdl-pro-matka` (or your choice)
   - Make it **PRIVATE** (for security)

3. Push to GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/rdl-pro-matka.git
git branch -M main
git push -u origin main
```

### Step 2: Create `.gitignore` entries for sensitive files

Make sure `.gitignore` includes:
```
.env
.env.local
.env.*.local
node_modules/
.next/
dist/
```

---

## 🗄️ Part 2: Set Up Turso Database

### Step 1: Create Turso Account
1. Go to https://turso.tech
2. Sign up (free tier includes 9GB storage, enough for matka data)
3. Verify email

### Step 2: Create Database
1. In Turso dashboard, click "Create a database"
2. Name: `rdl-pro-matka` or similar
3. Region: Choose closest to your users (e.g., `mia` for Miami, `ams` for Amsterdam)
4. Click "Create"

### Step 3: Get Connection Credentials
1. Open your database
2. Click "Copy" on the connection URL (looks like `libsql://xxx.turso.io?authToken=xxx`)
3. **Save this securely** - you'll need it

### Step 4: Migrate Schema to Turso

1. Install Turso CLI (if not already):
```bash
# On Windows
scoop install turso
# Or download from https://github.com/tursodatabase/turso-cli/releases
```

2. Log in to Turso CLI:
```bash
turso auth login
```

3. Get your database URL and auth token from Turso dashboard

4. Update `prisma/schema.prisma` to use Turso:
```prisma
datasource db {
  provider = "libsql"
  url      = env("DATABASE_URL")
  authToken = env("DATABASE_AUTH_TOKEN")
}
```

5. Run migration:
```bash
npx prisma db push
```

This will:
- Generate Prisma client
- Create all tables (Admin, MonthlyChart, DayData, SiteSettings)

### Step 5: Verify Migration

```bash
# Test if connection works
turso db show rdl-pro-matka
```

---

## ☁️ Part 3: Set Up Cloudflare Pages

### Step 1: Create Cloudflare Account
1. Go to https://dash.cloudflare.com
2. Sign up (free tier works)
3. Verify email and add domain (or use Pages domain)

### Step 2: Deploy via GitHub

1. In Cloudflare Dashboard, go to **Pages**
2. Click "Create a project"
3. Click "Connect to Git"
4. Authorize GitHub and select your `rdl-pro-matka` repository
5. Click "Begin setup"

### Step 3: Configure Build

1. **Framework**: Select `Next.js`
2. **Build command**: `npm run build`
3. **Build output directory**: `.next` (or leave default)

4. **Environment Variables** - Click "Add environment variable" for each:

   **For Production:**
   ```
   DATABASE_URL = libsql://xxx.turso.io?authToken=xxx
   DATABASE_AUTH_TOKEN = [your-auth-token]
   JWT_SECRET = [generate-random-string-see-below]
   CRON_SECRET = [generate-random-string-see-below]
   ```

   **Generate Random Secrets:**
   ```bash
   # In PowerShell
   -join((1..32) | ForEach-Object { [char[]]'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*' | Get-Random })
   ```

### Step 4: Deploy

1. Click "Save and Deploy"
2. Wait for build to complete (5-10 minutes)
3. Your site will be at `https://[project-name].pages.dev`

### Step 5: Set Custom Domain (Optional)

1. After deployment, go to project settings
2. Click "Custom domains"
3. Add your domain
4. Update Cloudflare DNS records as shown

---

## 🔧 Part 4: Post-Deployment Configuration

### Step 1: Run Setup Endpoint (First Time Only)

**IMPORTANT**: This initializes the admin account. Run only once!

```bash
curl -X POST https://[your-domain]/api/setup
```

Response will show:
```json
{
  "success": true,
  "adminCreated": true,
  "message": "Setup complete! Admin account created..."
}
```

**Save the credentials shown - you'll need them to log in**

### Step 2: Seed Data (Optional)

To fill empty chart slots with random data:

1. Log in to admin panel: `https://[your-domain]/admin`
2. Use credentials from setup
3. Go to "Monthly Charts" section
4. Click "Quick Setup" or call:
```bash
curl -X GET https://[your-domain]/api/seed-data \
  -H "Authorization: Bearer [your-jwt-token]"
```

### Step 3: Change Admin Password

1. Log in: `https://[your-domain]/admin`
2. Go to Settings → Change Password
3. Update from `admin123` to strong password

### Step 4: Set Up CRON Jobs (Automated Daily Updates)

Cloudflare Pages doesn't have built-in cron, but you can use external services:

**Option A: Using EasyCron (Free)**
1. Go to https://www.easycron.com
2. Create account
3. Add HTTP task:
   - URL: `https://[your-domain]/api/cron/auto-day`
   - Headers: Add `Authorization: Bearer [CRON_SECRET]`
   - Frequency: Daily at 11:59 PM IST

**Option B: Using GitHub Actions**
1. Create `.github/workflows/daily-cron.yml`:
```yaml
name: Daily Cron Job
on:
  schedule:
    - cron: '30 18 * * *'  # Daily at 11:59 PM IST (adjusted for UTC)

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger daily cron
        run: |
          curl -X GET "https://[your-domain]/api/cron/auto-day" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

2. Add `CRON_SECRET` to GitHub repository secrets

---

## 🧪 Testing Checklist

- [ ] Admin login works at `/admin`
- [ ] Can post results via `/api/results/post`
- [ ] Charts display correctly on public page
- [ ] Settings can be updated
- [ ] Export functionality works
- [ ] No console errors in browser

---

## 🚨 Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | ✅ | `libsql://xxx.turso.io?authToken=yyy` | Turso connection URL |
| `DATABASE_AUTH_TOKEN` | ✅ | `xxx` | Separate auth token (if needed) |
| `JWT_SECRET` | ✅ | Random 32+ chars | Session token secret - MUST be strong |
| `CRON_SECRET` | ✅ | Random 32+ chars | Cron job trigger secret - MUST be strong |

**NEVER commit these to Git!** Use Cloudflare environment variables.

---

## 🔐 Security Notes

### What We Fixed:
✅ Removed hardcoded JWT_SECRET fallback  
✅ Removed hardcoded CRON_SECRET fallback  
✅ Setup endpoint no longer returns passwords  
✅ All admin endpoints require authentication

### Additional Security:
- Rate limiting on login (5 attempts per 15 min)
- bcryptjs for password hashing
- HttpOnly cookies for sessions
- CORS protection

---

## 📊 Database Schema on Turso

Your schema automatically migrates to Turso:

```sql
-- Admin accounts
CREATE TABLE Admin (...)

-- Monthly charts (e.g., Jan 2026)
CREATE TABLE MonthlyChart (...)

-- Daily results (6 time slots per day)
CREATE TABLE DayData (...)

-- Site configuration
CREATE TABLE SiteSettings (...)
```

All data is now stored in Turso's SQLite-compatible database, accessible globally.

---

## 🆘 Troubleshooting

### "JWT_SECRET not set" error
- Add `JWT_SECRET` environment variable to Cloudflare Pages
- Must be a strong random string (32+ characters)

### Database connection fails
- Check `DATABASE_URL` is correctly copied
- Verify auth token is included
- Ensure Turso region is accessible

### Build fails on Cloudflare
```bash
# Run locally to test
npm run build
npm start
```

If it works locally but fails on Cloudflare:
- Check Node.js version in build environment
- Review build logs in Cloudflare dashboard

### Cron job not triggering
- Verify `CRON_SECRET` matches between setup and cron call
- Check EasyCron/GitHub Actions logs
- Ensure API endpoint is reachable

---

## 📈 Monitoring & Maintenance

### Monitor Turso Database:
1. Go to Turso dashboard
2. View usage stats and logs
3. Scale if needed (upgrade from free tier)

### Backup Data:
```bash
# Export from Turso
turso db dump rdl-pro-matka > backup.sql

# Or export via API endpoint
curl https://[your-domain]/api/export/charts > charts-backup.json
```

### Update Deployment:
Just push to GitHub - Cloudflare Pages auto-deploys!

---

## ✅ Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Turso database created and migrated
- [ ] Cloudflare Pages connected to GitHub
- [ ] All environment variables set in Cloudflare
- [ ] Build successful on Cloudflare
- [ ] Setup endpoint called (one-time)
- [ ] Admin login tested
- [ ] Admin password changed
- [ ] Cron job configured
- [ ] Site is live and accessible

---

## 📞 Next Steps

1. **Test thoroughly** in production before announcing
2. **Monitor logs** for first few days
3. **Set up alerts** for errors
4. **Backup regularly** using export endpoints
5. **Update DNS records** if using custom domain

---

## 🎉 You're Live!

Your RDL Pro Matka site is now:
- **Hosted globally** on Cloudflare Pages
- **Database secured** with Turso
- **Auto-deployed** on every Git push
- **Scalable** for growth

Enjoy! 🚀
