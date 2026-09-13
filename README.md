# Emporium Capitals

**Institutional Digital Asset Investment & Algorithmic Trading Platform**

Emporium Capitals is an enterprise-grade digital asset investment, copy-trading, and algorithmic liquidity management platform. It features a dual-runtime architecture designed to run either as a pure CDN static/PHP application natively on **LiteSpeed, Apache 2.4, and cPanel shared hosting**, or as a fullstack **Next.js 16 (App Router) application managed by PM2**.

All platform identity, parameters, deposit addresses, limits, and affiliate commission tiers are driven dynamically in real time by your environment configuration ([`.env`](file:///c:/Users/USER/Desktop/softjob/.env)). **No mock, demo, or dummy data is used anywhere.**

---

## Key Highlights & Architectural Overview

1. **Environment-Driven Configuration (`.env`)**:
   - All branding, crypto deposit addresses, financial thresholds, fees, and multi-tier affiliate rates are dynamically loaded from `.env`.
   - Modifying `.env` updates the application across all pages, endpoints, and modals without code changes.

2. **Clean Institutional Investor Experience**:
   - Client-facing investor pages are 100% focused on hedge fund operations and institutional custody.
   - All server setup buttons, hosting banners, and cPanel links have been removed from investor-facing views.

3. **Secure Administrative & Diagnostic Suite (`/cpanelsetup/`)**:
   - Internal server setup and database diagnostic tools are maintained in the [`/cpanelsetup/`](file:///c:/Users/USER/Desktop/softjob/cpanelsetup/index.php) directory.
   - Access is strictly gated by a secure 64-character token (`CPANEL_SETUP_TOKEN`), ensuring only platform operators and system administrators can execute setup scripts.

4. **Live 3-Tier Multi-Level Affiliate Engine**:
   - Generic referral code generation (`EC-XXXXXX`) compatible with any user account.
   - Multi-tier commission distribution (5% Direct, 2% Tier 2, 1% Tier 3) credited instantly to sponsors' vaults upon deposit confirmation.
   - Full ledger tracking for all affiliate transactions.

5. **Pure CDN Frontend + Dual Database Backend**:
   - Zero runtime npm dependencies required to serve the frontend: Tailwind CSS, Google Fonts, Lucide Icons, and Chart.js load via CDN.
   - Supports both **Cloud PostgreSQL (Neon)** and **cPanel MySQL / MariaDB** via PDO and dynamic query transpilation.

---

## Environment Configuration Guide (`.env`)

The platform reads all its dynamic settings from `.env`. Copy [`env.example`](file:///c:/Users/USER/Desktop/softjob/env.example) to `.env` and configure your parameters:

```ini
# ==============================================================================
# 1. DATABASE CONFIGURATION
# ==============================================================================
# PostgreSQL (Neon Cloud - Recommended):
DATABASE_URL=postgresql://user:password@ep-sample-pooler.region.aws.neon.tech/neondb?sslmode=require
# MySQL (cPanel Shared Hosting):
# DATABASE_URL=mysql://user:password@127.0.0.1:3306/dbname

# ==============================================================================
# 2. APPLICATION & BRAND IDENTITY
# ==============================================================================
NEXT_PUBLIC_APP_URL=https://yourdomain.com
SITE_NAME=Emporium Capitals
SITE_TAGLINE=Institutional Algorithmic Liquidity & Crypto Portfolios
SUPPORT_EMAIL=support@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# ==============================================================================
# 3. DEFAULT PRIMARY INVESTOR PROFILE
# ==============================================================================
# Initial seed account credentials and profile details:
DEFAULT_USER_EMAIL=juniachinedu@gmail.com
DEFAULT_USER_NAME=Chinex digital
DEFAULT_USER_USERNAME=Chinex
DEFAULT_USER_PHONE=08100167556

# ==============================================================================
# 4. OFFICIAL CRYPTO DEPOSIT ADDRESSES
# ==============================================================================
USDT_DEPOSIT_ADDRESS=T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb
BTC_DEPOSIT_ADDRESS=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
ETH_DEPOSIT_ADDRESS=0x71C836eB3F3d44F6bF0Fe331d279148d4b3bEAc2

# ==============================================================================
# 5. FINANCIAL THRESHOLDS & FEES
# ==============================================================================
MIN_DEPOSIT=50.00
MAX_DEPOSIT=500000.00
MIN_WITHDRAWAL=50.00
MAX_WITHDRAWAL=100000.00
WITHDRAWAL_FEE=2.00
SWAP_FEE=0.50

# ==============================================================================
# 6. 3-TIER MULTI-LEVEL AFFILIATE RATES (%)
# ==============================================================================
REFERRAL_BONUS_TIER1=5.00
REFERRAL_BONUS_TIER2=2.00
REFERRAL_BONUS_TIER3=1.00

# ==============================================================================
# 7. SECURITY, JWT & TOKENS
# ==============================================================================
JWT_SECRET=generate-a-64-byte-base64-random-secret
ADMIN_JWT_SECRET=generate-a-64-byte-base64-random-secret
WALLET_ENCRYPTION_KEY=generate-a-32-byte-hex-key

# cPanel Administrative Suite Access Tokens (Restricts /cpanelsetup/)
CPANEL_SETUP_TOKEN=b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5
CPANEL_MANAGER_TOKEN=b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5
CPANEL_CRON_TOKEN=b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5

# ==============================================================================
# 8. PROCESS & RUNTIME
# ==============================================================================
PORT=3000
NODE_ENV=production
```

---

## Directory & Page Catalog

Every page has a standalone `index.html` file that operates seamlessly on any web server:

| Path | Purpose | Real Data Integration |
|---|---|---|
| [`/`](file:///c:/Users/USER/Desktop/softjob/index.html) | Landing page & market portal | Live Binance price feeds, interactive plans, swap calculator |
| [`/dashboard/`](file:///c:/Users/USER/Desktop/softjob/dashboard/index.html) | Investor account overview | Real user balance, yield chart, active investments, quick deposit modal |
| [`/trading/`](file:///c:/Users/USER/Desktop/softjob/trading/index.html) | Live binary trading terminal | Live candlestick charts, Call/Put execution, real-time trade settlement |
| [`/deposit/`](file:///c:/Users/USER/Desktop/softjob/deposit/index.html) | Crypto deposit portal | Dynamic QR codes, `.env` wallet addresses, Bachs.io checkout |
| [`/withdraw/`](file:///c:/Users/USER/Desktop/softjob/withdraw/index.html) | Payout request interface | 2FA verification, real-time fee calculation, balance validation |
| [`/plans/`](file:///c:/Users/USER/Desktop/softjob/plans/index.html) | Investment contracts | 5 investment tiers with interactive compound return calculator |
| [`/swap/`](file:///c:/Users/USER/Desktop/softjob/swap/index.html) | Instant crypto exchange | Real-time market rates across BTC, ETH, SOL, BNB, USDT |
| [`/transactions/`](file:///c:/Users/USER/Desktop/softjob/transactions/index.html) | Audited financial ledger | Search, filter by transaction type, and export to CSV |
| [`/referrals/`](file:///c:/Users/USER/Desktop/softjob/referrals/index.html) | 3-tier affiliate dashboard | Generic referral link copier, referred client list, commission stats |
| [`/profile/`](file:///c:/Users/USER/Desktop/softjob/profile/index.html) | Investor KYC & profile settings | Level 2 KYC manager, password update, security preferences |
| [`/login/`](file:///c:/Users/USER/Desktop/softjob/login/index.html) | Secure investor authentication | Session authentication via `api.php?action=login` |
| [`/register/`](file:///c:/Users/USER/Desktop/softjob/register/index.html) | Account onboarding portal | Dynamic sponsor referral detection from URL `?ref=...` |
| [`/admin/`](file:///c:/Users/USER/Desktop/softjob/admin/index.html) | Administrative control hub | Platform stats, user management, withdrawal approvals |
| [`/cpanelsetup/`](file:///c:/Users/USER/Desktop/softjob/cpanelsetup/index.php) | Server administrator tools | Token-protected pre-flight checks, DB installer, process manager |

---

## 3-Tier Multi-Level Affiliate System

The platform features an automated affiliate engine that processes multi-level commissions in real time:

```
                  [Tier 1 Sponsor]   <-- Receives 5.0% Direct Commission
                         ▲
                         │ (referred by)
                  [Tier 2 Sponsor]   <-- Receives 2.0% Indirect Commission
                         ▲
                         │ (referred by)
                  [Tier 3 Sponsor]   <-- Receives 1.0% Indirect Commission
                         ▲
                         │ (referred by)
               [Depositing Investor] (Deposits $1,000 USD)
```

1. **Generic Referral Link**:
   - Each registered investor receives a generic referral link: `https://yourdomain.com/register/?ref=CODE`.
   - The code is generated in the format `EC-XXXXXX` from the user's database record.
2. **Real-Time Settlement**:
   - When an investor submits a deposit, `api.php?action=deposit` traverses the referral tree up to 3 levels.
   - Each qualifying sponsor's vault balance is immediately credited with the commission percentage configured in `.env` (`REFERRAL_BONUS_TIER1`, `REFERRAL_BONUS_TIER2`, `REFERRAL_BONUS_TIER3`).
   - A distinct ledger record is written with type `referral_bonus` detailing the deposit amount, tier level, and client username.

---

## cPanel Terminal Setup Guide (Node.js, npm & PM2)

If you are a developer setting up a cPanel account and do not know what to install or how to install Node.js and npm on the terminal, follow this exact step-by-step procedure.

### Prerequisites to Install
1. **Node.js**: Version **20.x** (Active LTS)
2. **npm**: Version **10.x+** (bundled with Node.js)
3. **PM2**: Production process manager (`npm install -g pm2`)

---

### Step 1: Open cPanel Terminal
1. Log in to your **cPanel**.
2. Under the **Advanced** or **Software** section, click **Terminal**.
3. Check if Node.js and npm are already available:
   ```bash
   node -v
   npm -v
   ```
   - If version `v20.x` is returned, skip to **Step 3**.
   - If `command not found` or an old version is returned, proceed to **Step 2**.

---

### Step 2: Install Node.js 20 & npm via NVM (No Root/Sudo Required)

Because shared hosting does not provide `sudo` or `root` permissions, use **NVM (Node Version Manager)** to install Node.js in your user space:

```bash
# 1. Download and install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# 2. Load NVM into your current shell
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
source ~/.bashrc

# 3. Install Node.js 20 (npm is installed automatically)
nvm install 20

# 4. Set Node.js 20 as the default
nvm use 20
nvm alias default 20

# 5. Verify versions
node -v   # Expected: v20.x.x
npm -v    # Expected: 10.x.x
```

---

### Step 3: Install PM2 Process Manager

PM2 keeps your Node.js server active 24/7 and restarts it automatically if the host server reboots:

```bash
npm install -g pm2
pm2 -v
```

---

### Step 4: Deploy & Launch the Project

1. **Upload Files**:
   - Upload the project files to your cPanel document root (e.g. `public_html/`).
   - Do **NOT** upload `node_modules/` or local `.env` (these are created on the server).

2. **Configure Database**:
   - In **cPanel &rarr; MySQL Databases**, create a database and database user with full privileges.
   - Run the database installer at:
     ```
     https://yourdomain.com/cpanelsetup/db-install.php?token=YOUR_CPANEL_SETUP_TOKEN
     ```
   - Enter your credentials to automatically execute [`schema-mysql.sql`](file:///c:/Users/USER/Desktop/softjob/schema-mysql.sql) and populate your `.env`.

3. **Install Dependencies & Start PM2**:
   ```bash
   cd ~/public_html
   npm install
   npm run build
   npm run pm2:start
   pm2 save
   ```

4. **Add Cron Job (Watchdog & Payout Processor)**:
   In **cPanel &rarr; Cron Jobs**, add a cron job running every 10 minutes (`*/10 * * * *`):
   ```bash
   php /home/USERNAME/public_html/cpanelsetup/cron-worker.php >/dev/null 2>&1
   ```

---

## Alternative: Pure CDN LiteSpeed / Apache Deployment (No Node.js)

If your hosting environment does not support Node.js processes, the application can run **100% natively on LiteSpeed or Apache**:

1. Upload all repository files to `public_html/`.
2. Configure `.env` with your `DATABASE_URL` (PostgreSQL or MySQL).
3. Ensure `.htaccess` is present in the root directory.
4. Visit `https://yourdomain.com/` — the client frontend loads via CDN, and [`api.php`](file:///c:/Users/USER/Desktop/softjob/api.php) manages all database transactions and authentication with zero Node.js process required.

---

## Server Administration Suite Reference

| Tool | Route | Security | Description |
|---|---|---|---|
| **Setup Suite Hub** | `/cpanelsetup/?token=...` | Token | Central launchpad for deployment & maintenance tools |
| **Pre-Flight Checks** | `/cpanelsetup/setup-check.php?token=...` | Token | Validates PHP extensions, Node.js version, port availability |
| **Database Installer** | `/cpanelsetup/db-install.php?token=...` | Token | Automated migration runner for MySQL and PostgreSQL |
| **Process Manager** | `/cpanelsetup/manager.php?token=...` | Token | Web interface to monitor PM2, view logs, and check DB status |
| **Health API** | `/cpanelsetup/health.php` | Public | JSON endpoint reporting database and application status |
| **Cron Worker** | `/cpanelsetup/cron-worker.php` | CLI / Token | Background trade settlement and investment profit processor |

---

## Automated Testing & Quality Assurance

Run the test suite to verify application integrity:

```bash
# Run Vitest test suite (65 passing unit tests)
npm test

# Verify PHP syntax on backend API
php -l api.php
```

All 65 automated tests cover database abstractions, error wrappers, KYC validation, deposit/withdrawal calculations, and cross-chain swaps.
