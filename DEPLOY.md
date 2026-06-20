# Teranga Stay — Deployment Guide

Backend → **Railway** · Frontend → **Vercel** · DB → **MongoDB Atlas** · Storage → **Cloudflare R2** · Auth → **Google Identity Services**

## 1. MongoDB Atlas (free tier)

1. Sign up at https://www.mongodb.com/cloud/atlas → create an **M0** free cluster (any region close to Railway).
2. **Database Access** → add a database user (username + strong password).
3. **Network Access** → add `0.0.0.0/0` (allow from anywhere; Railway IPs change).
4. **Connect** → "Drivers" → copy the connection string. Looks like:
   ```
   mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Save it for the Railway env var `MONGO_URL` (step 4).

## 2. Google OAuth Client (Google Identity Services)

1. https://console.cloud.google.com/apis/credentials → create or pick a project.
2. **OAuth consent screen** → External → fill app name, support email, etc. Add your email as a test user during dev.
3. **Credentials → Create OAuth client ID** → type **Web application**.
4. **Authorized JavaScript origins** — add ALL of:
   - `http://localhost:3000`
   - `https://your-app.vercel.app` (your Vercel URL; add after Vercel deploys, or add later)
5. **Authorized redirect URIs** — leave empty (GIS uses postMessage, no redirect).
6. Copy the **Client ID** (looks like `XXXXX.apps.googleusercontent.com`).
   - Use it as both `GOOGLE_CLIENT_ID` (backend) **and** `REACT_APP_GOOGLE_CLIENT_ID` (frontend).

## 3. Cloudflare R2 (image uploads)

1. https://dash.cloudflare.com → **R2** → enable.
2. **Create bucket** → name it `teranga-stay` (or any).
3. **Manage R2 API Tokens** → Create API token → permissions: "Object Read & Write" on your bucket.
4. Copy: Account ID, Access Key ID, Secret Access Key.
5. (Optional, for public image URLs) Bucket → Settings → Connect a custom domain or enable the public r2.dev URL.

## 4. Backend on Railway

1. Push the repo to GitHub (see "Git setup" below).
2. https://railway.app → New Project → Deploy from GitHub repo → select this repo.
3. **Root Directory**: `backend`
4. **Variables** (Settings → Variables):
   ```
   MONGO_URL=<atlas connection string>
   DB_NAME=teranga_stay
   JWT_SECRET=<openssl rand -base64 32>
   CORS_ORIGINS=https://your-app.vercel.app
   APP_NAME=teranga-stay
   GOOGLE_CLIENT_ID=<from step 2>
   R2_ACCOUNT_ID=<from step 3>
   R2_BUCKET=teranga-stay
   R2_ACCESS_KEY_ID=<from step 3>
   R2_SECRET_ACCESS_KEY=<from step 3>
   ```
5. Railway auto-detects `railway.json` and the start command. After deploy, note the public URL (e.g. `https://yendu-production.up.railway.app`).
6. Test: `curl https://<railway-url>/api/health` → `{"status":"healthy"}`.

## 5. Frontend on Vercel

1. https://vercel.com → New Project → Import from GitHub → select this repo.
2. **Root Directory**: `frontend`
3. Vercel auto-detects CRA. The repo's `vercel.json` handles SPA rewrites.
4. **Environment Variables**:
   ```
   REACT_APP_BACKEND_URL=https://<your-railway-url>
   REACT_APP_GOOGLE_CLIENT_ID=<same as backend>
   ```
5. Deploy. Note the Vercel URL.
6. **Go back to Railway** → update `CORS_ORIGINS` to the Vercel URL → redeploy.
7. **Go back to Google Cloud** → add the Vercel URL to Authorized JavaScript origins.

## 6. Git setup (first-time push)

```bash
cd /Users/mac/Projects/YENDU
git init
git add .
git commit -m "Initial commit — Teranga Stay MVP"
gh repo create yendu --private --source=. --remote=origin
git push -u origin main
```

(If you don't use `gh`, create the repo manually on GitHub then `git remote add origin <url> && git push -u origin main`.)

## 6b. Custom domain — `yendou.sn` (DNS managed at OVH)

Layout: apex `yendou.sn` (+ `www`) → Vercel (site) · `api.yendou.sn` → Railway (API).

1. **Vercel → Project → Settings → Domains** → add `yendou.sn` and `www.yendou.sn`
   (accept the suggested `www` → apex redirect). Vercel shows the exact DNS records.
2. **Railway → backend service → Settings → Networking → Custom Domain** → add
   `api.yendou.sn`. Railway gives you a CNAME target like `xxxx.up.railway.app`.
3. **OVH → Domaines → yendou.sn → Zone DNS** → create:

   | Sous-domaine | Type  | Cible                       |
   |--------------|-------|-----------------------------|
   | (apex/vide)  | A     | `76.76.21.21` (Vercel value)|
   | `www`        | CNAME | `cname.vercel-dns.com.`      |
   | `api`        | CNAME | `xxxx.up.railway.app.`       |

   Keep the trailing dot on CNAME targets. HTTPS certs are issued automatically.
4. Update env vars (then redeploy each side):
   - Railway: `CORS_ORIGINS=https://yendou.sn,https://www.yendou.sn` and `FRONTEND_URL=https://yendou.sn`
   - Vercel: `REACT_APP_BACKEND_URL=https://api.yendou.sn` → **Redeploy** (REACT_APP_* is baked at build).
5. **Google Cloud → OAuth client → Authorized JavaScript origins** → add
   `https://yendou.sn` and `https://www.yendou.sn`.

## 7. Post-deploy checklist

- [ ] `GET /api/health` returns 200 on Railway
- [ ] `GET /api/destinations` returns seeded data (4 destinations)
- [ ] Frontend loads, hero page renders
- [ ] Email login works (use the seeded admin: `admin@terangastay.sn` / `Admin123!`)
- [ ] Google login button appears and signs in
- [ ] Admin image upload uses R2 (Admin → Properties → upload image)
- [ ] Mobile responsive check on real device

## Notes

- The seed runs automatically the first time the DB is empty (see `backend/server.py` startup hook).
- `JWT_SECRET` must be the same across all backend instances if you ever scale to multiple.
- Cost on the recommended path: **$0/month** within free tiers (Atlas M0, Vercel hobby, Railway $5 free credit, R2 10GB free).
