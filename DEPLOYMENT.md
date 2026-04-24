# Walmart Realty - Deployment Guide

## 🚀 How Deployment Works

**Every push to `main` automatically deploys to GitHub Pages.**

No manual steps needed! Just:
```bash
git add -A
git commit -m "Your changes"
git push origin main
```

The site will be live at https://walmartrealty.github.io/Walmart-Realty/ within ~1 minute.

---

## 🛡️ Safeguards (Deployment Will FAIL If...)

The deployment workflow validates these before deploying:

| Check | What It Does |
|-------|--------------|
| `properties.json` exists | ❌ Fails if file is missing |
| `properties.json` is valid JSON | ❌ Fails if JSON is malformed |
| `properties.json` has properties | ❌ Fails if array is empty |
| `index.html` exists | ❌ Fails if missing |
| `app.js` exists | ❌ Fails if missing |
| `app.js` syntax check | ❌ Fails if JavaScript has syntax errors |

**If any check fails, the old working version stays live.** Nothing breaks!

---

## 🔧 If Something Goes Wrong

### Check deployment status:
https://github.com/WalmartRealty/Walmart-Realty/actions

### If deployment failed:
1. Click the failed workflow run
2. Read the error message
3. Fix the issue locally
4. Push again

### If site shows 0 properties:
1. Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
2. Check browser console for errors (Right-click → Inspect → Console)
3. Verify `properties.json` is valid: `python3 -c "import json; json.load(open('properties.json'))"`

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main public-facing site |
| `app.js` | All JavaScript logic |
| `properties.json` | Property data (276 properties) |
| `admin.html` | Admin panel (when running with backend) |
| `.github/workflows/deploy.yml` | Auto-deployment workflow |
| `bundled-index.html` | Standalone version for puppy.walmart.com |

---

## 👤 Contact

For issues with the deployment, check GitHub Actions logs first.
