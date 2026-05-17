# 📋 ICSC LOI Tracking — Power Automate Setup
**Time required: ~10 minutes. Works from any network. 100% Microsoft / Walmart stack.**

---

## How it works after setup
1. Broker fills out LOI form on the public site (any device, any network)
2. Form POSTs directly to Microsoft's servers (Power Automate)
3. **RE Dispo Teams channel** gets an instant card with all LOI details
4. **SharePoint list** gets a new row — leadership can view in real time
5. **Email** sent to realestatedispositions@walmart.com

No laptop server required. No external hosting. Just Microsoft 365.

---

## Step 1 — Create the Power Automate flow (8 minutes)

1. Open **https://make.powerautomate.com** (sign in with your Walmart account)
2. Click **+ Create** → **Instant cloud flow**
3. Choose **"When an HTTP request is received"** as the trigger → click **Create**
4. In the trigger card, click **"Use sample payload to generate schema"** and paste:

```json
{
  "submittedAt": "2026-05-17T12:00:00Z",
  "property": "Baton Rouge, LA",
  "propertyId": "384",
  "loiType": "Building Lease",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "company": "Acme Corp",
  "companyAddress": "123 Main St, Baton Rouge LA"
}
```

5. Click **Done** — Power Automate builds the schema automatically

### Add Action 1 — Post to Teams
- Click **+ New step** → search **"Post message in a chat or channel"** → select it
- **Post as:** Flow bot
- **Post in:** Channel
- **Team:** Dispo
- **Channel:** RE Dispo
- **Message:** (click the lightning bolt icon to insert dynamic values)

```
📋 New LOI Submission

🏢 Property: [property]
📄 LOI Type: [loiType]
👤 [firstName] [lastName] — [company]
📧 [email]
📞 [phone]
📍 [companyAddress]
🕐 Submitted: [submittedAt]
```

### Add Action 2 — Send email notification
- Click **+ New step** → search **"Send an email (V2)"** → select it
- **To:** realestatedispositions@walmart.com
- **Subject:** `New LOI: [loiType] — [property]`
- **Body:** same fields as above

### Add Action 3 — Save to SharePoint (optional but recommended)
- Click **+ New step** → search **"Create item"** → SharePoint → Create item
- **Site Address:** your SharePoint site (WMRE or Brett & Shane)
- **List Name:** create a new list called "ICSC LOI Submissions" first
  - Go to your SharePoint site → + New → List → Blank list → name it
  - Add columns: Property, LOI Type, First Name, Last Name, Email, Phone, Company, Submitted At
- Map the dynamic values to each column

6. Click **Save** (top right)
7. **Copy the HTTP POST URL** from the trigger card — it looks like:
   `https://prod-xx.westus.logic.azure.com:443/workflows/abc123.../triggers/manual/paths/invoke?...`

---

## Step 2 — Add the webhook URL to the admin panel (30 seconds)

1. Open your admin panel (http://localhost:3000/admin.html or wherever it's running)
2. If you see the setup screen, paste the Power Automate URL into the
   **"Power Automate webhook"** field and click Save
3. If you're already logged in, open your browser console (F12) and run:
   ```javascript
   localStorage.setItem('paWebhookUrl', 'PASTE-YOUR-URL-HERE');
   ```
   Then refresh.

This setting is saved in the browser. Every device that visits the admin panel
and has this URL set will send LOIs to Power Automate automatically.

---

## Step 3 — Test it

1. Go to **https://walmartrealty.github.io/Walmart-Realty/**
2. Click on any property → Submit LOI
3. Fill in the form and submit
4. Within 30 seconds you should see:
   - A card appear in your **RE Dispo Teams channel**
   - An email at **realestatedispositions@walmart.com**
   - A new row in your SharePoint list (if configured)

---

## What happens if Power Automate is down?
The form has three layers:
1. ✅ **Power Automate webhook** (works anywhere) — primary
2. ✅ **Local server** (if laptop is on same WiFi) — secondary
3. ✅ **Mailto to broker** (always works) — final fallback

Even if Power Automate has an outage (extremely rare for Microsoft infra),
the form still opens an email to the broker as a last resort.
