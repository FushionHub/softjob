# Emporium Capitals

Premium Crypto Investment & Trading Platform — Next.js 16 fullstack application featuring App Router architecture, 60+ API endpoints, comprehensive admin control panel, real-time crypto operations, and dual-driver database compatibility (PostgreSQL & MySQL/MariaDB).

> [!CAUTION]
> **Rotate credentials:** Always configure your live secrets (`DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `BACHS_*`, `ADMIN_EMAIL`) in `.env`. Never commit `.env` to public source control.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Project Architecture](#project-architecture)
3. [Quick Start (Local Development)](#quick-start-local-development)
4. [Database Schemas & Dual-Driver Support](#database-schemas--dual-driver-support)
5. [Admin KYC & Document Inspection Suite](#admin-kyc--document-inspection-suite)
6. [Financial Concurrency & Security](#financial-concurrency--security)
7. [Deploying to cPanel Shared Hosting](#deploying-to-cpanel-shared-hosting)
8. [cPanel Setup Tools & Diagnostics](#cpanel-setup-tools--diagnostics)
9. [PM2 Production Management](#pm2-production-management)
10. [Troubleshooting](#troubleshooting)

---

## Key Features

- **Live Market Trading & Crypto Swaps:** Real-time crypto prices, automated trade settlements, and asset swaps.
- **Investment Management:** Configurable investment packages with automated hourly/daily compounding and maturity processing.
- **Admin Control Suite:** Real-time metrics, user account balance management, deposits and withdrawals approvals, transaction exports, and audit logging.
- **Complete ID & KYC Document Inspection:** Dedicated dossier review supporting ID Front, ID Back, Selfie, Proof of Address, PDF viewer, zoom/rotate lightbox, and deep-linking from the users panel.
- **Dual-Driver Database Engine:** Works interchangeably with **PostgreSQL** (Neon Serverless) and **MySQL / MariaDB** (cPanel shared hosting) via `lib/db.js`.
- **High Resiliency & Cold-Start Recovery:** Automated 3-attempt exponential retry loop for database queries, preventing 500 errors during serverless compute wake-up or DNS delays (`EAI_AGAIN`).
- **Financial Race-Condition Protection:** Atomic SQL conditional decrements for balance deductions, pending withdrawal reservations, and idempotent webhook processing.

---

## Project Architecture

```
├── app/                  # Next.js App Router pages + 60+ API routes
│   ├── (public-pages)/   # Marketing landing, about, packages, plans, terms
│   ├── admin/            # Admin control panel (users, kyc, deposits, trades, etc.)
│   ├── api/              # Secure JSON REST API endpoints
│   ├── dashboard/        # User trading, investment, and wallet dashboard
│   ├── deposit/          # Deposit flows (direct crypto & Bachs checkout)
│   ├── kyc/              # User identity verification submission
│   └── ...
├── components/           # Reusable UI components & design system elements
├── sections/             # Marketing and landing page section layouts
├── lib/                  # Core backend services and utilities
│   ├── db.js             # Dual-driver DB adapter (MySQL & PostgreSQL) + retry logic
│   ├── auth.js           # JWT authentication, sessions, and permissions
│   ├── email.js          # Transactional email dispatcher with HTML templates
│   ├── lifecycle.js      # Trade expiration settlement & mature investment processor
│   └── wallets.js        # Static crypto deposit address configurations
├── public/               # Static assets (images, icons, vectors, videos)
├── cpanelsetup/          # cPanel shared hosting setup & diagnostic suite
│   ├── index.php         # App health, status & process monitor
│   ├── db-install.php    # Web-based database installer (MySQL & PostgreSQL)
│   ├── manager.php       # Web server and PM2 process control manager
│   ├── cron-worker.php   # Cron watchdog, trade settler & investment processor
│   ├── setup-check.php   # Pre-flight deployment checklist
│   ├── health.php        # JSON health endpoint for uptime monitors
│   ├── mail-test.php     # SMTP mail diagnostic tool
│   ├── keepalive.php     # Route warming & cron trigger
│   └── DEPLOY.md         # Full deployment manual
├── ecosystem.config.js   # PM2 production process configuration
├── server.js             # Custom Next.js production HTTP server wrapper
├── schema.sql            # PostgreSQL core & admin schema (Neon Serverless)
├── admin-schema.sql      # PostgreSQL admin-only schema (Neon Serverless)
├── schema-mysql.sql      # Native cPanel MySQL / MariaDB production schema
├── .htaccess             # Apache reverse proxy & static asset offloading
├── .user.ini / php.ini   # Shared hosting PHP configuration tuning
└── package.json          # Project scripts and dependencies
```

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp env.example .env
# Edit .env with your live database and authentication secrets

# 3. Start local development server (Webpack mode for Windows compatibility)
npm run dev
# App opens at http://localhost:3000

# 4. Compile production bundle (verifies 100+ routes)
npm run build

# 5. Run test suite
npm test
```

Default Admin Credentials:
- URL: `/admin/login`
- Email: `jmauricennadi@gmail.com`
- Password: `admin123` *(Change on initial login)*

---

## Database Schemas & Dual-Driver Support

The application supports **two database engines** through [`lib/db.js`](file:///c:/Users/USER/Desktop/softjob/lib/db.js) without requiring any code changes:

### 1. PostgreSQL (Neon Serverless)
- **Engine:** PostgreSQL 15+ / Serverless Neon.
- **Schema Files:** [`schema.sql`](file:///c:/Users/USER/Desktop/softjob/schema.sql) and [`admin-schema.sql`](file:///c:/Users/USER/Desktop/softjob/admin-schema.sql).
- **Environment:** Set `DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`.
- **Automatic Retries:** Queries automatically retry up to 3 times with exponential backoff on cold-start wake-up, `UND_ERR_CONNECT_TIMEOUT`, and `EAI_AGAIN` DNS delays.

### 2. MySQL / MariaDB (cPanel Shared Hosting)
- **Engine:** MySQL 5.7+ / 8.0+ or MariaDB 10.3+.
- **Schema File:** [`schema-mysql.sql`](file:///c:/Users/USER/Desktop/softjob/schema-mysql.sql).
- **Parity:** 100% column parity with PostgreSQL schema, including all KYC document fields, financial indexes, and default seed data.
- **Environment:** Set `DATABASE_URL=mysql://user:password@127.0.0.1:3306/dbname`.
- **Installation:** Import via **phpMyAdmin** or run the web installer at `https://yourdomain.com/cpanelsetup/db-install.php`.

---

## Admin KYC & Document Inspection Suite

The admin KYC module ([`/admin/kyc`](file:///c:/Users/USER/Desktop/softjob/app/admin/kyc/kyc-client.jsx)) provides a verification interface for compliance officers:

- **Four-Document Slot Verification:**
  - **ID Front:** Passport photo page, driver's license front, or national ID front.
  - **ID Back:** Reverse side of driver's license or national identity card.
  - **Selfie Holding ID:** Live applicant photo holding their identification document.
  - **Proof of Address / Utility Bill:** Recent utility bill, bank statement, or residency certificate.
- **Embedded PDF Support:** Detects PDF uploads (`.pdf` or `data:application/pdf`) and embeds an interactive document reader with direct download and new-window viewing actions.
- **Interactive Lightbox:**
  - Zoom in and out (+25% increments from 50% to 300%).
  - Rotate 90° clockwise to correct orientation.
  - High-resolution download and error fallback handlers.
- **User Deep-Linking:**
  - From [`/admin/users`](file:///c:/Users/USER/Desktop/softjob/app/admin/users/users-client.jsx), admins can click **"View ID & KYC Docs"** on any user row to jump directly to `/admin/kyc?user_id=...`.
  - The KYC interface displays an active filter banner with a "Clear Filter" button and auto-expands that applicant's dossier.

---

## Financial Concurrency & Security

All financial endpoints enforce strict atomic checks to eliminate double-spend and race condition vulnerabilities:

- **Pending Withdrawal Reservation:** In [`app/api/withdraw/route.js`](file:///c:/Users/USER/Desktop/softjob/app/api/withdraw/route.js), available balance is computed as `balance - pending_withdrawals`. Concurrent withdrawal requests cannot exceed actual unreserved capital.
- **Safe Withdrawal Approval:** In [`app/api/admin/withdrawals/[id]/route.js`](file:///c:/Users/USER/Desktop/softjob/app/api/admin/withdrawals/%5Bid%5D/route.js), admin approval verifies user balance and debits atomically (`WHERE balance >= amount`).
- **Atomic Balance Reinvestment & Trades:** In [`app/api/deposit/route.js`](file:///c:/Users/USER/Desktop/softjob/app/api/deposit/route.js) and [`app/api/trade/route.js`](file:///c:/Users/USER/Desktop/softjob/app/api/trade/route.js), balance deductions use conditional SQL decrements (`WHERE id = $2 AND balance >= $1 RETURNING balance`).
- **Webhook Idempotency:** In [`app/api/bachs/webhook/route.js`](file:///c:/Users/USER/Desktop/softjob/app/api/bachs/webhook/route.js), deposit fulfillment uses single-statement conditional updates (`WHERE id = $1 AND status = 'pending'`).

---

## Deploying to cPanel Shared Hosting

### Step 1: Install Node.js & npm via NVM
Open **cPanel → Terminal** and execute:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
source ~/.bashrc 2>/dev/null || true
nvm install 20
nvm use 20
nvm alias default 20
npm install -g pm2
```

### Step 2: Upload Files & Configure Environment
1. Upload and extract project files to `/home/USERNAME/public_html/`.
2. Configure `.env` with database credentials and live secrets:
   ```env
   DATABASE_URL=mysql://db_user:db_pass@127.0.0.1:3306/db_name
   JWT_SECRET=your-secure-random-jwt-secret
   ADMIN_EMAIL=jmauricennadi@gmail.com
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   CPANEL_SETUP_TOKEN=your-random-token-here
   ```

### Step 3: Install & Build
In the cPanel Terminal:
```bash
cd ~/public_html
npm install
npm run build
```

### Step 4: Run Database Installation
Navigate to:
```
https://yourdomain.com/cpanelsetup/db-install.php?token=YOUR_CPANEL_SETUP_TOKEN
```
Click **Run Installation & Migrations** to initialize all tables and default administrator credentials.

### Step 5: Start PM2 Process
```bash
pm2 start ecosystem.config.js
pm2 save
```

### Step 6: Configure Keep-Alive Cron
In **cPanel → Cron Jobs**, add a job to run every 10 minutes:
```bash
*/10 * * * * php /home/USERNAME/public_html/cpanelsetup/cron-worker.php >/dev/null 2>&1
```

---

## cPanel Setup Tools & Diagnostics

| Tool | URL | Purpose |
|---|---|---|
| **Startup & Health** | `/cpanelsetup/index.php?token=...` | Live application health and process monitor |
| **Pre-Flight Checklist** | `/cpanelsetup/setup-check.php?token=...` | Verifies PHP, Node.js, PM2, and build readiness |
| **Server Manager** | `/cpanelsetup/manager.php?token=...` | Process manager, restart controls, and log viewer |
| **DB Installer** | `/cpanelsetup/db-install.php?token=...` | Database installer for MySQL and PostgreSQL |
| **Cron Worker** | `/cpanelsetup/cron-worker.php` | Background trade settlement and investment processor |
| **Health Check** | `/cpanelsetup/health.php` | JSON health endpoint for monitoring services |
| **Mail Test** | `/cpanelsetup/mail-test.php?token=...` | SMTP email diagnostic and delivery tester |

---

## PM2 Production Management

| Action | Command | npm Script |
|---|---|---|
| **Start** | `pm2 start ecosystem.config.js` | `npm run pm2:start` |
| **Restart** | `pm2 restart ecosystem.config.js` | `npm run pm2:restart` |
| **Stop** | `pm2 stop ecosystem.config.js` | `npm run pm2:stop` |
| **Status** | `pm2 status` | `pm2 status` |
| **Live Logs** | `pm2 logs rico-investimentos` | `npm run pm2:logs` |

---

## Troubleshooting

| Symptom | Cause | Resolution |
|---|---|---|
| `502 Bad Gateway` | Node.js process stopped | Check `pm2 status` and run `pm2 restart ecosystem.config.js` |
| `npm error Missing: ... from lock file` | Lockfile out of sync | Run `npm install` locally and commit updated `package-lock.json` |
| `EADDRINUSE: 3000` | Port occupied by dangling process | Run `pm2 delete all` and restart via `pm2 start ecosystem.config.js` |
| `NeonDbError: fetch failed` | Serverless compute cold start | Query auto-retries in 1.2s; check internet connectivity |
| `Hydration mismatch on video` | Browser extensions altering DOM | Suppressed via `suppressHydrationWarning` on `<video>` and `<source>` |
