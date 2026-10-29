# Insiders Media website and booking backend

One Vercel project: the website (static files) plus the booking backend (serverless functions). Nothing else to host.

## Folder map

```
insiders-media/
  public/                      the website that visitors see
    index.html                 page shell and all page content
    assets/css/main.css        all styling
    assets/js/app.js           all behaviour (Alex, forms, booking calendar)
    assets/js/site.config.js   GENERATED from site.config.json, do not edit
    assets/img/                logos, favicon, social share image
    robots.txt
  api/                         the backend (Vercel functions)
    booking.js                 shows free slots, creates bookings, blocks double booking, sends emails
    admin.js                   one-click Mark as paid / Cancel links and the bookings list
    _lib/                      storage, email, rules, email templates
  scripts/
    build.js                   turns site.config.json into site.config.js (Vercel runs it for you)
    dev-server.js              run the whole thing on your own computer: npm run dev
  site.config.json             THE ONE FILE YOU EDIT: prices, copy, hours, testimonials, services
  vercel.json                  Vercel settings
  package.json                 one dependency (nodemailer, for Gmail)
  .env.example                 list of settings to add in the Vercel dashboard
```

## Deploy (about 15 minutes)

### 1. Put the folder on Vercel
Easiest way: create a private repository on GitHub, upload this folder's contents to it, then in Vercel choose **Add New > Project**, import that repository and press **Deploy**. Leave every setting as it is.
(Alternative: install Node, open a terminal in this folder, run `npx vercel`, and answer the questions.)

### 2. Add the database (this is what stops double booking)
Vercel project > **Storage** tab > **Create Database** > **Upstash Redis** > pick the free plan > connect it to this project. Vercel adds the database settings for you.

### 3. Add email
Choose one.

**A) Gmail (simplest)**
1. Go to myaccount.google.com/security with insidersmedia.agency@gmail.com and turn on **2-Step Verification**.
2. Search the page for **App passwords**, create one named "Insiders website", and copy the 16 characters.
3. In Vercel > **Settings > Environment Variables** add:
   - `GMAIL_USER` = insidersmedia.agency@gmail.com
   - `GMAIL_APP_PASSWORD` = the 16 characters

**B) Resend (better inbox delivery, needs DNS access)**
Create an account at resend.com, verify insidersmedia.xyz, create an API key, then add `RESEND_API_KEY` and `MAIL_FROM` (for example `Insiders Media <bookings@insidersmedia.xyz>`).

### 4. Add the other settings (same place)
- `ADMIN_KEY` = a long random text (30+ characters). It protects the Mark as paid buttons and the bookings list.
- `OWNER_EMAIL` = where booking notifications go (insidersmedia.agency@gmail.com)
- `PAY_URL` = your Stripe Payment Link or PayPal.me link (sent to consultation clients). Optional but recommended.
- `MEETING_LINK` = your Google Meet or Zoom link (put in confirmations). Optional.
- `SITE_URL` = https://insidersmedia.xyz

### 5. Redeploy
Vercel > **Deployments** > the three dots on the latest one > **Redeploy**. Settings only apply to new deployments.

### 6. Check it
Open `https://YOUR-SITE/api/booking?action=health`. You should see `"storage":"redis"`, `"storage_ready":true`, and `"email":"gmail"` (or `resend`). If something says `none`, that part is missing.
Then book a discovery call on the live site with another email address. You should receive the confirmation, and the agency inbox should receive the full details.

### 7. Connect your domain
Vercel project > **Settings > Domains** > add insidersmedia.xyz and follow the DNS instructions.

## Running the business

- **New booking:** you get an email with every detail the client typed. Free calls are already confirmed.
- **Paid consultation:** the client gets your payment link and the slot is held for 24 hours. When the money arrives, press **Mark as paid and confirm** in your notification email. The client gets a confirmation and a calendar file. If you do nothing, the slot frees itself after 24 hours.
- **See everything:** `https://YOUR-SITE/api/admin?key=YOUR_ADMIN_KEY` lists all bookings with Mark paid and Cancel buttons. Keep that link private.
- **Change anything on the site:** edit `site.config.json` (prices, hours, texts, testimonials, video links). Commit and Vercel redeploys.
- **Change open hours:** `availability` in `site.config.json` (hours are in Pakistan time, `weekdays` uses 0 = Sunday).

## Try it on your own computer

```
npm install
npm run dev
```
Open http://localhost:3000. Emails are printed instead of sent and bookings are kept in memory.

## Limits to know

- Gmail allows about 500 emails a day, which is far above your volume.
- Free Upstash allows 10,000 database commands a day, roughly several hundred bookings.
- All pages live under one address with `#` links (for example `/#services`). Google will not list them as separate pages. Splitting them into real pages is a later upgrade if SEO becomes important.

## If Vercel says something about "api" or "functions"

Open your GitHub repository main page. These must be listed at the TOP level: `api`, `public`, `scripts`, `package.json`, `vercel.json`, `site.config.json`.
If you instead see one folder (for example `insiders-media`) containing them, either move the contents up one level, or in Vercel go to Settings > General > Root Directory and enter that folder name, then redeploy.
