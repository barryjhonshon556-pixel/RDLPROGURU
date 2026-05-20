# RDL Pro Matka - Complete Hosting Guide

## How to Download & Host This Project Live

---

## 1. Download the Project

### Option A: Download as ZIP
If you're on a cloud IDE or sandbox, create a zip of the project:

```bash
cd /home/z
zip -r rdl-pro-matka.zip my-project/ \
  -x "my-project/node_modules/*" \
  -x "my-project/.next/*" \
  -x "my-project/db/*.db-journal" \
  -x "my-project/db/*.db-wal" \
  -x "my-project/download/*" \
  -x "my-project/upload/*" \
  -x "my-project/screenshot-*" \
  -x "my-project/agent-ctx/*" \
  -x "my-project/examples/*"
```

Then download the ZIP file through your platform's file browser.

### Option B: Git Clone (Recommended)
If you push the code to GitHub/GitLab:

```bash
git clone https://github.com/YOUR_USERNAME/rdl-pro-matka.git
cd rdl-pro-matka
```

---

## 2. Prerequisites

- **Node.js** 18+ (recommended: 20.x LTS)
- **Bun** (recommended) or npm/yarn/pnpm
- **1GB+ RAM** VPS or hosting

### Install Bun (fastest):
```bash
curl -fsSL https://bun.sh/install | bash
```

### Or install Node.js:
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

---

## 3. Project Setup

```bash
# Navigate to project
cd rdl-pro-matka

# Install dependencies
bun install
# OR: npm install

# Set up environment variables
cp .env.example .env
```

### Environment Variables (.env file):
```env
# Database - SQLite file path
DATABASE_URL="file:./db/custom.db"

# JWT Secret (CHANGE THIS to a long random string!)
# If not set, a dev fallback is used (NOT secure for production)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Cron Secret (for auto-day creation endpoint, optional)
# CRON_SECRET="your-cron-secret-change-this"
```

**IMPORTANT**: Generate strong secrets for production:
```bash
# Generate random JWT secret
openssl rand -base64 48
# Generate random cron secret  
openssl rand -hex 24
```

### Initialize Database:
```bash
# Push Prisma schema to create tables
bun run db:push
```

---

## 4. First-Time Setup (CRITICAL - Do This Before Using the Site!)

After starting the server for the first time, you need to initialize the database:

### Step 1: Start the server
```bash
bun run dev
# OR for production: bun run build && bun start
```

### Step 2: Open the admin panel
Visit: `http://your-domain:3000/?admin`

### Step 3: Run Initial Setup
The admin login page will detect that no admin account exists and show a 
**"First Time Setup"** banner. Click **"Create Admin Account"** to:
- Create default admin credentials: `admin` / `admin123`
- Create current month's chart
- Create past 5 months charts with sample data
- Seed default site settings

### Step 4: Login
After setup, login with:
- **Username**: `admin`
- **Password**: `admin123`

### Step 5: CHANGE THE PASSWORD!
Go to Site Settings → Change Password. **Do NOT keep the default password in production!**

### Alternative: Seed via API
You can also seed by visiting this URL in your browser:
```
http://your-domain:3000/api/seed
```
This creates admin account, charts, and settings automatically.

---

## 5. Running the Project

### Development Mode:
```bash
bun run dev
# Server runs at http://localhost:3000
```

### Production Build:
```bash
bun run build
bun start
# OR: npm run build && npm start
```

---

## 6. Hosting Options

### Option 1: VPS (DigitalOcean, Hetzner, Vultr) - RECOMMENDED

**Best for**: Full control, cheapest ($4-6/month)

#### Step-by-step VPS Setup:

```bash
# 1. SSH into your VPS
ssh root@your-vps-ip

# 2. Install system packages
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx unzip

# 3. Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 4. Clone/upload your project
cd /var/www
# Upload via scp or git clone
git clone https://github.com/YOUR_USERNAME/rdl-pro-matka.git
cd rdl-pro-matka

# 5. Install dependencies and set up
bun install
cp .env.example .env
# Edit .env with your secrets
nano .env

# 6. Initialize database
bun run db:push

# 7. Build for production
bun run build

# 8. Create systemd service for auto-start
cat > /etc/systemd/system/rdl-matka.service << 'EOF'
[Unit]
Description=RDL Pro Matka Next.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/rdl-matka
ExecStart=/root/.bun/bin/bun start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# 9. Start the service
systemctl daemon-reload
systemctl enable rdl-matka
systemctl start rdl-matka

# 10. Check status
systemctl status rdl-matka
```

#### Nginx Reverse Proxy:

```bash
cat > /etc/nginx/sites-available/rdl-matka << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/rdl-matka /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Add SSL (free with Let's Encrypt)
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### Option 2: Render.com (Free Tier Available)

**Best for**: Easy deployment with persistent disk

1. Go to [render.com](https://render.com)
2. Create a new **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Build Command**: `npm install && npx prisma db push && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add a **persistent disk** for the SQLite database (mount at `/opt/render/project/src/db`)
6. Set environment variables:
   - `DATABASE_URL=file:./db/custom.db`
   - `JWT_SECRET=your-strong-secret`
7. After first deploy, visit `https://your-app.onrender.com/api/seed` to initialize data
8. Then visit `https://your-app.onrender.com/?admin` to login

---

### Option 3: Railway.app (Easy + SQLite Compatible)

**Best for**: Simple deployment with persistent storage

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables in Railway dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CRON_SECRET`
6. Railway auto-detects Next.js and deploys
7. Add a persistent volume for the SQLite database

---

## 7. Setting Up Auto-New-Day Cron Job

The site has a `/api/cron/auto-day` endpoint that auto-creates the current month's chart and today's day data. Set up a cron job to call it daily:

### On VPS (crontab):
```bash
# Edit crontab
crontab -e

