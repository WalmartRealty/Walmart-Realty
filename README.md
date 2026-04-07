# Walmart Realty Platform

A property management and listing platform for Walmart Real Estate brokers.

## 🏠 Features

- **Public Property Listings** - Browse available Walmart properties
- **Admin Dashboard** - Manage properties, upload images, track inquiries
- **LOI Document Templates** - Pre-built Letter of Intent documents
- **Responsive Design** - Works on desktop and mobile

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Server runs on `http://localhost:3000`

## 📊 Admin Access

- **URL:** `/admin.html`
- **Default Login:** `admin` / `admin123`

> ⚠️ Change the default password after first login!

## 🌐 Deployment (Render.com)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) and connect your GitHub
3. Create a new **Web Service**
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add a **Disk** for persistent SQLite storage:
   - Mount path: `/data`
   - (Update server to use `/data/database.sqlite` in production)

## 📁 Project Structure

```
├── index.html          # Public property listings
├── admin.html          # Admin dashboard
├── app.js              # Frontend JavaScript
├── server/
│   ├── index.js        # Express server & API
│   └── database.js     # SQLite database setup
├── database.sqlite     # Property database
├── loi-documents/      # LOI templates
└── spark-logo.png      # Walmart branding
```

## 🎨 Built With

- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **Frontend:** Vanilla JS + Tailwind CSS
- **Auth:** JWT tokens

---

*Walmart Realty Team | ICSC 2026*
