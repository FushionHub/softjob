# Emporium Capitals

Premium, enterprise-grade crypto investment and trading platform engineered with Next.js 16 (Turbopack), React 19, Tailwind CSS v4, Neon PostgreSQL, Jose JWT authentication, Nodemailer alerts, and Bachs.io crypto payment infrastructure.

---

## ⚡ Quick Start

### Isolated Self-Contained Setup (Docker)

```bash
# 1. Start local PostgreSQL container
docker compose up -d db

# 2. Install dependencies & configure env
npm install
cp env.example .env.local

# 3. Initialize & Verify Database Schema
node scripts/init-db.js

# 4. Start Development Server
npm run dev
# → Web App:    http://localhost:3000
# → Admin Portal: http://localhost:3000/admin/login
```

---

## 👑 Admin Access & Initial Credentials

Initial admin accounts can be seeded at database initialization by specifying `ADMIN_INITIAL_PASSWORD` in your environment (`.env.local`).

> [!IMPORTANT]
> Always set a strong `ADMIN_INITIAL_PASSWORD` in your `.env.local` prior to running initial database migration.

---

## 🏗️ Asynchronous Architecture & Real-Time Sync

Every subsystem in Emporium Capitals is architected to operate **hand in hand in asynchronous order**:

```mermaid
flowchart TD
    User([User Action / Webhook]) --> API[Next.js Async API Route]
    API --> DB[(Neon PostgreSQL Database)]
    API --> NonBlocking{Async Dispatcher}
    NonBlocking -->|safeSend| Email[SMTP / Nodemailer Worker]
    NonBlocking -->|In-App| Notif[(Notifications System)]
    NonBlocking -->|Audit Trail| Logs[(Admin Activity Logs)]
    DB --> RealtimeSync[Real-Time Client SWR / Polling]
    RealtimeSync --> UI([Responsive Dashboard UI])
```

### Hand-in-Hand Async Handshake:
1. **Deposit Flow:**
   - User creates deposit via Bachs hosted checkout (135+ coins) or crypto address.
   - Bachs webhook (`/api/bachs/webhook`) verifies signature asynchronously with idempotency guard.
   - Upon payment confirmation: user `balance` and `total_deposit` are atomically updated.
   - In-app notification is queued and branded confirmation email is sent asynchronously (`safeSend`) without delaying API response.
2. **Withdrawal Flow:**
   - User submits withdrawal request (`/api/withdraw`) with balance check & duplicate prevention.
   - Status is set to `pending` (funds held safely). Real-time alert dispatched to Admin and User.
   - Admin approves in `/admin/withdrawals` -> balance is deducted (`balance - amount`), `total_withdrawal` incremented, user notified by email and notification.
3. **Live Crypto Swaps:**
   - Live rates proxied every 3 seconds from Binance (`/api/prices`) to prevent CORS & client-side rate limits.
   - Swaps executed with atomic balance validation, fee calculation, and transaction history logging.
4. **Trading Engine:**
   - Real-time TradingView charts with live entry/exit price recording, automatic position tracking, and profit history calculations.
5. **Investment Packages & Compounding:**
   - 5 tiered investment plans (Starter to Platinum) with automated profit logging (`profit_history`) and progress tracking.
6. **KYC Verification Pipeline:**
   - User uploads identity documents (`/api/kyc/submit`).
   - Asynchronously notifies admin and user; supports auto-approval delay or manual review in `/admin/kyc` with rejection reasons.
7. **Support Chat System:**
   - Real-time ticket messaging supporting text, attachments, and voice notes between users and administrators.

---

## 🗄️ Database Architecture (Neon PostgreSQL)

The system automatically manages **19 relational tables** with indexes, cascading foreign keys, and self-healing auto-migration (`ensureSchema()` in `lib/db.js`):

