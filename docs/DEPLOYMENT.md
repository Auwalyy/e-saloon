# Deployment Guide

| Part | Host |
|---|---|
| Database | MongoDB Atlas |
| Backend API | Railway |
| Frontend | Vercel |

Deploy in that order, because each step needs a value from the one before. You will need the code in a GitHub repository and free accounts on all three services.

> **Before pushing to GitHub:** the repository must not contain `node_modules` or any `.env` file. A `.gitignore` is included. If `node_modules` was committed earlier, remove it from version control once (your local copy is kept):
>
> ```bash
> git rm -r --cached backend/node_modules frontend/node_modules
> git commit -m "Stop tracking node_modules"
> ```

---

## 1. Database: MongoDB Atlas

1. Sign in at <https://cloud.mongodb.com> and create a **free (M0) cluster**.
2. **Database Access** → add a database user with a strong password. Note the username and password.
3. **Network Access** → add the IP address `0.0.0.0/0` (allow access from anywhere). Railway does not use fixed IP addresses on its standard plans, so the database password is what protects your data. Make it long and random.
4. **Database** → **Connect** → **Drivers**, and copy the connection string. Insert your password and add the database name `esalon` before the `?`:

   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/esalon?retryWrites=true&w=majority
   ```

   If the password contains special characters such as `@` or `#`, URL-encode them.

---

## 2. Backend: Railway

1. Sign in at <https://railway.app> → **New Project** → **Deploy from GitHub repo** → choose this repository.
2. Open the service → **Settings**:
   - **Root Directory:** `backend`
   - **Start Command:** `npm start` (the default)
3. Open **Variables** and add:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | The Atlas connection string from step 1 |
   | `JWT_SECRET` | A random string of 32 or more characters (see below) |
   | `FRONTEND_URL` | Leave a placeholder for now; you will set it in step 4 |
   | `ADMIN_EMAIL` | The email you will sign in to the dashboard with |
   | `ADMIN_PASSWORD` | A strong password for that account |
   | `ADMIN_NAME` | The administrator's name |
   | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | Your SMTP details (optional but recommended) |
   | `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` | Only if you want online payments |

   Generate the JWT secret on your own computer:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Do not set `PORT`; Railway provides it. Do not set `USE_MEMORY_DB`.

4. **Settings** → **Networking** → **Generate Domain**. Note the URL, for example `https://e-salon-api.up.railway.app`.
5. Open `https://YOUR-API-URL/api/health`. You should see `{"success":true,"status":"ok",...}`.

On its first start the API creates the administrator account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`, and the indexes that prevent double booking.

### Loading demo data (optional)

To fill the live database with the demo catalogue and history, run the seed script from your own computer against Atlas:

```bash
cd backend
# macOS / Linux
MONGODB_URI="your-atlas-connection-string" npm run seed
# Windows PowerShell
$env:MONGODB_URI = "your-atlas-connection-string"; npm run seed
```

Skip this for a real launch and enter your own services and staff through the dashboard instead.

### Email with Gmail

Turn on 2-Step Verification for the Google account, create an **App password**, and use:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=the-16-character-app-password
EMAIL_FROM=Aisha's Salon <you@gmail.com>
```

Without SMTP settings the application still works, but emails are only written to the Railway logs.

---

## 3. Frontend: Vercel

1. Sign in at <https://vercel.com> → **Add New** → **Project** → import the same repository.
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (detected automatically)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add an **Environment Variable**:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://YOUR-API-URL/api` (the Railway URL plus `/api`) |

4. **Deploy**, then note the site URL, for example `https://aishas-salon.vercel.app`.

`frontend/vercel.json` rewrites every path to `index.html`, so refreshing a page such as `/services` works.

> `VITE_` variables are built into the site. After changing one, redeploy.

---

## 4. Connect the two

