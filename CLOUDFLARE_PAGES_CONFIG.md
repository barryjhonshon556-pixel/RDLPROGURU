# Cloudflare Pages Build Configuration

## Build Settings

**Build Command:**
```
npm run build
```

**Build Output Directory:**
```
.next/server
```

**Node Version:**
```
Node.js 20 (or latest)
```

---

## Environment Variables (Set in Cloudflare Dashboard)

For **Production** environment:

```
DATABASE_URL=libsql://your-database.turso.io?authToken=your-token
DATABASE_AUTH_TOKEN=your-token
JWT_SECRET=your-random-secret-32-chars
CRON_SECRET=your-random-secret-32-chars
NODE_ENV=production
```

---

## Step-by-Step Setup in Cloudflare Pages

### 1. Connect Git Repository
- Go to https://dash.cloudflare.com
- Select **Pages**
- Click **Create a project**
- Select **Connect to Git**
- Choose your GitHub repository: `rdl-pro-matka`

### 2. Configure Build Settings
- **Framework preset**: Select `Next.js`
- **Build command**: `npm run build`
- **Build output directory**: `.next/server`

### 3. Set Environment Variables
- Go to **Settings** → **Environment variables**
- Click **Add environment variable**
- Add these **for Production**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `libsql://your-turso-url?authToken=token` |
| `DATABASE_AUTH_TOKEN` | Your Turso auth token |
| `JWT_SECRET` | Generate random 32+ char string |
| `CRON_SECRET` | Generate different random 32+ char string |
| `NODE_ENV` | `production` |

### 4. Deploy
- Click **Save and Deploy**
- Wait for build to complete (5-10 minutes)
- Check build logs for any errors

---

## Troubleshooting Build Errors

### Error: "Prisma not found"
**Solution**: Ensure `package.json` build script includes `prisma generate`:
```json
"build": "prisma generate && next build"
```

### Error: "DATABASE_URL is not set"
**Solution**: Set environment variables in Cloudflare Pages dashboard, not in `.env` file

### Error: "Cannot find module '@prisma/client'"
**Solution**: Dependencies are installed during build. Check `package-lock.json` is committed to Git.

### Error: "Port already in use"
**Solution**: This is normal on Cloudflare - it assigns its own port

### Error: "Maximum build timeout"
**Solution**: Increase build timeout in Cloudflare if needed. Usually takes 5-10 minutes.

---

## Local Build Testing

Before deploying, test the build locally:

```bash
# Clean build
npm run build

# Start production server
npm start
```

If it works locally, it will work on Cloudflare Pages.

---

## Important Notes

✅ **DO**: Set secrets in Cloudflare dashboard  
❌ **DON'T**: Commit `.env` with secrets to Git  

✅ **DO**: Use SQLite provider with Turso URL  
❌ **DON'T**: Change database provider  

✅ **DO**: Keep same code for local and production  
❌ **DON'T**: Create separate builds  

---

## After Deployment

1. **Get your site URL**: `https://[project-name].pages.dev`

2. **Initialize database** (run once):
   ```bash
   curl -X POST https://[project-name].pages.dev/api/setup
   ```

3. **Test admin login**: `https://[project-name].pages.dev/admin`

4. **Change default password immediately**

---

## Database Connection Flow

```
Cloudflare Pages
    ↓
Environment Variables (DATABASE_URL, etc.)
    ↓
.env loaded by Next.js at build time
    ↓
Prisma Client uses DATABASE_URL
    ↓
Turso Database (libsql://)
    ↓
Your Data (Persistent!)
```

---

For complete deployment guide, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