| # | Table | Purpose | Key Indexes & Relations |
|---|-------|---------|-------------------------|
| 1 | `users` | User credentials, profile, balances, KYC status, OAuth | `email`, `username`, `referral_code` |
| 2 | `admin_users` | Administrator accounts, roles, permissions | `email`, `is_active` |
| 3 | `admin_logs` | Audit trail of all admin actions and IP addresses | `admin_id`, `action`, `created_at` |
| 4 | `deposits` | Deposit history, status, hashes, and idempotency | `user_id`, `idempotency_key`, `reference` |
| 5 | `withdrawals` | Withdrawal requests, wallet addresses, and approvals | `user_id`, `idempotency_key`, `created_at` |
| 6 | `trades` | Trading positions, entry/exit prices, profit/loss | `user_id`, `idempotency_key`, `created_at` |
| 7 | `swaps` | Asset swaps, exchange rates, and transaction fees | `user_id`, `idempotency_key`, `created_at` |
| 8 | `investment_plans` | Tiered investment packages and ROI settings | `name` (unique), `featured` |
| 9 | `user_investments` | Active and completed user investment contracts | `user_id`, `plan_id`, `status` |
| 10 | `profit_history` | Granular accrual logs for daily/hourly investment profits | `user_id`, `investment_id` |
| 11 | `referrals` | Referral tracking, referred relationships, bonus status | `referrer_id`, `referred_id` |
| 12 | `notifications` | In-app notification feed with read/unread status | `user_id`, `is_read`, `created_at` |
| 13 | `wallet_connections` | Encrypted web3 wallet connections (AES-256-GCM) | `user_id`, `status` |
| 14 | `kyc_submissions` | KYC identity verification records & document URLs | `user_id` (unique), `status` |
| 15 | `support_tickets` | Customer support ticket threads and status | `user_id`, `status`, `last_reply_at` |
| 16 | `support_messages` | Individual chat messages, files, and voice notes | `ticket_id`, `sender_id`, `created_at` |
| 17 | `wallet_providers` | Crypto wallet providers and API configurations | `slug` (unique), `is_active` |
| 18 | `site_settings` | Global key-value platform configurations | `setting_key` (unique), `category` |
| 19 | `email_templates` | Customizable HTML email templates with placeholders | `name` (unique), `is_active` |

---

## ⚙️ Environment Variables

Create `.env.local` in your root directory:

```env
# =============================================
# AUTHENTICATION & SECURITY
# =============================================
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_JWT_SECRET=your_super_secret_admin_jwt_key_here

# AES-256-GCM Key for Encrypted Wallet Storage
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
WALLET_ENCRYPTION_KEY=your_64_char_hex_encryption_key_here

# =============================================
# DATABASE (NEON POSTGRESQL)
# =============================================
DATABASE_URL=postgresql://username:password@ep-your-pool.us-east-2.aws.neon.tech/neondb?sslmode=require

# =============================================
# SMTP EMAIL NOTIFICATIONS (NODEMAILER)
# =============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM="Emporium Capitals <noreply@emporiumcapitals.com>"
ADMIN_EMAIL=admin@emporiumcapitals.com

# =============================================
# APPLICATION URL
# =============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# =============================================
# PAYMENT GATEWAY (BACHS.IO)
# =============================================
BACHS_API_KEY=sk_live_your_bachs_api_key
BACHS_API_BASE=https://api.bachs.io
BACHS_WEBHOOK_SECRET=whsec_your_webhook_secret

# =============================================
# GOOGLE OAUTH
# =============================================
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# =============================================
# REAL-TIME KYC CONFIGURATION
# =============================================
KYC_ENABLED=true
KYC_LOCK_EDIT_AFTER_VERIFIED=true
KYC_REQUIRE_FOR_WITHDRAW=false
KYC_ADMIN_NOTIFY=true
KYC_AUTO_APPROVE=true
KYC_AUTO_APPROVE_DELAY=15
```

---

## 📡 API Reference Map (64+ Routes)

### 🔐 User Authentication & Profile
- `POST /api/auth/register` — Create new user with referral tracking & welcome notification
- `POST /api/auth/login` — Authenticate user and issue JWT cookie
- `POST /api/auth/google` — Verified backend Google Identity Services (GIS) login
- `POST /api/auth/logout` — Invalidate user session
- `POST /api/auth/forgot-password` — Send password reset link
- `POST /api/auth/reset-password` — Reset password using token
- `GET/POST /api/auth/onboarding` — Complete or skip Google user onboarding
- `GET/PUT /api/user/me` — Retrieve or update user profile with KYC lock protection
- `POST /api/user/avatar` — Upload custom user avatar

### 💰 Finance & Trading
- `GET/POST /api/deposit` — List user deposits or initiate Bachs.io crypto payment
- `GET/POST /api/withdraw` — List user withdrawals or request a withdrawal
- `GET/POST /api/swap` — Get live swap rates and execute atomic currency swaps
- `GET/POST /api/trade` — List user trades and open new market positions
- `GET /api/investments` — List user investment portfolio and active packages
- `GET /api/investment-plans` — Retrieve all available investment packages
- `GET /api/profit-history` — Granular profit accrual logs
- `GET /api/transactions` — Unified transactions view (deposits + withdrawals + swaps + trades)
- `GET /api/prices` — Proxied live Binance crypto prices (cached & CORS-safe)

