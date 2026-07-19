# Aisha's Salon — E-Salon Platform

> Design and Implementation of an E-Salon Platform for Online Booking and Business Management

A full-stack, production-ready salon management system built for Aisha's Salon, Lagos. Customers can book appointments online; admins manage every aspect of the business digitally.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Storage | Cloudinary |
| Payments | Paystack + Flutterwave |
| Email | Nodemailer (Gmail SMTP) |
| PDF | PDFKit |
| Excel | SheetJS (xlsx) |
| Charts | Recharts |

---

## Project Structure

```
e-saloon/
├── backend/
│   ├── config/          # DB, Cloudinary, Email config
│   ├── controllers/     # Route handlers
│   ├── database/        # Migrations & seed data
│   ├── middleware/       # Auth, error, upload, validate
│   ├── routes/          # Express routers
│   ├── services/        # Email, payment, PDF, notifications
│   ├── utils/           # Helpers
│   ├── validators/      # express-validator rules
│   ├── app.js
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/  # UI, admin, common components
    │   ├── context/     # AuthContext
    │   ├── hooks/       # useFetch, usePagination
    │   ├── layouts/     # CustomerLayout, AdminLayout
    │   ├── pages/       # auth/, customer/, admin/
    │   ├── routes/      # ProtectedRoute, GuestRoute
    │   ├── services/    # Axios API layer
    │   ├── utils/       # helpers.js
    │   ├── App.jsx
    │   └── main.jsx
    └── .env.example
```

---

## Installation Guide

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- Cloudinary account
- Paystack account
- Gmail account (for SMTP)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

```bash
# Backend
cp .env.example .env
# Edit .env with your credentials

# Frontend
cp .env.example .env
# Edit .env with your keys
```

### 3. Setup Database

```bash
cd backend

# Run migrations (creates all tables)
npm run migrate

# Seed initial data (admin user, categories, services, employees)
npm run seed
```

### 4. Run Development Servers

```bash
# Backend (port 5000)
cd backend
npm run dev

# Frontend (port 5173)
cd frontend
npm run dev
```

### 5. Access the Application

| URL | Description |
|---|---|
| http://localhost:5173 | Customer Website |
| http://localhost:5173/admin | Admin Dashboard |
| http://localhost:5000/api/health | API Health Check |

### Default Admin Credentials
```
Email:    admin@aishasalon.com
Password: Admin@123456
```

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require:
```
Authorization: Bearer <token>
```

### Endpoints

#### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /auth/register | No | Register new customer |
| POST | /auth/login | No | Login |
| POST | /auth/logout | No | Logout |
| GET | /auth/me | Yes | Get current user |
| PUT | /auth/profile | Yes | Update profile |
| PUT | /auth/change-password | Yes | Change password |
| PUT | /auth/avatar | Yes | Upload avatar |
| POST | /auth/forgot-password | No | Request reset link |
| POST | /auth/reset-password | No | Reset password |

#### Appointments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /appointments | Yes | List appointments |
| GET | /appointments/:id | Yes | Get appointment |
| POST | /appointments | Yes | Create appointment |
| PUT | /appointments/:id | Yes | Update appointment |
| DELETE | /appointments/:id | Admin | Delete appointment |
| GET | /appointments/slots | Yes | Get available time slots |

#### Services
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /services | No | List services |
| GET | /services/:id | No | Get service |
| POST | /services | Admin | Create service |
| PUT | /services/:id | Admin | Update service |
| DELETE | /services/:id | Admin | Deactivate service |

#### Employees
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /employees | No | List employees |
| GET | /employees/:id | No | Get employee |
| GET | /employees/by-service/:serviceId | No | Employees for a service |
| POST | /employees | Admin | Add employee |
| PUT | /employees/:id | Admin | Update employee |
| DELETE | /employees/:id | Admin | Deactivate employee |
| PUT | /employees/:id/availability | Admin | Update availability |

#### Payments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /payments | Yes | List payments |
| POST | /payments/initialize | Yes | Initialize payment |
| POST | /payments/verify | Yes | Verify payment |
| GET | /payments/:id/receipt | Yes | Download PDF receipt |

#### Reports (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | /reports?type=monthly | Get report data |
| GET | /reports/export/pdf | Export PDF report |
| GET | /reports/export/excel | Export Excel report |

---

## Database Schema (ER Diagram)

```
users (id, name, email, phone, password, role, avatar, is_active)
  │
  ├──< customers (id, user_id, gender, total_visits, total_spent)
  │
  ├──< employees (id, user_id, specialization, experience_years, bio)
  │       │
  │       ├──< availability (id, employee_id, day_of_week, start_time, end_time)
  │       └──< employee_services (employee_id, service_id)
  │
  ├──< appointments (id, customer_id, employee_id, service_id, date, time, status)
  │       │
  │       └──< payments (id, appointment_id, customer_id, amount, method, status)
  │
  ├──< reviews (id, customer_id, employee_id, service_id, appointment_id, rating)
  └──< notifications (id, user_id, title, message, is_read)

categories (id, name, description, image)
  └──< services (id, category_id, name, price, duration, image, is_featured)

gallery (id, title, image_url, category, is_featured)
inventory (id, name, quantity, reorder_level, supplier)
  └──< inventory_transactions (id, inventory_id, type, quantity)
settings (id, key, value)
password_reset_tokens (id, user_id, token, expires_at, used)
```

