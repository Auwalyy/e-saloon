# REST API Reference

Base URL: `http://localhost:5000/api` in development.

## Conventions

**Authentication.** Send the JWT returned by login or register in the `Authorization` header:

```
Authorization: Bearer <token>
```

The same token is also set as an httpOnly cookie. Requests authenticated by cookie alone must add `X-CSRF-Token: <csrfToken>` on `POST`, `PUT`, `PATCH` and `DELETE`.

**Access levels used below**

| Label | Meaning |
|---|---|
| Public | No authentication needed |
| User | Any signed-in user |
| Customer | Signed-in customer |
| Admin | Signed-in administrator |
| Owner / Admin | The customer who owns the record, or an administrator |

**Success response**

```json
{ "success": true, "message": "Optional message", "data": {}, "pagination": { "page": 1, "limit": 10, "total": 42, "pages": 5 } }
```

**Error response**

```json
{ "success": false, "message": "Enter a valid email address", "errors": [{ "field": "email", "message": "Enter a valid email address" }] }
```

| Status | Meaning |
|---|---|
| 400 | Validation failed or the request is not allowed in the current state |
| 401 | Not signed in, or the session has expired |
| 403 | Signed in but not permitted |
| 404 | Not found (also returned for records that belong to someone else) |
| 409 | Conflict, for example a time slot that was just taken |
| 429 | Too many requests |

**List endpoints** accept `page` (default 1) and `limit` (default 10, maximum 100).

**Image uploads** use `multipart/form-data` with two parts: `data` (a JSON string holding all fields) and one file part whose name is given in the tables below.

**Formats.** Dates are `YYYY-MM-DD`, times are 24-hour `HH:mm`, both in the salon's timezone. Money is in Naira.

---

## Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a customer account. Body: `name`, `email`, `phone`, `password`, `confirmPassword` |
| POST | `/auth/login` | Public | Sign in. Body: `email`, `password`. Returns `token`, `csrfToken`, `user` |
| POST | `/auth/logout` | Public | Clear the session cookie |
| POST | `/auth/forgot-password` | Public | Email a reset link. Body: `email` |
| POST | `/auth/reset-password` | Public | Set a new password. Body: `token`, `password`, `confirmPassword` |
| GET | `/auth/me` | User | The signed-in user |
| PUT | `/auth/profile` | User | Update `name`, `phone`, `address`, `notificationPreferences` |
| PUT | `/auth/avatar` | User | Upload a profile photo (multipart, file part `avatar`) |
| PUT | `/auth/change-password` | User | Body: `currentPassword`, `newPassword`, `confirmPassword`. Returns a new token |

Passwords need at least 8 characters with an uppercase letter, a lowercase letter and a number.

**Example**

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "aisha@example.com", "password": "Customer@123" }
```

```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "eyJhbGciOi...",
  "csrfToken": "9f2c...",
  "user": { "id": "66f...", "name": "Aisha Sule", "email": "aisha@example.com", "role": "customer" }
}
```

---

## Appointments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/appointments/slots` | Public | Time slots for a day. Query: `serviceId`, `employeeId`, `date`, optional `excludeAppointmentId` |
| GET | `/appointments/available-dates` | Public | Dates in a month with free slots. Query: `serviceId`, `employeeId`, `month` (`YYYY-MM`) |
| GET | `/appointments` | User | List. Customers see only their own. Query: `status`, `scope` (`upcoming` or `past`), `employee`, `customer`, `from`, `to`, `search` |
| POST | `/appointments` | User | Book. Body: `serviceId`, `employeeId`, `date`, `startTime`, optional `paymentMethod`, `notes`. Admins must add `customerId` |
| GET | `/appointments/:id` | Owner / Admin | One appointment with its payment |
| PATCH | `/appointments/:id/cancel` | Owner / Admin | Cancel. Body: optional `reason` |
| PATCH | `/appointments/:id/reschedule` | Owner / Admin | Move. Body: `date`, `startTime`, optional `employeeId` |
| PUT | `/appointments/:id` | Admin | General update: `employeeId`, `date`, `startTime`, `notes`, `status`, `reason` |
| PATCH | `/appointments/:id/status` | Admin | Body: `status` (`confirmed`, `rejected`, `cancelled`, `completed`, `no_show`), optional `reason` |
| DELETE | `/appointments/:id` | Admin | Delete (not allowed once paid) |

