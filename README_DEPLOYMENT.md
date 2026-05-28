# 🎯 RDL Pro Matka - Live Deployment Setup

**Next.js + Prisma + Turso + Cloudflare Pages**

Complete guide to deploy your Matka results platform live globally.

---

## 🚀 Quick Start (45 minutes)

**New to deployment?** Start here:

1. **[QUICK_DEPLOY_CHECKLIST.md](./QUICK_DEPLOY_CHECKLIST.md)** ← Start here! ⭐
   - Step-by-step checklist format
   - Estimated time: 45-60 minutes
   - All commands you need

---

## 📚 Complete Documentation

### Deployment Guides

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Full end-to-end setup (Cloudflare + Turso) | 20 min |
| [TURSO_SETUP_GUIDE.md](./TURSO_SETUP_GUIDE.md) | Detailed Turso database configuration | 15 min |
| [QUICK_DEPLOY_CHECKLIST.md](./QUICK_DEPLOY_CHECKLIST.md) | Quick reference checklist | 5 min |
| [HOSTING_GUIDE.md](./HOSTING_GUIDE.md) | Local hosting & VPS options | 10 min |

### Environment Configuration

- **[.env.example](./.env.example)** - All environment variables needed

---

## 🎯 Choose Your Path

### Path 1: Cloud Deployment (Recommended) ☁️
**Best for:** Most users, global reach, zero maintenance
- **Time**: 45-60 minutes
- **Cost**: Free (Cloudflare + Turso free tier)
- **Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**What you get:**
- Global CDN (Cloudflare Pages)
- SQLite-compatible database (Turso)
- Auto-deployment on Git push
- Built-in SSL/HTTPS
- No server maintenance

### Path 2: Self-Hosted VPS 🖥️
**Best for:** Developers, full control needed
- **Time**: 1-2 hours
- **Cost**: $5-20/month for VPS
- **Guide**: [HOSTING_GUIDE.md](./HOSTING_GUIDE.md)

**What you need:**
- Linux VPS or Windows Server
- Node.js + PM2/systemd
- SQLite or PostgreSQL
- Your own domain

### Path 3: Local Development 💻
**Best for:** Testing, development, learning
- **Time**: 10 minutes
- **Cost**: Free
- **Steps**:
  ```bash
  npm install
  npm run db:push
  npm run dev
  # Open http://localhost:3000
  ```

---

## 🔐 Security Fixes Applied

✅ **Fixed in this version:**
- Removed hardcoded JWT_SECRET fallback (now required)
- Removed hardcoded CRON_SECRET fallback (now required)
- Setup endpoint no longer returns passwords
- Rate limiting on login (5 attempts/15 min)
- Bcryptjs password hashing
- HttpOnly secure cookies

⚠️ **Your responsibility:**
- Set strong, random JWT_SECRET (32+ chars)
- Set strong, random CRON_SECRET (32+ chars, different from JWT_SECRET)
- Change admin password after first login
- Keep environment variables secure (never commit to Git)
- Use HTTPS in production

---

## 📊 Tech Stack

```
Frontend:
├── Next.js 16 (React 19)
├── TypeScript
├── Tailwind CSS
└── shadcn/ui components

Backend:
├── Next.js API Routes
├── Node.js runtime
└── bcryptjs + JWT auth

Database:
├── SQLite (local dev)
├── Turso (production - HTTP SQLite)
└── Prisma ORM

Hosting:
├── Cloudflare Pages (frontend)
├── Turso (database)
└── GitHub (Git repository)
```

---

## 📈 Architecture Overview

```
┌─────────────────┐
│  Your Domain    │ (e.g., matka.example.com)
└────────┬────────┘
         │
    ┌────▼────┐
    │Cloudflare│ (CDN + Pages hosting)
    │  Pages   │
    └────┬────┘
         │
    ┌────▼──────────────────┐
    │  Next.js API Routes   │
    │  (Backend logic)       │
    └────┬──────────────────┘
         │
    ┌────▼──────────────────┐
    │   Turso Database      │ (SQLite over HTTP)
    │   (Global replicas)   │
    └──────────────────────┘
```

**Benefits:**
- Static files cached globally (Cloudflare)
- API requests to nearest edge server (fast)
- Database replicated globally (low latency)
- Auto-scaling (no server management)

---

## 🔄 Deployment Workflow

After initial setup, deployment is automated:

```
1. Make code changes locally
   ↓
2. Commit & push to GitHub
   ↓
3. Cloudflare Pages detects push
   ↓
4. Runs: npm run build
   ↓
5. Deploys to global CDN
   ↓
6. Your site is updated (2-5 min)
```

**No manual deployments needed!**

---

## 📝 Environment Variables

### Required Variables

```bash
# Database (for Turso production)
DATABASE_URL=libsql://[database-name].turso.io?authToken=[token]
DATABASE_AUTH_TOKEN=[token]

# Security - MUST be random, strong, different from each other
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx  # 32+ characters
CRON_SECRET=yyyyyyyyyyyyyyyyyyyyyyyyyyyy  # 32+ characters
```

