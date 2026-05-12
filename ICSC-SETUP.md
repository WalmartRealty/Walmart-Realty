# 🏪 Walmart Realty — ICSC 2026 Setup Guide

## What's Working

| Feature | How It Works |
|---|---|
| Public site (properties, map, filters) | GitHub Pages — already live, no setup needed |
| LOI submissions from brokers/developers | Copy-to-clipboard + Gmail/email client link |
| Admin panel (manage properties, LOIs) | Local server on your laptop |
| Push property updates to the public site | "🚀 Publish to GitHub Pages" button in admin |

---

## ⚡ Quick Start (Day of Event)

### 1. Open Terminal and run:
```bash
cd ~/projects/walmart-realty-github
./start-icsc.sh
```

### 2. The terminal will show something like:
```
   ✅  SERVER IS READY
   💻  YOUR DEVICE (this laptop):
       Admin:  http://localhost:3000/admin.html
   📱  TEAM DEVICES (same WiFi/hotspot):
       Admin:  http://192.168.1.42:3000/admin.html
```

### 3. Share the team URL with anyone on your booth's WiFi/hotspot.

### 4. Log in with:
- **Username:** `admin`
- **Password:** `WalmartRealty2024!`
> ⚠️ Change this in the admin panel under Settings on first login!

---

## 📱 Sharing with Team Members

**Recommended:** Turn your laptop into a hotspot (Settings → WiFi → Personal Hotspot).
This avoids conference WiFi client-isolation issues.

Team members open:
```
http://[YOUR-IP]:3000/admin.html
```
They'll see a "Connect to Backend Server" prompt on first visit — they enter the URL above.

---

## 🚀 Updating the Public Website

1. Make changes in the admin panel (add/edit/remove properties, update broker info)
2. Click **"🚀 Publish to GitHub Pages"** button
3. Wait ~60 seconds
4. Public site at https://walmartrealty.github.io/Walmart-Realty/ is live!

> **Note:** Requires git to be configured with GitHub access on the laptop.
> Test this BEFORE the event with `git push` from the terminal.

---

## 📄 How LOI Submissions Work

When a broker/developer fills out the LOI form on the public site:

1. They see a **success modal** with:
   - The full LOI details in a copyable text box
   - The **broker's email address** to send to
   - A **"Copy LOI Details"** button
   - A **"Open Gmail"** button (for web email users)

2. They copy the LOI content and send it to the broker via their email

3. Every submission is also CC'd to **realestatedispositions@walmart.com**

> **Pro tip:** If you want automatic emails without user action, set up EmailJS
> (free 200/month at emailjs.com) and add your credentials to index.html.

---

## 🗃️ Viewing LOI Submissions

All LOIs submitted through the form are **emailed directly to the broker**.

To track them in the admin panel:
1. Go to **"📄 LOI Submissions"** tab
2. Manually log any LOIs your team receives via email

To export all logged LOIs as CSV:
- Hit: `http://localhost:3000/api/admin/export-loi` (must be logged in)

---

## 🔧 Troubleshooting

| Problem | Fix |
|---|---|
| Server won't start | `lsof -ti:3000 \| xargs kill -9` then try again |
| Team can't connect | Use a personal hotspot instead of conference WiFi |
| "Connect to Backend" keeps showing | Enter the laptop IP in the prompt: `http://[IP]:3000` |
| GitHub sync fails | Run `git push` manually in terminal |
| Properties not loading in admin | Click "Import Data" and select `properties.json` |

---

## 📞 Key Info

- **Public site:** https://walmartrealty.github.io/Walmart-Realty/
- **Admin panel (local):** http://localhost:3000/admin.html
- **Dispositions team email:** realestatedispositions@walmart.com
- **Azure migration:** After ICSC — contact AI Innovation Lab at wmlink.wal-mart.com/onboard
