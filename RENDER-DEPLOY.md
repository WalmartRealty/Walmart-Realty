# 🚀 Deploying the Backend to Render.com

Once deployed, LOI submissions work from **anywhere in the world** —
hotel Wi-Fi, cell data, home — not just the ICSC conference floor network.

## Cost
- **Starter plan: $7/month** — always on, never sleeps, persistent database disk.
- The free tier spins down after 15 min of inactivity (a 30-second delay for the
  first submission after that — not acceptable at a trade show).

---

## One-time setup (~15 minutes)

### 1. Push your code to GitHub
Make sure `main` branch is up to date:
```bash
cd ~/projects/walmart-realty-github
git push origin main
```

### 2. Create a Render account
Go to https://render.com → **Sign up** (use your work email, or GitHub login).

### 3. Create a new Web Service
- Dashboard → **New +** → **Web Service**
- Connect your GitHub account if prompted
- Select the **walmart-realty-github** repository
- Render will detect `render.yaml` automatically and pre-fill everything

### 4. Set secret environment variables
In the Render dashboard → **Environment** tab, add these manually
(do NOT put real passwords in render.yaml):

| Key | Value |
|-----|-------|
| `SMTP_USER` | your.name@walmart.com |
| `SMTP_PASS` | your email password |
| `SMTP_FROM` | your.name@walmart.com |
| `ADMIN_USERNAME` | RealtyDispo (or whatever you want) |
| `ADMIN_PASSWORD` | A strong password |

### 5. Click "Create Web Service"
- Build takes ~2-3 minutes
- You'll get a URL like: `https://walmart-realty-server.onrender.com`

### 6. Point the admin panel at the new URL
Open the admin panel in your browser and enter the Render URL when prompted.
This saves it to `localStorage` so both the admin AND the public form
(on GitHub Pages) send LOIs to the cloud server automatically.

---

## What changes after deployment

| Before | After |
|--------|-------|
| LOI submissions only work on same WiFi | LOIs work from anywhere |
| If the laptop closes, server goes down | Server runs 24/7 |
| Database only on your laptop | Database on Render's persistent disk |
| Emails sent via local SMTP session | Emails sent from cloud server |

## Keeping your laptop server for local dev
Nothing changes locally. `.env` still works exactly the same.
Run `npm start` locally whenever you want — it just won't be publicly reachable.

---

## After ICSC
For a permanent Walmart-hosted solution, submit to:
**AI Innovation Lab → https://wmlink.wal-mart.com/onboard**

This keeps the project inside Walmart's infrastructure with enterprise
SLAs, security review, and SSO.