### 🛡️ KYC & Platform Services
- `POST /api/kyc/submit` — Submit KYC documents with instant email dispatch
- `GET /api/kyc/status` — Get real-time verification status
- `POST /api/kyc/review` — Review submission (approve/reject with reason)
- `GET/POST /api/notifications` — Notification inbox (mark read, delete, unread count)
- `GET/POST /api/support` — Create and list support tickets
- `POST /api/bachs/create-checkout` — Create Bachs hosted payment session
- `POST /api/bachs/webhook` — Real-time payment confirmation webhook

### 👑 Admin API Suite (`/api/admin/*`)
- `POST /api/admin/auth/login` — Admin login with bcrypt verification & session cookie
- `POST /api/admin/auth/logout` — Admin logout & session clearance
- `GET /api/admin/auth/me` — Current authenticated admin profile
- `GET /api/admin/users` — Search, filter, and paginate all platform users
- `GET/PUT/DELETE /api/admin/users/[id]` — User details, edit balance, KYC status, delete
- `POST /api/admin/users/[id]/balance` — Directly credit or debit user balance
- `GET /api/admin/deposits` — Filter deposits with aggregate volume metrics
- `PUT /api/admin/deposits/[id]` — Approve/reject deposit with balance update & notifications
- `GET /api/admin/withdrawals` — List withdrawals with pending/approved totals
- `PUT /api/admin/withdrawals/[id]` — Approve/reject withdrawal with automatic balance deduction
- `GET /api/admin/trades` — Trading audit log and P&L statistics
- `GET /api/admin/swaps` — Exchange audit log and volume metrics
- `GET /api/admin/investments` — Manage user investments and profit records
- `GET/POST /api/admin/plans` — CRUD investment plan packages
- `GET/PUT/DELETE /api/admin/plans/[id]` — Update/delete specific investment plan
- `GET/PUT /api/admin/kyc` — List and filter KYC submissions with document view
- `GET/PUT /api/admin/kyc/[id]` — Approve or reject KYC with custom reason & email
- `GET/POST /api/admin/wallets` — Manage wallet provider API keys (AES encrypted)
- `GET/PUT /api/admin/settings` — Update platform settings by category
- `GET /api/admin/logs` — Comprehensive audit trail of all administrative actions
- `GET/POST /api/admin/support` — Admin support desk & message dispatcher
- `GET/POST /api/admin/email` — Dispatch template or custom emails to users

---

## 🛠️ Self-Healing Auto-Migration

If any database table or column is missing or modified, `lib/db.js` automatically intercepts PostgreSQL error codes `42P01` (undefined table) and `42703` (undefined column), invokes `ensureSchema()` to apply missing tables and columns idempotently, and automatically retries the query seamlessly without dropping requests or crashing the server.

You can manually trigger a full database synchronization at any time:

```bash
node scripts/init-db.js
```

---

## 🚀 Deployment (Vercel & Production)

1. Connect your GitHub repository to **Vercel**.
2. Add all environment variables from `.env.local` to the **Vercel Project Settings**.
3. Run `node scripts/init-db.js` locally or in a build step against your production Neon DB.
4. Set `NEXT_PUBLIC_APP_URL` to your live domain (e.g. `https://emporiumcapitals.com`).
5. Configure your Bachs.io webhook endpoint to `https://emporiumcapitals.com/api/bachs/webhook`.
6. Add your domain to Google Cloud Console **Authorized JavaScript Origins** for Google OAuth.

---

## 🛡️ Security Best Practices Implemented

- **Jose JWT Edge Authentication** with separate user and admin token isolation.
- **AES-256-GCM Cryptographic Encryption** for linked private keys and sensitive provider secrets.
- **Bcrypt Hash Verification** with high salt rounds for all user and admin passwords.
- **Idempotency Safeguards** on financial endpoints preventing double-spending and duplicate submissions.
- **SQL Injection Prevention** with strict parameterized queries across all database drivers.
- **XSS & CSRF Mitigation** with `httpOnly`, `sameSite=lax`, and `secure` cookie parameters.

---

**Emporium Capitals Platform** — Designed & engineered for maximum reliability, speed, and security.