`paymentMethod` is one of `cash`, `pos`, `bank_transfer`, `paystack`.

**Slots response**

```json
{ "success": true, "data": [
  { "time": "09:00", "endTime": "10:00", "available": true },
  { "time": "09:30", "endTime": "10:30", "available": false }
] }
```

**Booking example**

```http
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{ "serviceId": "66f1...", "employeeId": "66f2...", "date": "2026-10-31", "startTime": "09:00", "paymentMethod": "cash" }
```

Returns `201` with the appointment and its payment, or `409` if the slot was taken in the meantime.

---

## Services

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/services` | Public | List. Query: `search`, `category` (id or slug), `minPrice`, `maxPrice`, `featured`, `sort`, and for admins `status` |
| GET | `/services/popular` | Public | Most booked services. Query: `limit` |
| GET | `/services/:id` | Public | One service |
| POST | `/services` | Admin | Create (multipart, file part `image`). Fields: `name`, `description`, `category`, `price`, `duration`, `isActive`, `isFeatured` |
| PUT | `/services/:id` | Admin | Update (multipart, file part `image`) |
| DELETE | `/services/:id` | Admin | Delete. A service with bookings is deactivated instead |

`sort` is one of `name`, `newest`, `price_asc`, `price_desc`, `duration_asc`, `duration_desc`. `duration` is in minutes and must be a multiple of 15.

## Categories

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/categories` | Public | List with a `serviceCount` for each |
| POST | `/categories` | Admin | Create (multipart, file part `image`). Fields: `name`, `description`, `isActive` |
| PUT | `/categories/:id` | Admin | Update |
| DELETE | `/categories/:id` | Admin | Delete (refused while it still has services) |

## Employees

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/employees` | Public | List. Query: `search`, `service`, and for admins `status`. Contact details are returned to admins only |
| GET | `/employees/:id` | Public | One employee |
| GET | `/employees/:id/schedule` | Admin | Appointments in a range. Query: `from`, `to` (default: the next 7 days) |
| POST | `/employees` | Admin | Create (multipart, file part `photo`). Fields: `name`, `email`, `phone`, `bio`, `specialization`, `experienceYears`, `services[]`, `workingHours[]`, `isActive` |
| PUT | `/employees/:id` | Admin | Update |
| DELETE | `/employees/:id` | Admin | Delete. Refused with upcoming appointments; deactivated instead if there is history |

`workingHours` item: `{ "day": 1, "isWorking": true, "start": "09:00", "end": "18:00" }`, where `day` 0 is Sunday.

## Customers

All endpoints are admin only.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/customers` | List with `totalBookings` and `totalSpent`. Query: `search`, `status` |
| POST | `/customers` | Add a walk-in customer. Body: `name`, `email`, `phone`, `address` |
| GET | `/customers/:id` | Profile, statistics, booking history and spending history |
| PUT | `/customers/:id` | Update `name`, `phone`, `address`, `isActive` |
| PATCH | `/customers/:id/toggle-status` | Deactivate or reactivate |
| DELETE | `/customers/:id` | Delete (refused when the customer has bookings) |

## Payments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/payments/config` | Public | Whether online payment is enabled |
| GET | `/payments` | User | List. Customers see only their own. Query: `status`, `method`, `from`, `to`, `search`, `customer`. Admins also receive a `summary` |
| GET | `/payments/:id` | Owner / Admin | One payment |
| POST | `/payments/initialize` | Customer | Start a Paystack payment. Body: `appointmentId`. Returns `authorizationUrl` |
| POST | `/payments/verify` | Owner / Admin | Verify a Paystack payment. Body: `reference` |
| POST | `/payments/webhook/paystack` | Paystack | Webhook, verified by signature |
| PATCH | `/payments/:id/mark-paid` | Admin | Record a payment taken at the salon. Body: `method` (`cash`, `pos`, `bank_transfer`), optional `note` |
| PATCH | `/payments/:id/refund` | Admin | Mark a successful payment as refunded |
| DELETE | `/payments/:id` | Admin | Delete (not allowed for successful payments) |
| GET | `/payments/:id/receipt` | Owner / Admin | PDF receipt (after payment) |
| GET | `/payments/:id/invoice` | Owner / Admin | PDF invoice |