---

## Use Case Diagram

```
                    ┌─────────────────────────────────┐
                    │         E-Salon System           │
                    │                                  │
  ┌──────────┐      │  ○ Register / Login              │
  │ Customer │─────▶│  ○ Browse Services               │
  └──────────┘      │  ○ Book Appointment              │
                    │  ○ Choose Stylist & Time Slot    │
                    │  ○ Make Payment (Paystack/FLW)   │
                    │  ○ View My Bookings              │
                    │  ○ Cancel / Reschedule           │
                    │  ○ Leave Review                  │
                    │  ○ Download Receipt              │
                    │  ○ Edit Profile                  │
                    │                                  │
  ┌──────────┐      │  ○ View Dashboard Analytics      │
  │  Admin   │─────▶│  ○ Manage Appointments           │
  └──────────┘      │  ○ Manage Services & Categories  │
                    │  ○ Manage Employees              │
                    │  ○ Manage Customers              │
                    │  ○ Manage Payments               │
                    │  ○ Manage Inventory              │
                    │  ○ Moderate Reviews              │
                    │  ○ Manage Gallery                │
                    │  ○ Generate Reports (PDF/Excel)  │
                    │  ○ Configure Settings            │
                    └─────────────────────────────────┘
```

---

## Sequence Diagram — Booking Flow

```
Customer        Frontend         Backend          DB           Email
   │                │                │             │              │
   │──Book Now─────▶│                │             │              │
   │                │──GET /services▶│──SELECT────▶│              │
   │                │◀──services─────│◀────────────│              │
   │──Select Svc───▶│                │             │              │
   │                │──GET /employees/by-service──▶│              │
   │                │◀──stylists─────│◀────────────│              │
   │──Select Stylist▶│               │             │              │
   │                │──GET /slots────▶│──CHECK─────▶│              │
   │                │◀──slots────────│◀────────────│              │
   │──Select Slot──▶│                │             │              │
   │──Select Payment▶│               │             │              │
   │──Confirm───────▶│               │             │              │
   │                │──POST /appointments──────────▶│              │
   │                │                │──INSERT─────▶│              │
   │                │                │──POST /payments/initialize  │
   │                │◀──payment_url──│             │              │
   │──Pay───────────▶[Paystack]      │             │              │
   │                │──POST /payments/verify───────▶│              │
   │                │                │──UPDATE─────▶│              │
   │                │                │──────────────────────────▶Email
   │◀──Confirmed────│                │             │              │
```

---

## Class Diagram

```
User
  - id: UUID
  - name: string
  - email: string
  - role: enum(customer|admin|employee)
  + login()
  + register()
  + updateProfile()

Appointment
  - id: UUID
  - customer_id: UUID
  - employee_id: UUID
  - service_id: UUID
  - appointment_date: Date
  - start_time: Time
  - status: enum
  + create()
  + cancel()
  + reschedule()
  + complete()

Payment
  - id: UUID
  - appointment_id: UUID
  - amount: Decimal
  - method: enum
  - status: enum
  + initialize()
  + verify()
  + generateReceipt()

Service
  - id: UUID
  - name: string
  - price: Decimal
  - duration: Integer
  + getAvailableSlots()

Employee
  - id: UUID
  - specialization: string
  - experience_years: Integer
  + getAvailability()
  + updateAvailability()
```

---

## Deployment Guide

### Frontend → Vercel

```bash
cd frontend
npm run build

# Deploy to Vercel
npx vercel --prod

# Set environment variables in Vercel dashboard:
# VITE_API_URL=https://your-backend.railway.app/api
# VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
```

### Backend → Railway

1. Push code to GitHub
2. Connect repo to Railway
3. Set environment variables in Railway dashboard (copy from .env.example)
4. Railway auto-deploys on push

### Database → Railway PostgreSQL

1. Add PostgreSQL plugin in Railway
2. Copy DATABASE_URL to backend env vars
3. Run migrations: `npm run migrate`
4. Run seed: `npm run seed`

---

## Security Features

- JWT authentication with HTTP-only cookies
- bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min general, 10 req/15min auth)
- Helmet.js security headers
- XSS protection (xss-clean)
- CORS configured for frontend origin only
- Input validation (express-validator)
- Role-based access control (customer / admin / employee)
- Secure cookie flags in production

---

## Features Summary

### Customer Website
- Home page with hero, services, stylists, reviews, FAQs
- Services page with search, filter, sort
- Gallery with category filter and lightbox
- Stylists page with ratings
- Multi-step booking wizard (service → stylist → date/time → payment → confirm)
- My Bookings with cancel, review, receipt download
- Profile with avatar upload and password change
- About, Pricing, Reviews, Contact pages

### Admin Dashboard
- Analytics dashboard with 8 KPI cards and 4 charts
- Full appointment management (approve/reject/complete/cancel)
- Service & category CRUD with image upload
- Employee management with availability scheduling
- Customer management with status toggle
- Payment tracking with PDF receipt download
- Review moderation (approve/reject)
- Gallery management
- Inventory with stock tracking and low-stock alerts
- Reports with PDF and Excel export
- Salon settings configuration

---

*Built for Aisha's Salon — University Final Year Project*
*Stack: React + Node.js + PostgreSQL + Tailwind CSS*