### Generate Random Secrets

**PowerShell:**
```powershell
-join((1..32) | ForEach-Object { [char[]]'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*' | Get-Random })
```

**Bash:**
```bash
openssl rand -base64 32
```

**Online Tool:**
Visit https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&loweralpha=on&unique=on

---

## 🎮 First-Time Admin Setup

After deployment:

1. **Call setup endpoint** (run once):
   ```bash
   curl -X POST https://your-domain.com/api/setup
   ```
   
   This:
   - Creates admin account with username `admin`
   - Sets default password
   - Initializes database tables
   - Seeds past 5 months with sample data

2. **Log in**:
   - URL: `https://your-domain.com/admin`
   - Username: `admin`
   - Password: (from setup response)

3. **Change password immediately** ⚠️

4. **Fill chart data**:
   - Option A: Use admin UI
   - Option B: Call `/api/seed-data` endpoint
   - Option C: Manually post results via `/api/results/post`

---

## 🧪 Testing Your Site

After deployment, verify:

- [ ] Public page loads: `https://your-domain/`
- [ ] Results display correctly
- [ ] Admin login works: `https://your-domain/admin`
- [ ] Can post new result
- [ ] Can edit existing result
- [ ] Charts update properly
- [ ] Settings can be changed
- [ ] Mobile responsive
- [ ] No console errors (F12)

---

## 📱 Mobile/Responsive

Site is fully responsive:
- ✅ Mobile (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)
- ✅ Wide screens (1920px+)

---

## 🚨 Common Issues

### "JWT_SECRET not set"
**Error:** `[FATAL] JWT_SECRET environment variable not set`
- **Fix**: Add `JWT_SECRET` to Cloudflare environment variables
- **Must be**: 32+ characters, random, unique

### "CRON_SECRET not set"
**Error:** `[FATAL] CRON_SECRET environment variable not set`
- **Fix**: Add `CRON_SECRET` to Cloudflare environment variables
- **Must be**: Different from JWT_SECRET

### Database connection error
**Error:** `Error: Unable to connect to database`
- **Fix**: Verify `DATABASE_URL` in Cloudflare env vars
- **Check**: Turso token hasn't expired
- **Try**: Different region if regional issue

### Build fails on Cloudflare
- Check build logs: Cloudflare → Pages → Builds
- Try building locally: `npm run build`
- Verify Node.js version compatible
- Check for missing dependencies

---

## 📞 Support & Resources

### Official Documentation
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Turso**: https://docs.turso.tech
- **Cloudflare Pages**: https://developers.cloudflare.com/pages

### Community
- **Turso Discord**: https://discord.gg/turso
- **Next.js Community**: https://nextjs.org/community
- **Prisma Community**: https://slack.prisma.io

### This Project
- **Repository**: GitHub (Your fork)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

## 📊 Usage Tracking (Optional)

After deployment, monitor:
- **Cloudflare Analytics** - Page views, traffic
- **Turso Dashboard** - Database usage, API calls
- **Admin Panel** - Results posted, users active

---

## 🔄 Maintenance

### Regular Tasks

**Daily:**
- Check cron job ran successfully
- Monitor for errors in logs

**Weekly:**
- Backup database: See [TURSO_SETUP_GUIDE.md](./TURSO_SETUP_GUIDE.md)
- Review analytics

**Monthly:**
- Update dependencies: `npm update`
- Review security logs
- Check for Cloudflare/Turso announcements

### Backup Strategy

```bash
# Manual backup
turso db backup rdl-pro-matka > backup-$(date +%Y%m%d).sql

# Or use GitHub Actions for automated backups
```

---

## 🎓 Learning Resources

If new to any technology:

1. **Next.js basics**: https://nextjs.org/learn
2. **Prisma ORM**: https://www.prisma.io/docs/getting-started
3. **Turso SQLite**: https://docs.turso.tech/guides
4. **Cloudflare Pages**: https://developers.cloudflare.com/pages/get-started

---

## 🎉 You're Ready!

Choose your deployment path above and follow the corresponding guide:

1. **Cloud** (Recommended): [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **VPS Self-hosted**: [HOSTING_GUIDE.md](./HOSTING_GUIDE.md)
3. **Local Dev**: Run `npm install && npm run dev`

---

## 📋 Checklist

- [ ] Read appropriate guide for your deployment path
- [ ] Gather prerequisites (GitHub, Cloudflare, Turso accounts)
- [ ] Generate strong random secrets
- [ ] Follow deployment steps in order
- [ ] Test all features after deployment
- [ ] Change admin password
- [ ] Set up automated backups
- [ ] Monitor first week for issues
- [ ] Share site with users!

---

**Your Matka results platform is ready for the world! 🌍**

Questions? Check the detailed guides or GitHub issues.

Good luck! 🚀