# Add this line (runs at 00:01 IST / 18:31 UTC previous day)
1 0 * * * curl -s "https://yourdomain.com/api/cron/auto-day?key=YOUR_CRON_SECRET" > /dev/null 2>&1
```

### External Cron Services (if no server access):
Use free services like:
- [cron-job.org](https://cron-job.org) - Free, reliable
- [EasyCron](https://www.easycron.com) - Free tier available

Set the URL to: `https://yourdomain.com/api/cron/auto-day?key=YOUR_CRON_SECRET`

---

## 8. Post-Deployment Checklist

- [ ] Run initial setup (admin login page or `/api/seed`)
- [ ] Change admin password from default `admin123`
- [ ] Set strong `JWT_SECRET` in .env
- [ ] Set strong `CRON_SECRET` in .env
- [ ] Set up SSL/HTTPS (Let's Encrypt)
- [ ] Set up auto-day cron job
- [ ] Update site settings (contact info, marquee text, etc.)
- [ ] Test all features: results posting, chart display, admin login

---

## 9. Updating the Project

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
bun install

# Rebuild
bun run build

# Restart the service (if using systemd)
sudo systemctl restart rdl-matka

# If database schema changed
bun run db:push
```

---

## 10. Backup & Recovery

### Backup the SQLite database:
```bash
# Create a backup
cp /var/www/rdl-matka/db/custom.db /var/backups/rdl-matka-$(date +%Y%m%d).db

# Or export via admin panel:
# Go to Site Settings → Data Export → Export All Charts
```

### Auto-backup cron:
```bash
# Add to crontab (daily at 3 AM)
0 3 * * * cp /var/www/rdl-matka/db/custom.db /var/backups/rdl-matka-$(date +\%Y\%m\%d).db
```

### Restore from backup:
```bash
# Stop the service
sudo systemctl stop rdl-matka

# Restore the database
cp /var/backups/rdl-matka-20260520.db /var/www/rdl-matka/db/custom.db

# Start the service
sudo systemctl start rdl-matka
```

---

## 11. Troubleshooting

### Admin login not working / can't enter password?
This is a cookie issue. If hosting on HTTP (no SSL), the browser may reject secure cookies.
This project automatically detects HTTP vs HTTPS and sets cookies accordingly.
If issues persist, ensure your reverse proxy sends `X-Forwarded-Proto: https` when using SSL.

### Site shows no data?
1. Make sure you ran the initial setup (visit `/?admin` and click "Create Admin Account")
2. Or visit `/api/seed` to seed data
3. Check that the database file exists: `ls -la db/custom.db`

### Site not loading?
```bash
# Check if the service is running
sudo systemctl status rdl-matka

# Check logs
sudo journalctl -u rdl-matka -f

# Check if port 3000 is in use
lsof -i :3000
```

### Database errors?
```bash
# Re-push the schema
cd /var/www/rdl-matka
bun run db:push

# Re-seed (requires admin auth cookie, or use /api/setup if no admin exists)
```

### Nginx 502 Bad Gateway?
```bash
# Check if Next.js is running
curl http://localhost:3000

# Restart both services
sudo systemctl restart rdl-matka
sudo systemctl restart nginx
```

---

## Quick Start Summary (5 minutes)

```bash
# 1. Upload/clone project
git clone YOUR_REPO_URL && cd rdl-pro-matka

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env
# Edit .env with your secrets

# 4. Initialize database
bun run db:push

# 5. Build & start
bun run build
bun start &

# 6. Seed data (creates admin + sample charts)
curl http://localhost:3000/api/seed

# 7. Visit your site!
# Public: http://your-ip:3000
# Admin: http://your-ip:3000/?admin (admin/admin123)

# 8. CHANGE THE ADMIN PASSWORD IMMEDIATELY!
```

---

## Project Structure

```
rdl-pro-matka/
├── prisma/
│   └── schema.prisma          # Database schema
├── db/
│   └── custom.db              # SQLite database file
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main page (public + admin)
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   └── api/               # API routes
│   │       ├── auth/          # Login, logout, me, change-password
│   │       ├── results/       # Today, post, bulk, edit
│   │       ├── charts/        # List, initialize, day, visibility, delete, copy-live
│   │       ├── settings/      # Get, update
│   │       ├── export/        # Charts, today, settings
│   │       ├── cron/          # Auto-day
│   │       ├── seed/          # Seed data
│   │       └── setup/         # Initial setup (public, no auth)
│   ├── components/
│   │   ├── public/            # Public-facing components
│   │   └── admin/             # Admin panel components
│   ├── hooks/
│   │   └── useResults.ts      # Data hooks & types
│   └── lib/
│       ├── constants.ts       # Time slots, slot keys
│       ├── auth.ts            # JWT + bcrypt auth
│       ├── db.ts              # Prisma client
│       ├── ist-date.ts        # IST timezone utility
│       └── admin-fetch.ts     # Authenticated fetch helper
├── .env.example               # Environment template
├── HOSTING_GUIDE.md           # This guide
├── package.json
└── tailwind.config.ts
```

---

## Important Notes

1. **Timezone**: All dates use **IST (Indian Standard Time, UTC+5:30)**. The server automatically converts UTC to IST for all operations. No configuration needed.

2. **Cookie Security**: Admin session cookies automatically detect HTTP vs HTTPS. They use `secure: true` only when the connection is actually HTTPS (or behind an SSL-terminating proxy with `X-Forwarded-Proto: https`).

3. **Auto-Backfill**: When results are fetched for today, missing day rows are automatically created. You don't need to manually add each day.

4. **Data Format**: Each time slot has a single result number (0-99). No Jodi/pairs.
