# System Diagrams

The diagrams are written in [Mermaid](https://mermaid.js.org), which GitHub and VS Code (with a Mermaid extension) render automatically. To export an image for a report, paste a diagram into <https://mermaid.live>.

The ER diagram is in [DATABASE.md](DATABASE.md).

## 1. System architecture

```mermaid
flowchart LR
    subgraph Client["Browser"]
        CW["Customer website<br/>(React)"]
        AD["Admin dashboard<br/>(React)"]
    end

    subgraph Vercel
        SPA["Static frontend build"]
    end

    subgraph Railway["Railway: Express API"]
        MW["Middleware<br/>Helmet, CORS, rate limit,<br/>sanitise, auth, validation"]
        CT["Controllers"]
        SV["Services<br/>slots, payments, email,<br/>PDF, reports, reminders"]
        MD["Mongoose models"]
    end

    DB[("MongoDB Atlas")]
    SMTP["SMTP server"]
    PS["Paystack<br/>(optional)"]

    CW --> SPA
    AD --> SPA
    CW -- "HTTPS / JSON" --> MW
    AD -- "HTTPS / JSON" --> MW
    MW --> CT --> SV --> MD --> DB
    SV -- "emails" --> SMTP
    SV <-- "initialise / verify" --> PS
    PS -- "webhook" --> MW
```

## 2. Use case diagram

```mermaid
flowchart LR
    Visitor(["Visitor"])
    Customer(["Customer"])
    Admin(["Administrator"])
    System(["System (automatic)"])

    subgraph Public["Public website"]
        U1["Browse services, prices, stylists, gallery"]
        U2["Read reviews"]
        U3["Check available dates and times"]
        U4["Send a contact message"]
        U5["Register / log in"]
        U6["Reset forgotten password"]
    end

    subgraph Account["Customer account"]
        C1["Book an appointment"]
        C2["Reschedule an appointment"]
        C3["Cancel an appointment"]
        C4["Pay online"]
        C5["Download receipt / invoice"]
        C6["Leave a review"]
        C7["Edit profile and photo"]
        C8["Change password"]
        C9["Set notification preferences"]
    end

    subgraph Back["Admin dashboard"]
        A1["View dashboard analytics"]
        A2["Approve / reject / cancel / complete appointments"]
        A3["Reschedule and assign stylist"]
        A4["Manage customers"]
        A5["Manage employees and schedules"]
        A6["Manage services and categories"]
        A7["Record payments and refunds"]
        A8["Manage inventory and suppliers"]
        A9["Moderate reviews"]
        A10["Manage gallery"]
        A11["Generate and export reports"]
        A12["Edit salon settings"]
    end

    subgraph Auto["Automation"]
        S1["Prevent double booking"]
        S2["Send emails and notifications"]
        S3["Send appointment reminders"]
        S4["Generate receipts"]
        S5["Raise low-stock alerts"]
    end

    Visitor --> U1 & U2 & U3 & U4 & U5 & U6
    Customer --> C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8 & C9
    Admin --> A1 & A2 & A3 & A4 & A5 & A6 & A7 & A8 & A9 & A10 & A11 & A12
    System --> S1 & S2 & S3 & S4 & S5

    C1 -. includes .-> S1
    C1 -. includes .-> S2
    A7 -. includes .-> S4
    A8 -. includes .-> S5
```

A customer can do everything a visitor can.

## 3. Sequence diagram: booking an appointment

```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    participant F as React frontend
    participant A as Express API
    participant S as Slot service
    participant D as MongoDB
    participant N as Notification service

    C->>F: Choose service and stylist
    F->>A: GET /appointments/available-dates
    A->>S: getAvailableDates()
    S->>D: Read opening hours, working hours, booked slots
    D-->>S: Data
    S-->>A: Dates with free slots
    A-->>F: Dates
    C->>F: Choose a date
    F->>A: GET /appointments/slots
    A-->>F: Slots, each flagged available or not
    C->>F: Choose a time and payment method, confirm
    F->>A: POST /appointments (JWT)
    A->>A: Authenticate and validate input
    A->>S: assertSlotIsBookable()
    S-->>A: OK
    A->>D: Insert booked slots (unique index)

    alt Slot already taken by another customer
        D-->>A: Duplicate key error
        A-->>F: 409 Conflict
        F-->>C: "That time was just booked, please choose another"
    else Slot free
        D-->>A: Inserted
        A->>D: Save appointment and pending payment
        A-->>F: 201 Created (appointment and payment)
        F-->>C: Confirmation screen with reference
        A-)N: onBookingCreated() (after responding)
        N-)C: Confirmation email and dashboard notification
        N-)D: Notification for each administrator
    end
```

## 4. Sequence diagram: online payment

```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    participant F as React frontend
    participant A as Express API
    participant P as Paystack
    participant D as MongoDB

    C->>F: Confirm and pay
    F->>A: POST /payments/initialize
    A->>P: Initialise transaction (amount, reference)
    P-->>A: Checkout URL
    A->>D: Save provider reference on the payment
    A-->>F: Checkout URL
    F->>P: Redirect customer to checkout
    C->>P: Enter card details and pay
    P-->>F: Redirect to /payment/callback?reference=...
    F->>A: POST /payments/verify
    A->>P: Verify transaction
    P-->>A: Status and amount

    alt Successful and amount matches
        A->>D: Payment = success, receipt number issued
        A->>D: Appointment = paid and confirmed
        A-->>F: Payment verified
        F-->>C: Success page with receipt download
        A-)C: Receipt email with PDF attached
    else Failed or abandoned
        A->>D: Payment = failed
        A-->>F: 400 Payment was not successful
        F-->>C: Explain; booking is kept, can retry or pay at salon
    end

    Note over P,A: Paystack also calls the webhook, so the payment<br/>is recorded even if the customer closes the browser.
```

## 5. Sequence diagram: login and an authorised request

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant F as React frontend
    participant A as Express API
    participant D as MongoDB

    U->>F: Enter email and password
    F->>A: POST /auth/login
    A->>D: Find user by email
    D-->>A: User with password hash
    A->>A: bcrypt.compare()
    alt Invalid credentials
        A-->>F: 401 Invalid email or password
    else Valid
        A->>A: Sign JWT (id, role, csrf)
        A-->>F: token, csrfToken, user (and httpOnly cookie)
        F->>F: Store session, redirect by role
    end

    U->>F: Open a protected page
    F->>A: GET /appointments (Authorization: Bearer token)
    A->>A: Verify JWT signature and expiry
    A->>D: Load user, check active and password not changed
    A->>A: Check role and ownership
    A->>D: Query (customers: own records only)
    D-->>A: Results
    A-->>F: 200 data
```

## 6. Class diagram

Domain model. Methods shown are the important behaviours of each model.

```mermaid
classDiagram
    direction LR

    class User {
        +String name
        +String email
        +String phone
        -String password
        +String role
        +String avatar
        +Boolean isActive
        +comparePassword(candidate) Boolean
        +changedPasswordAfter(issuedAt) Boolean
    }
    class Employee {
        +String name
        +String specialization
        +Number experienceYears
        +WorkingHour[] workingHours
        +Rating rating
        +Boolean isActive
        +defaultWorkingHours()$ WorkingHour[]
    }
    class WorkingHour {
        +Number day
        +Boolean isWorking
        +String start
        +String end
    }
    class Category {
        +String name
        +String slug
        +Boolean isActive
    }
    class Service {
        +String name
        +Number price
        +Number duration
        +Boolean isActive
        +Boolean isFeatured
    }
    class Appointment {
        +String reference
        +String date
        +String startTime
        +String endTime
        +Number price
        +String status
        +String paymentStatus
        +canTransitionTo(status) Boolean
    }
    class BookedSlot {
        +String date
        +Number block
    }
    class Payment {
        +String reference
        +Number amount
        +String method
        +String status
        +String receiptNumber
        +Date paidAt
    }
    class Review {
        +Number rating
        +String comment
        +Boolean isApproved
        +String reply
        +refreshEmployeeRating(employeeId)$
    }
    class Notification {
        +String type
        +String title
        +String message
        +Boolean isRead
    }
    class InventoryItem {
        +String name
        +String sku
        +Number quantity
        +Number reorderLevel
        +isLowStock Boolean
    }
    class Supplier {
        +String name
        +String phone
    }
    class StockTransaction {
        +String type
        +Number quantity
        +Number total
        +Number balanceAfter
    }
    class Setting {
        +String businessName
        +OpeningHour[] openingHours
        +Number slotIntervalMinutes
        +Number cancellationWindowHours
        +getMain()$ Setting
    }

    User "1" --> "*" Appointment : books
    User "1" --> "*" Payment : makes
    User "1" --> "*" Review : writes
    User "1" --> "*" Notification : receives
    Category "1" --> "*" Service : groups
    Employee "*" --> "*" Service : offers
    Employee "1" *-- "7" WorkingHour : has
    Employee "1" --> "*" Appointment : performs
    Service "1" --> "*" Appointment : booked as
    Appointment "1" *-- "1..*" BookedSlot : reserves
    Appointment "1" --> "1" Payment : settled by
    Appointment "1" --> "0..1" Review : reviewed in
    Supplier "1" --> "*" InventoryItem : supplies
    InventoryItem "1" --> "*" StockTransaction : history
```

### Service layer

```mermaid
classDiagram
    direction TB
    class SlotService {
        +getSlotsForDate(query) Slot[]
        +getAvailableDates(query) String[]
        +assertSlotIsBookable(query)
        +reserveSlots(appointment)
        +releaseSlots(appointmentId)
    }
    class PaymentService {
        +isOnlineEnabled() Boolean
        +initializeOnlinePayment(payment, customer)
        +verifyOnlinePayment(reference)
        +settlePayment(paymentId, options)
        +isValidWebhookSignature(body, signature) Boolean
    }
    class NotificationService {
        +notifyUser(userId, notification)
        +notifyAdmins(notification)
        +onBookingCreated(customer, appointment)
        +onAppointmentStatusChanged(customer, appointment)
        +onPaymentReceived(customer, payment, appointment, pdf)
        +onLowStock(item)
    }
    class EmailService {
        +sendWelcomeEmail(user)
        +sendBookingConfirmation(user, appointment)
        +sendAppointmentReminder(user, appointment)
        +sendPasswordResetEmail(user, url)
        +sendPaymentReceipt(user, payment, appointment, pdf)
    }
    class SmsService {
        +sendSms(message)
        +registerProvider(name, provider)
    }
    class PdfService {
        +generatePaymentDocument(payment, settings, type) Buffer
        +generateReportPdf(report, settings) Buffer
    }
    class ReportService {
        +buildReport(period, date) Report
        +generateReportExcel(report) Buffer
    }
    class ReminderService {
        +startReminderScheduler()
        +sendDueReminders() Number
    }
    class MediaService {
        +saveImage(file, userId) String
        +replaceImage(file, previousUrl, userId) String
        +removeImage(url)
    }

    NotificationService --> EmailService
    NotificationService --> SmsService
    PaymentService --> PdfService
    PaymentService --> NotificationService
    ReminderService --> EmailService
    ReminderService --> SmsService
```

## 7. Appointment state diagram

```mermaid
stateDiagram-v2
    [*] --> pending : customer books
    [*] --> confirmed : admin books / paid online
    pending --> confirmed : approve
    pending --> rejected : reject
    pending --> cancelled : cancel
    confirmed --> completed : mark completed
    confirmed --> no_show : mark no-show
    confirmed --> cancelled : cancel
    completed --> [*]
    rejected --> [*]
    cancelled --> [*]
    no_show --> [*]
```

Time slots are held while an appointment is `pending` or `confirmed` and released when it is `cancelled`, `rejected` or `no_show`.
