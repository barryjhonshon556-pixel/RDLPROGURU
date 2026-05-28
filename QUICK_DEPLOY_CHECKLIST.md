# 🚀 RDL Pro Matka - Quick Start Deployment Checklist

**Estimated time: 30-60 minutes**

Copy this checklist and track your progress!

---

## 📝 Phase 1: Pre-Deployment Setup (10 min)

### GitHub
- [ ] Create GitHub account (if needed)
- [ ] Create repository: `rdl-pro-matka` (PRIVATE)
- [ ] Clone locally: `git clone https://github.com/YOUR_USERNAME/rdl-pro-matka.git`
- [ ] Push code: `git add . && git commit -m "Initial commit" && git push -u origin main`

### Generate Secrets
- [ ] Generate JWT_SECRET (32+ chars, random):
  ```powershell
  -join((1..32) | ForEach-Object { [char[]]'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*' | Get-Random })
  ```
- [ ] Generate CRON_SECRET (32+ chars, random - must be different from JWT_SECRET):
  ```powershell
  -join((1..32) | ForEach-Object { [char[]]'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*' | Get-Random })
  ```
- [ ] Save both secrets securely (you'll need them in step 2)

---

## 🗄️ Phase 2: Turso Database (5 min)

### Create Turso Database
- [ ] Sign up at https://turso.tech
- [ ] Click "Create a database"
- [ ] Name: `rdl-pro-matka`
- [ ] Region: `mia` (or closest to you)
- [ ] Click Create (wait 10-15 seconds)

### Get Turso Credentials
- [ ] Open your database in Turso dashboard
- [ ] Copy **Connection URL**: `libsql://...`
- [ ] Copy **Auth Token**: `xxx`
- [ ] Save both (DATABASE_URL and DATABASE_AUTH_TOKEN)

### Migrate Schema
- [ ] Download Turso CLI: https://github.com/tursodatabase/turso-cli/releases
- [ ] Login: `turso auth login`
- [ ] Run migration: `npx prisma db push`
- [ ] Verify: `turso db shell rdl-pro-matka "SELECT 1"`

---

## ☁️ Phase 3: Cloudflare Pages (10 min)

### Create Cloudflare Account
- [ ] Sign up at https://dash.cloudflare.com
- [ ] Verify email

### Connect GitHub Repository
- [ ] Go to **Pages** in left sidebar
- [ ] Click **"Create a project"**
- [ ] Click **"Connect to Git"**
- [ ] Authorize GitHub
- [ ] Select repository: `rdl-pro-matka`
- [ ] Click **"Begin setup"**

### Configure Build
- [ ] Framework: `Next.js`
- [ ] Build command: `npm run build`
- [ ] Build output directory: `.next`

### Add Environment Variables
In Cloudflare Pages → Build settings → Environment variables:

- [ ] Add `DATABASE_URL` = `libsql://[your-turso-url]?authToken=[token]`
- [ ] Add `DATABASE_AUTH_TOKEN` = `[your-turso-token]`
- [ ] Add `JWT_SECRET` = `[your-generated-secret]`
- [ ] Add `CRON_SECRET` = `[your-generated-secret]`

### Deploy
- [ ] Click **"Save and Deploy"**
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Check for build success ✅
- [ ] Note your site URL: `https://[project-name].pages.dev`

---

## ⚙️ Phase 4: Post-Deployment Setup (5 min)

### Initialize Database (Run Once Only!)
```bash
# Call setup endpoint - THIS CREATES ADMIN ACCOUNT
curl -X POST https://[your-site-url].pages.dev/api/setup

# Response will show setup success
# Save the admin username and password shown!
```

### Test Admin Login
- [ ] Go to `https://[your-site-url].pages.dev/admin`
- [ ] Login with credentials from setup
- [ ] Change password immediately ⚠️

### Verify Features
- [ ] Public page loads: `https://[your-site-url].pages.dev`
- [ ] Admin panel works: `https://[your-site-url].pages.dev/admin`
- [ ] Can view settings
- [ ] Can post test results

---

## 🔄 Phase 5: Cron Job Setup (5 min) - Optional

### Using EasyCron (Free, Recommended)

1. [ ] Sign up at https://www.easycron.com
2. [ ] Go to **"Cron Jobs"**
3. [ ] Click **"Create Cron Job"**
4. [ ] Fill in:
   - URL: `https://[your-site].pages.dev/api/cron/auto-day`
   - Frequency: **Daily**
   - Time: **11:55 PM**
   - HTTP Header: `Authorization: Bearer [CRON_SECRET]`
5. [ ] Save and test
6. [ ] Verify it runs

### Using GitHub Actions (Alternative)

1. [ ] Create `.github/workflows/daily-cron.yml`
2. [ ] Add `CRON_SECRET` to GitHub repository secrets
3. [ ] Push workflow file
4. [ ] Verify workflow runs

---

## 🔐 Phase 6: Security Check (5 min)

- [ ] JWT_SECRET is set and strong
- [ ] CRON_SECRET is set and strong (different from JWT_SECRET)
- [ ] Admin password changed from default
- [ ] No secrets committed to Git
- [ ] Repository is PRIVATE on GitHub
- [ ] Cloudflare environment variables are set
- [ ] Setup endpoint was called only once

---

## 📊 Phase 7: Data Seeding (5 min) - Optional

### Fill Empty Chart Slots
```bash
# This fills any empty slots with random data
# Only works if admin is logged in - would need manual API call or use app UI
curl -X GET https://[your-site].pages.dev/api/seed-data \
  -H "Authorization: Bearer [JWT_TOKEN]"
```

Or:
1. [ ] Log in to admin panel
2. [ ] Go to "Monthly Charts"
3. [ ] Click "Quick Setup" button
4. [ ] System creates charts for past 6 months + current + next month

---

## ✅ Final Verification Checklist

- [ ] **Site is accessible** at your domain
- [ ] **Admin login works** with your credentials
- [ ] **Public page displays** correctly
- [ ] **Charts/results show up** correctly
- [ ] **No console errors** in browser DevTools
- [ ] **Admin functions work**:
  - [ ] Can post result
  - [ ] Can edit result
  - [ ] Can view charts
  - [ ] Can update settings
- [ ] **Mobile responsive** (test on phone)
- [ ] **Database connection** working (no DB errors in logs)
- [ ] **Cron job scheduled** and running daily

---

## 🎉 You're Live!

Your site is now:
- ✅ Hosted globally on Cloudflare Pages
- ✅ Database secured with Turso
- ✅ Auto-deploying on Git push
- ✅ Scalable and production-ready

---

## 📞 Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| Build fails | Check build logs in Cloudflare dashboard |
| Database connection error | Verify DATABASE_URL in Cloudflare env vars |
| Admin login fails | Check JWT_SECRET is set |
| Setup endpoint 403 | Already initialized - normal! |
| Cron not running | Verify CRON_SECRET and EasyCron URL |

---

## 📚 Full Documentation

- **Complete Guide**: See `DEPLOYMENT_GUIDE.md`
- **Turso Setup**: See `TURSO_SETUP_GUIDE.md`
- **Security Notes**: See security fixes in auth.ts

---

## ⏱️ Estimated Timeline

- Pre-deployment: 10 min
- Turso setup: 5 min
- Cloudflare setup: 10 min
- Post-deployment: 5 min
- Cron setup: 5 min
- Security check: 5 min
- Data seeding: 5 min
- **Total: ~45-60 minutes**

---

**Good luck! 🚀 Feel free to refer back to this checklist anytime!**