1. In Railway → **Variables**, set `FRONTEND_URL` to the Vercel URL **exactly**, with no trailing slash:

   ```
   FRONTEND_URL=https://aishas-salon.vercel.app
   ```

   For more than one address (for example a custom domain as well), separate them with commas. The first is used for links in emails.
2. Railway redeploys automatically.

---

## 5. Check the live site

- [ ] The home page shows services, stylists and opening hours.
- [ ] You can register a new customer account.
- [ ] You can sign in to `/admin` with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- [ ] As admin, add a category, a service (with an image) and an employee.
- [ ] As the customer, book an appointment. The chosen time then shows as unavailable.
- [ ] As admin, approve the appointment and record the payment.
- [ ] As the customer, download the receipt from **My Bookings**.
- [ ] If SMTP is configured, the confirmation and receipt emails arrive.
- [ ] In **Settings**, enter the salon's real name, address, phone number and opening hours.

---

## Online payments (optional)

1. Create an account at <https://paystack.com> and copy the keys from **Settings → API Keys & Webhooks**. Use the test keys first.
2. In Railway, set `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY`.
3. In Paystack, set the **Webhook URL** to:

   ```
   https://YOUR-API-URL/api/payments/webhook/paystack
   ```

4. Make a test booking, choose **Pay online now** and pay with one of Paystack's test cards.

The integration follows Paystack's documented flow but has only been checked with the keys absent, so test it with your own test keys before accepting real payments.

---

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| The site loads but shows no data; the browser console shows a CORS error | `FRONTEND_URL` on Railway does not exactly match the site address (check `https`, spelling and no trailing slash) |
| "Cannot reach the server" | `VITE_API_URL` is wrong or missing `/api`. Fix it in Vercel and redeploy |
| The API crashes on start with "Missing required environment variables" | Add `MONGODB_URI` and `JWT_SECRET` in Railway |
| The API cannot connect to MongoDB | Check the password in the connection string and that `0.0.0.0/0` is allowed in Atlas Network Access |
| Refreshing a page gives a 404 | The Vercel Root Directory is not `frontend`, so `vercel.json` is not being used |
| Emails do not arrive | Check the SMTP variables and the Railway logs. With Gmail you must use an App password |
| Appointment times are an hour out | Set `SALON_TIMEZONE` (for example `Africa/Lagos`) |

---

## Keeping it healthy

- **Backups:** turn on backups in Atlas (or export regularly with `mongodump`). Uploaded images live in the database, so they are included.
- **Secrets:** never commit `.env`. Rotate `JWT_SECRET` if it is ever exposed; this signs everyone out.
- **Updates:** pushing to the main branch redeploys both Railway and Vercel. Run `npm run migrate` against the live database after a release that changes indexes.
- **Scaling:** the API keeps no session state in memory, so it can run as several instances (rate-limit counters are then per instance). Reminders are claimed atomically, so each is still sent only once.

---

## Alternative: deploying on Render

Render can host both the API and the website. Use MongoDB Atlas for the database as in step 1 above.

### API (Web Service)

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Environment variables: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (32 or more random characters), `FRONTEND_URL` (the website URL, no trailing slash), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally the `EMAIL_*` and `PAYSTACK_*` values. Do not set `PORT`; Render provides it.

### Website (Static Site)

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Environment variable: `VITE_API_URL` = the API URL plus `/api`, for example `https://e-salon-api.onrender.com/api`.

Under **Redirects/Rewrites** add a rewrite from `/*` to `/index.html`, so refreshing a page such as `/services` works.

### One step with the blueprint

The repository includes `render.yaml`, which defines both services. In Render choose **New > Blueprint**, select the repository, and enter the values it asks for. Deploy the API first, then set `VITE_API_URL` on the website and `FRONTEND_URL` on the API to each other's addresses and redeploy both.

### Free plan note

Render's free web services go to sleep after a period without traffic. The first visit afterwards takes up to a minute while the API wakes, and appointment reminder emails are only sent while it is awake. Use a paid instance for a live salon.