Payment `status` is one of `pending`, `success`, `failed`, `refunded`, `cancelled`.

## Reviews

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/reviews` | Public | Approved reviews with a rating `summary`. Query: `rating`, `employee`, `mine=true`, `sort=top` (best first), and for admins `status` (`approved` or `pending`) |
| POST | `/reviews` | Customer | Review a completed appointment. Body: `appointmentId`, `rating` (1 to 5), `comment` |
| PUT | `/reviews/:id` | Admin | Approve, hide or reply. Body: `isApproved`, `reply` |
| DELETE | `/reviews/:id` | Owner / Admin | Delete |

## Gallery

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/gallery` | Public | List. Query: `category` |
| POST | `/gallery` | Admin | Add (multipart, file part `image`). Fields: `title`, `category` |
| PUT | `/gallery/:id` | Admin | Update `title`, `category`, `isActive`, or replace the image |
| DELETE | `/gallery/:id` | Admin | Delete |

`category` is one of `Hair`, `Braids`, `Facials`, `Spa`, `Makeup`, `Pedicure`.

## Inventory

All endpoints are admin only.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/inventory` | Products with a stock `summary`. Query: `search`, `category`, `supplier`, `lowStock=true` |
| GET | `/inventory/low-stock` | Products at or below their reorder level |
| POST | `/inventory` | Add a product. Body: `name`, `sku`, `category`, `supplier`, `unit`, `quantity` (opening stock), `reorderLevel`, `costPrice`, `sellingPrice` |
| PUT | `/inventory/:id` | Update a product (stock changes only through transactions) |
| DELETE | `/inventory/:id` | Delete a product and its history |
| GET | `/inventory/transactions` | Stock movements. Query: `type`, `item` |
| POST | `/inventory/:id/transactions` | Record a movement. Body: `type` (`purchase`, `sale`, `adjustment`), `quantity`, optional `unitPrice`, `supplier`, `note` |
| GET | `/inventory/suppliers` | List suppliers |
| POST | `/inventory/suppliers` | Add a supplier |
| PUT | `/inventory/suppliers/:id` | Update a supplier |
| DELETE | `/inventory/suppliers/:id` | Delete a supplier |

## Reports and dashboard

All endpoints are admin only.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Headline statistics, chart data and upcoming appointments |
| GET | `/reports` | Report data. Query: `period` (`daily`, `weekly`, `monthly`, `annual`), `date` (any date inside the period) |
| GET | `/reports/export/pdf` | The same report as a PDF file |
| GET | `/reports/export/excel` | The same report as an Excel workbook |

Reports are calculated on demand from live data, so there is nothing to create, update or delete.

## Notifications

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/notifications` | User | The user's notifications and `unreadCount`. Query: `unread=true` |
| PATCH | `/notifications/read-all` | User | Mark all as read |
| PATCH | `/notifications/:id/read` | User | Mark one as read |
| DELETE | `/notifications/:id` | User | Delete one |

## Settings, contact and media

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/settings` | Public | Salon information, opening hours and social links |
| PUT | `/settings` | Admin | Update (multipart, file part `logo`) |
| POST | `/contact` | Public | Send a message. Body: `name`, `email`, `phone`, `subject`, `message` |
| GET | `/contact` | Admin | Inbox |
| PATCH | `/contact/:id/read` | Admin | Mark a message as read |
| DELETE | `/contact/:id` | Admin | Delete a message |
| GET | `/media/:id` | Public | An uploaded image |
| GET | `/health` | Public | Health check |
