# InsureX — Insurance Policy & Claims Management System

A full-stack MERN application for managing insurance policies, claims processing, fraud detection, and multi-role user workflows.

🌍 **Live Demo:** [Click Here](https://insurance-x.netlify.app/) 
Please wait 30-40 seconds while loggig in
---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Redux Toolkit, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas + Mongoose |
| **Auth** | JWT (httpOnly cookies + Authorization header) |
| **Real-time** | Socket.io |
| **File Storage** | MongoDB GridFS |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Email** | Nodemailer (SMTP) |

---

## Features

### 🔐 Authentication & Security
- Email/password login with JWT (7-day tokens)
- Email verification on registration
- Password reset via email
- Account lockout after 5 failed attempts
- Role-based access control (4 roles)
- Helmet, CORS, XSS, NoSQL injection protection
- Rate limiting on auth endpoints

### 📋 Policy Management
- Browse policies with category filters (health, auto, home, life, travel, business)
- Dynamic premium calculator (age + risk level + asset value + add-ons)
- Waiting periods, deductibles, coverage limits
- Admin: create, edit, delete, feature policies with thumbnail uploads

### 🏥 Claims Processing
- Submit claims with up to 10 file attachments
- Claim lifecycle: `submitted → under_review → approved / rejected / withdrawn`
- Adjuster assignment and review workflow
- Status history with timestamps
- Approved payout = approved amount − deductible
- Remaining coverage tracking per policy

### 🚨 Fraud Detection
- Automated risk scoring (0–100) on every claim
- 7 detection rules: rapid claims, high amounts, waiting period violations, duplicate incidents, etc.
- Fraud logs with resolution states: `pending / cleared / confirmed_fraud / escalated`
- Admins and adjusters can manually re-run fraud checks

### 🔔 Real-time Notifications
- 15 notification types (claim updates, policy events, fraud alerts, account changes)
- Instant delivery via Socket.io
- Priority levels: low / normal / high / urgent
- Read/unread tracking, auto-delete after 90 days
- Admin broadcast to all users of a role

### 👤 Role Dashboards
| Role | Capabilities |
|---|---|
| **Customer** | Browse & purchase policies, submit & track claims, view notifications |
| **Agent** | View assigned customers and policy activity |
| **Adjuster** | Review claim queue, approve/reject claims, fraud analysis |
| **Admin** | Full platform control: users, policies, claims, fraud logs, analytics |

---

<h2>Screenshots</h2>

<h3>Login Page</h3>
<h2>Screenshots</h2>

<h3>Login Page</h3>
<img width="1919" height="1074" alt="image" src="https://github.com/user-attachments/assets/697230e8-659f-4be9-bbfa-2100467b9e0a" />


<h3>Customer Dashboard</h3>
<img width="1919" height="1030" alt="image" src="https://github.com/user-attachments/assets/409ff579-936b-4fe9-b91a-bf467896fe0a" />

<h3>Claim Page</h3>
<img width="1915" height="1027" alt="image" src="https://github.com/user-attachments/assets/b5027690-9328-44a6-8e34-0f4ef5be70d0" />


<h3>Admin Page</h3>
<img width="1919" height="1020" alt="image" src="https://github.com/user-attachments/assets/39d2f84f-3e2e-4eda-9109-c1c651b3ae66" />


<h3>Claims Admin Page</h3>
<img width="1919" height="1031" alt="image" src="https://github.com/user-attachments/assets/440112ff-6e00-4d9d-bce9-2ad85256de75" />

<h3>Policies</h3>
<img width="1919" height="1016" alt="image" src="https://github.com/user-attachments/assets/d1c9445e-1018-4a9e-85c7-6cd74072a8fd" />

<h3>Fraud Logs</h3>
<img width="1919" height="1031" alt="image" src="https://github.com/user-attachments/assets/c4d6efa2-3600-4281-91f9-4c6b828d7dde" />


<h3>Adjuster Page</h3>
<img width="1919" height="1039" alt="image" src="https://github.com/user-attachments/assets/1d41142e-f0fa-440e-8fa4-10a3c7b22bde" />



## Project Structure

```
Insurance/
├── backend/
│   ├── config/           # DB, Socket.io, GridFS setup
│   ├── controllers/      # auth, policy, claim, fraud, notification, upload, admin
│   ├── middleware/        # auth, role, validation, upload, rate limit, error handler
│   ├── models/           # User, Policy, PurchasedPolicy, Claim, FraudLog, Notification
│   ├── routes/           # 7 route files
│   ├── services/         # email, fraud engine, socket, file upload
│   ├── validators/       # express-validator rule sets
│   ├── utils/            # logger, asyncHandler, apiResponse
│   ├── seedData.js       # Seed 12 users, 7 policies, 12 purchases, 15 claims, 2 fraud logs
│   └── server.js
│
└── frontend/
    └── src/
        ├── pages/        # auth/, customer/, agent/, adjuster/, admin/
        ├── components/   # common/, premium/, notifications/
        ├── store/        # Redux slices: auth, policy, claim
        ├── api/          # Axios API service layer
        ├── context/      # SocketContext, NotificationContext
        ├── utils/        # formatCurrency, formatDate
        └── styles/       # globals.css (glassmorphism light theme)
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier works)

### 1. Clone & Install

```bash
# Backend
cd Insurance/backend
npm install

# Frontend
cd Insurance/frontend
npm install
```

### 2. Environment Variables

**`backend/.env`**
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/Insurance

JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

EMAIL_VERIFY_SECRET=your_email_verify_secret
EMAIL_VERIFY_EXPIRES_IN=24h

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=InsureX <no-reply@insurex.com>

ALLOWED_ORIGINS=http://localhost:5173
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed the Database

```bash
cd Insurance/backend
node seedData.js
```

Creates:
- 12 users (1 admin, 2 agents, 2 adjusters, 7 customers)
- 7 policies across all categories
- 12 purchased policies
- 15 claims (all statuses)
- 2 fraud logs

### 4. Run

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd Insurance/backend
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd Insurance/frontend
npm run dev
```

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@insurex.com | Admin@123 |
| Agent | agent@demo.com | Demo@1234 |
| Adjuster | adjuster@demo.com | Demo@1234 |
| Customer | customer@demo.com | Demo@1234 |

---

## API Reference

| Prefix | Description |
|---|---|
| `POST /api/auth/register` | Register new user |
| `POST /api/auth/login` | Login |
| `GET  /api/policies` | Browse all policies |
| `POST /api/policies/calculate-premium` | Calculate premium quote |
| `POST /api/policies/purchase` | Purchase a policy |
| `GET  /api/policies/my-policies` | Customer's purchased policies |
| `POST /api/claims` | Submit a claim |
| `GET  /api/claims/my-claims` | Customer's claims |
| `GET  /api/claims/adjuster/queue` | Adjuster review queue |
| `PATCH /api/claims/:id/review` | Approve / reject claim |
| `GET  /api/fraud/logs` | Fraud detection logs |
| `GET  /api/notifications` | User notifications |
| `GET  /api/admin/stats` | Platform analytics |

---

## Screenshots

> Login page with demo account shortcuts, role-based dashboards, premium calculator, claim submission wizard, fraud log management.

---

## License

MIT
