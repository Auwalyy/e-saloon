# E-Salon Platform for Online Booking and Business Management

**Case study: Aisha's Salon**

A full-stack web application that lets customers book salon appointments online and lets the salon owner run the whole business digitally. It replaces the paper appointment book, manual customer records and manual payment tracking.

It consists of two applications that share one API:

| Application | Who uses it | What it does |
|---|---|---|
| **Customer website** | Customers and visitors | Browse services, stylists, prices and the gallery; book, reschedule and cancel appointments; pay; download receipts; leave reviews |
| **Admin dashboard** | Salon owner / staff | Manage appointments, customers, employees, services, categories, payments, inventory, reviews, gallery, reports and settings |

---

## Contents

1. [Features](#features)
2. [Technology stack](#technology-stack)
3. [Project structure](#project-structure)
4. [Installation guide](#installation-guide)
5. [Environment variables](#environment-variables)
6. [Demo accounts](#demo-accounts)
7. [Available scripts](#available-scripts)
8. [How the key parts work](#how-the-key-parts-work)
9. [Security](#security)
10. [Design decisions and scope notes](#design-decisions-and-scope-notes)
11. [Further documentation](#further-documentation)

---

## Features

### Customer website

- **Pages:** Home, About, Services, Gallery, Stylists, Pricing, Book Appointment, My Bookings, Reviews, Contact, Login, Register, Forgot Password, Reset Password, Profile, Settings.
- **Home:** hero, popular services, featured stylists, why choose us, customer reviews, gallery, working hours, FAQs, call to action, footer.
- **Services:** cards with image, name, description, duration, price and a Book button, with search, category and price filters, sorting and pagination.
- **Gallery:** Hair, Braids, Facials, Spa, Makeup and Pedicure categories with a lightbox.
- **Stylists:** photo, experience, specialisation, working days, rating and a Book button.
- **Booking wizard:** Service → Stylist → Date → Time slot → Payment method → Confirmation. Only dates with free slots can be picked, and unavailable times are disabled.
- **Account:** edit profile, upload a photo, change password, appointment history, payments, download receipts and invoices, cancel and reschedule appointments, leave reviews, notification preferences.

### Admin dashboard

- **Overview:** today's, weekly and monthly revenue, outstanding payments, total customers, employees and bookings, pending / completed / cancelled counts, plus charts for revenue, booking statistics, bookings per month, customer growth and popular services.
- **Appointments:** view, search, filter, approve, reject, cancel, reschedule, assign another stylist, mark completed or no-show, delete, and book on behalf of a customer.
- **Customers:** list, search, booking history, spending history, deactivate / reactivate, add walk-in customers.
- **Employees:** add, edit, delete, upload a photo, assign services, working days and hours, view weekly schedules.
- **Services and categories:** full CRUD with images and active / inactive status.
- **Payments:** payment ID, customer, amount, method, status and date; record payments; refunds; PDF invoices and receipts.
- **Inventory:** products, stock levels, suppliers, low-stock alerts, purchases, sales and adjustments with a full movement history.
- **Reviews:** approve, hide, reply and delete.
- **Reports:** daily, weekly, monthly and annual, exportable to PDF and Excel.
- **Settings:** business name, logo, address, email, phone, opening hours, social links, booking rules and the contact-form inbox.

### Automation

- Confirmation email, receipt and admin notification after every booking.
- Emails for registration, booking confirmation, status changes, reminders (about 24 hours before), cancellation, password reset and payment receipts.
- Dashboard notifications for customers and admins, with an SMS-ready gateway layer.

---

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, React Hook Form, Axios, Framer Motion, React Icons, Recharts |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Authentication | JWT, bcrypt |
| Image storage | MongoDB (binary documents served by the API) |
| Email | Nodemailer |
| Documents | PDFKit (receipts, invoices, reports), ExcelJS (Excel export) |
| Payments | Pay at salon (cash, POS, bank transfer); optional online payment with Paystack |
| Deployment | Frontend on Vercel, backend on Railway, database on MongoDB Atlas |

---

## Project structure

```
e-saloon/
├── backend/
│   ├── app.js                 Express app: security, parsing, routes, errors
│   ├── server.js              Entry point: database, HTTP server, background jobs
│   ├── config/                Environment, database and email configuration
│   ├── controllers/           Request handlers (one file per resource)
│   ├── routes/                URL-to-controller mapping
│   ├── middleware/            Auth, validation, sanitising, uploads, error handling
│   ├── models/                Mongoose schemas (the data model)
│   ├── services/              Business logic: slots, payments, email, PDF, reports
│   ├── validators/            Input validation rules
│   ├── utils/                 Helpers: errors, time and timezone maths
│   ├── database/              migrate.js (indexes) and seed.js (demo data)
│   └── scripts/               dev-memory.js (run without installing MongoDB)
├── frontend/
│   └── src/
│       ├── components/        ui/ (generic), common/ (website), admin/ (dashboard)
│       ├── pages/             customer/, auth/ and admin/ pages
│       ├── layouts/           CustomerLayout, AuthLayout, AdminLayout
│       ├── context/           AuthContext, SettingsContext
│       ├── hooks/             useFetch, useDebounce, useDocuments
│       ├── services/          Axios client and one API object per resource
│       ├── routes/            ProtectedRoute, GuestRoute
│       └── utils/             Formatting and validation helpers
└── docs/                      API reference, database design, diagrams, deployment
```

The backend follows the **MVC pattern** with a service layer: routes → validators → controllers → services → models.

---

## Installation guide

### Requirements

- Node.js 18 or newer
- MongoDB 6 or newer (local, or a free MongoDB Atlas cluster). *Not needed for the quick start below.*

### Quick start (no database to install)

This runs the API against an in-memory MongoDB that is loaded with demo data on every start. It is the fastest way to see the system working. **Data is lost when the server stops.**

```bash
# Terminal 1: API on http://localhost:5000
cd backend
npm install
npm run dev:memory

# Terminal 2: website on http://localhost:5173
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173> and sign in with one of the [demo accounts](#demo-accounts).

> The first run downloads a MongoDB binary (about 80 MB), so it can take a few minutes.

### Normal setup (persistent database)

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env          # then edit .env (see below)
npm run migrate               # create collections, indexes and the admin account
npm run seed                  # optional: load demo data
npm run dev                   # API on http://localhost:5000

# 2. Frontend (second terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                   # website on http://localhost:5173
```

On Windows PowerShell use `Copy-Item .env.example .env` instead of `cp`.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | API port (default `5000`) |
| `MONGODB_URI` | Yes in production | MongoDB connection string |
| `USE_MEMORY_DB` | No | `true` runs on an in-memory database with demo data |
| `JWT_SECRET` | Yes in production | Random string of at least 32 characters used to sign tokens |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `7d`) |
| `JWT_COOKIE_EXPIRES` | No | Cookie lifetime in days (default `7`) |
| `FRONTEND_URL` | Yes in production | Allowed browser origin(s), comma separated. The first is used in email links |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | No | The first administrator, created when none exists |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | No | SMTP settings. When blank, emails are logged to the console instead of sent |
| `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` | No | Enables online card payment. When blank, only pay-at-salon methods are offered |
| `SALON_TIMEZONE` | No | Default `Africa/Lagos` |
| `SMS_PROVIDER` | No | Default `console` (logs messages) |

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL. Keep `/api` in development (Vite proxies it to port 5000). In production set it to the deployed API, for example `https://your-api.up.railway.app/api` |

---

## Demo accounts

Created by `npm run seed` and by `npm run dev:memory`.

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@aishasalon.com` | `Admin@123456` |
| Customer | `aisha@example.com` (and nine others) | `Customer@123` |

**Change the admin password before going live**, or set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first start.

---

## Available scripts

### Backend

| Command | What it does |
|---|---|
| `npm run dev` | Start the API with auto-reload |
| `npm start` | Start the API (production) |
| `npm run dev:memory` | Start the API on an in-memory database with demo data |
| `npm run migrate` | Create collections, synchronise indexes, create the admin account |
| `npm run seed` | Load demo data into an empty database |
| `npm run seed -- --fresh` | **Erase all data**, then load demo data |

### Frontend

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |

---

## How the key parts work

### Preventing double booking

Time is divided into 15-minute blocks. When an appointment is booked, one `BookedSlot` document is inserted for each block it covers, and the collection has a **unique index on (employee, date, block)**. If two customers try to take overlapping times at the same instant, MongoDB accepts one insert and rejects the other, so exactly one booking succeeds and the other customer is asked to choose another time. No transactions or locks are needed.

Slots are released when an appointment is cancelled, rejected, marked no-show or moved.

### Availability

A time is offered only when the salon is open, the stylist works that day, the whole service fits inside both sets of hours, the time is not in the past and none of its blocks is taken. The API returns every slot with an `available` flag, and the calendar only enables dates that still have at least one free slot.

### Appointment lifecycle

```
pending ──approve──▶ confirmed ──▶ completed
   │                     │
   ├──reject──▶ rejected  ├──▶ no_show
   └──cancel──▶ cancelled └──▶ cancelled
```

Customers can cancel or reschedule online until a configurable number of hours before the start time (default 2).

### Payments

Every booking creates one payment record. It is settled either at the salon (an administrator records cash, POS or transfer) or online through Paystack. When a payment is recorded, a numbered PDF receipt is generated and emailed. Paying online confirms the appointment automatically.

### Images

Uploaded images (JPEG, PNG, WebP or GIF, up to 3 MB) are stored in MongoDB and served from `GET /api/media/:id`, so no external storage account is required.

---

## Security

| Measure | Implementation |
|---|---|
| Password hashing | bcrypt, 12 rounds |
| Authentication | JWT, sent as a Bearer token and set as an httpOnly, Secure, SameSite cookie |
| Role-based authorisation | `protect` and `authorize('admin')` middleware; customers can only read their own bookings, payments and receipts |
| CSRF protection | Bearer tokens are not sent automatically by browsers. Cookie-authenticated requests that change data must also send an `X-CSRF-Token` header that matches a claim signed inside the JWT |
| HTTP headers | Helmet |
| Rate limiting | 600 requests per 15 minutes per IP overall, 20 on credential endpoints, 5 per hour on the contact form |
| Input validation | express-validator on every write endpoint, plus Mongoose schema validation |
| XSS protection | HTML is stripped from all incoming strings; React escapes output |
| NoSQL injection | Keys starting with `$` or containing `.` are removed from input; search text is escaped before use in a regular expression |
| CORS | Only origins listed in `FRONTEND_URL` are allowed |
| Password reset | Random single-use token, stored only as a SHA-256 hash, valid for 30 minutes |
| Session invalidation | Tokens issued before a password change stop working |
| Account enumeration | Login and forgot-password give the same response whether or not the email exists |
| Uploads | File type and size are checked in the browser and again on the server |
| Privilege escalation | The role is never accepted from client input |

---

## Design decisions and scope notes

- **MongoDB instead of PostgreSQL.** The brief names MongoDB as the database, so the "tables" it lists are implemented as MongoDB collections. The mapping, and where it differs from a relational design, is documented in [docs/DATABASE.md](docs/DATABASE.md).
- **Customers are users.** Customer profile fields live on the `users` collection (distinguished by `role`) instead of a separate `customers` collection, which avoids a lookup on every request.
- **Availability is embedded.** A stylist's weekly working hours are stored on the employee document, and the salon's opening hours on the settings document.
- **Image storage.** Images are stored in MongoDB as requested, not on Cloudinary. To move to Cloudinary later, only `backend/services/media.service.js` needs to change.
- **Online payment is optional.** Paystack is implemented (initialise, verify, webhook). It stays switched off until keys are added, and has not been exercised against Paystack's live service. Flutterwave is not implemented.
- **SMS is architecture only.** `backend/services/sms.service.js` defines the gateway interface and a console provider. Plug in a real provider (for example Termii or Twilio) to send texts.
- **Refunds are a record.** Marking a payment as refunded updates the books; the money itself is returned outside the system.
- **Reminders** are sent by an in-process scheduler, so the API must be running continuously (it is on Railway).

---

## Further documentation

| Document | Contents |
|---|---|
| [docs/API.md](docs/API.md) | REST API reference |
| [docs/DATABASE.md](docs/DATABASE.md) | Database design and ER diagram |
| [docs/DIAGRAMS.md](docs/DIAGRAMS.md) | Use case, sequence, class and architecture diagrams |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploying to MongoDB Atlas, Railway and Vercel |
