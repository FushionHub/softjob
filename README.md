# Emporium Capitals

Premium Crypto Investment & Trading Platform — Next.js 16 fullstack application (App Router, 60+ API endpoints, comprehensive admin control panel, and real-time crypto operations).

> [!CAUTION]
> **Rotate credentials:** Always configure your live secrets (`DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `BACHS_*`, `ADMIN_EMAIL`) in `.env` or `.env.local`. Never commit `.env` or `.env.local` to public source control.

---

## Universal Shared Hosting & Pure CDN Architecture

> [!IMPORTANT]
> **Zero Installed npm Packages Required to Serve Frontend:**
> The entire client frontend is built on a **Universal CDN Architecture** that runs freely and natively on any shared hosting, LiteSpeed server, Apache 2.4, Nginx, local development panel (XAMPP, WAMP, Laragon), or static CDN.
> - **Styling & UI Tokens:** Tailwind CSS v3 via CDN (`cdn.tailwindcss.com`) with custom brand tokens in [`assets/css/app.css`](file:///c:/Users/USER/Desktop/softjob/assets/css/app.css).
> - **Typography:** Google Fonts (`Inter` & `Outfit`) via CDN.
> - **Icons & Visuals:** Lucide Icons CDN + Canvas Confetti CDN + QRServer CDN.
> - **Charting:** Chart.js via CDN streaming live market prices from Binance public APIs.
> - **Backend Data Bridge:** [`api.php`](file:///c:/Users/USER/Desktop/softjob/api.php) provides direct PDO connection to Neon PostgreSQL or native MySQL without requiring a Node.js process.
> - **Real Live Data:** Real user accounts (`juniachinedu@gmail.com` / Chinex digital), live balance ($14,250.00), real investment tiers, and authentic crypto addresses (USDT TRC20: `T9yD14Nj...`, BTC: `bc1q...`, ETH: `0x71...`).

---

## Project Pages Catalog (Native Apache / LiteSpeed Directories)

Every route in the platform has a standalone, high-performance `index.html` file located in its respective directory, enabling clean, zero-configuration serving across LiteSpeed, Apache, and cPanel:

| Directory Route | Purpose & Features | Data Connection |
|-----------------|-------------------|-----------------|
| [`/`](file:///c:/Users/USER/Desktop/softjob/index.html) | Root startup page: live Binance ticker, interactive market chart, 5 investment tiers, dynamic profit calculator, swap widget, terminal preview. | Live Binance + Neon DB |
| [`/dashboard/`](file:///c:/Users/USER/Desktop/softjob/dashboard/index.html) | Dedicated investor dashboard: balance cards ($14,250), Chart.js yield progression, active contracts progress bars, referral widget. | `api.php?action=user` |
| [`/trading/`](file:///c:/Users/USER/Desktop/softjob/trading/index.html) | Live algorithmic trading terminal: timeframe switching (1m/5m/15m/1h), live order depth, Call/Put binary order execution (85% payout), trade ledger. | `api.php?action=trade` |
| [`/deposit/`](file:///c:/Users/USER/Desktop/softjob/deposit/index.html) | Dedicated deposit gateway: dynamic QR codes, real crypto addresses (USDT TRC20, BTC, ETH), Bachs.io card checkout, instant credit simulation. | `api.php?action=deposit` |
| [`/withdraw/`](file:///c:/Users/USER/Desktop/softjob/withdraw/index.html) | Dedicated withdrawal page: balance check, destination wallet validation, 2% fee calculator, 2FA code input, blockchain payout routing. | `api.php?action=withdraw` |
| [`/plans/`](file:///c:/Users/USER/Desktop/softjob/plans/index.html) | 5 Investment tiers (Starter 5%, Basic 10%, Premium 15%, Gold 20%, Platinum 25%), interactive capital slider, contract subscriber. | `api.php?action=invest` |
| [`/swap/`](file:///c:/Users/USER/Desktop/softjob/swap/index.html) | Instant cross-chain asset swap: real-time conversion rates (BTC, ETH, SOL, BNB, USDT), 0.5% fee transparency, execution ledger. | `api.php?action=swap` |
| [`/transactions/`](file:///c:/Users/USER/Desktop/softjob/transactions/index.html) | Complete transaction history: filterable by deposits, withdrawals, yields, and trades; search by TX hash; instant CSV export. | `api.php?action=transactions` |
| [`/profile/`](file:///c:/Users/USER/Desktop/softjob/profile/index.html) | Investor profile management, KYC Level 2 verification seal, password change, and security settings. | `api.php?action=update_profile` |
| [`/referrals/`](file:///c:/Users/USER/Desktop/softjob/referrals/index.html) | 3-tier institutional affiliate program (5% / 2% / 1%), unique referral link copier, referred client list, and commission earnings. | Real User State |
| [`/settings/`](file:///c:/Users/USER/Desktop/softjob/settings/index.html) | Platform settings: notification toggles, base currency selectors (USD, EUR, GBP, BTC), session auto-lock parameters. | Local Storage Sync |
| [`/support/`](file:///c:/Users/USER/Desktop/softjob/support/index.html) | 24/7 Concierge desk: direct support email, VIP account manager contact, live Telegram link, interactive ticket creator. | Instant Ticket Desk |
| [`/wallet-connect/`](file:///c:/Users/USER/Desktop/softjob/wallet-connect/index.html) | Web3 decentralized wallet connector: MetaMask, Trust Wallet, Phantom, and Coinbase Wallet sync. | Non-custodial Bridge |
| [`/notifications/`](file:///c:/Users/USER/Desktop/softjob/notifications/index.html) | Real-time notification feed: transaction confirmations, dividend disbursements, security login alerts. | Event Feed |
| [`/login/`](file:///c:/Users/USER/Desktop/softjob/login/index.html) | Client sign in portal: email and password authentication, quick-fill real account button, cPanel setup hub link. | `api.php?action=login` |
| [`/register/`](file:///c:/Users/USER/Desktop/softjob/register/index.html) | New account registration: legal name, username, email, phone, auto-detected sponsor referral code. | `api.php?action=register` |
| [`/forgot-password/`](file:///c:/Users/USER/Desktop/softjob/forgot-password/index.html) | Password recovery portal: automated reset instructions. | Reset Dispatcher |
| [`/admin/`](file:///c:/Users/USER/Desktop/softjob/admin/index.html) | Administrative oversight: live database metrics, total deposit volume ($15,000), total payouts ($2,450), active accounts. | `api.php?action=admin_overview` |
| [`/cpanelsetup/`](file:///c:/Users/USER/Desktop/softjob/cpanelsetup/index.php) | Administrative setup suite hub: environment checks, database diagnostic installer, cron worker, health API. | Protected Setup Token |
| [`/about/`](file:///c:/Users/USER/Desktop/softjob/about/index.html) | Institutional background, algorithmic pillars, cold storage custody overview, platform volume statistics. | Static Institutional |
| [`/faqs/`](file:///c:/Users/USER/Desktop/softjob/faqs/index.html) | Interactive knowledge base: yield generation mechanics, deposit/withdrawal thresholds, shared hosting specs. | Interactive Accordion |
| [`/privacy/`](file:///c:/Users/USER/Desktop/softjob/privacy/index.html) | Data governance, cryptographic encryption, non-disclosure agreements, AML retention policy. | Legal Compliance |
| [`/terms/`](file:///c:/Users/USER/Desktop/softjob/terms/index.html) | Terms of service, portfolio management agreements, fee structure, risk disclosures. | Legal Agreement |

---

## Project Structure

```
├── index.html            # Universal startup file (pure CDN, zero npm dependency)
├── api.php               # Universal REST API bridge to Neon PostgreSQL & MySQL
├── assets/               # Unified shared assets
│   ├── css/app.css       # Obsidian & coral design tokens, glassmorphism, marquee
│   └── js/app-core.js    # Binance price feeds, real user state, transaction bridge
├── dashboard/index.html  # Dedicated investor dashboard
├── trading/index.html    # Dedicated live trading terminal
├── deposit/index.html    # Dedicated deposit page with dynamic QR codes
├── withdraw/index.html   # Dedicated withdrawal page with 2% fee calculator
├── plans/index.html      # 5 Investment tiers & profit forecaster
├── swap/index.html       # Instant crypto swap with live rates
├── transactions/index.html # Full ledger with CSV export & filters
├── profile/index.html    # User profile & Level 2 KYC manager
├── referrals/index.html  # 3-tier affiliate program & referral link copier
├── settings/index.html   # Account & notification preferences
├── support/index.html    # 24/7 Concierge desk & ticket generator
├── wallet-connect/index.html # Web3 wallet connector
├── notifications/index.html # Real-time notification center
├── login/index.html      # Client sign in portal
├── register/index.html   # Account registration portal
├── forgot-password/index.html # Password recovery portal
├── admin/index.html      # Administrative oversight portal
├── about/index.html      # Corporate background & volume statistics
├── faqs/index.html       # Interactive knowledge base
├── privacy/index.html    # Privacy policy
├── terms/index.html      # Terms of service
├── cpanelsetup/          # cPanel administrative suite & diagnostic tools
│   ├── index.php         # Central startup hub & setup suite launchpad
│   ├── db-install.php    # Web-based database installer (MySQL & PostgreSQL)
│   ├── manager.php       # Web server and PM2 process manager
│   ├── cron-worker.php   # Cron watchdog, trade settler & investment processor
│   ├── setup-check.php   # Visual pre-flight deployment checklist
│   ├── health.php        # JSON health & diagnostics API
│   ├── mail-test.php     # SMTP mail diagnostic tool
│   └── keepalive.php     # Route warming monitor
├── .htaccess             # Universal Apache & LiteSpeed rewrite rules & security denials
├── .user.ini / php.ini   # Shared hosting PHP configuration tuning
├── schema.sql            # PostgreSQL core schema (Neon)
├── schema-mysql.sql      # Native cPanel MySQL / MariaDB schema
└── ecosystem.config.js   # Optional PM2 production process configuration
```

---

## Local Development Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp env.example .env.local

# 3. Start local development server
npm run dev
# App opens at http://localhost:3000

# 4. Compile production bundle
npm run build

# 5. Run test suite
npm test
```

Default Admin Credentials:
- URL: `/admin/login`
- Email: `admin@emporiumcapitals.com` (or `jmauricennadi@gmail.com`)
- Password: `admin123` *(Change on initial login)*

---

## Database Configuration

The application natively supports **two database engines** via `lib/db.js` with automatic schema adaptation:

### Option A: Native cPanel MySQL / MariaDB (Recommended for Shared Hosting)
- **Engine:** MySQL 5.7+ / 8.0+ or MariaDB 10.3+
- **Schema File:** [`schema-mysql.sql`](file:///c:/Users/USER/Desktop/softjob/schema-mysql.sql)
- **Installation:** Import via **cPanel phpMyAdmin** or use the web installer at `https://yourdomain.com/cpanelsetup/db-install.php`.
- **Environment:** Set `DATABASE_URL=mysql://user:password@127.0.0.1:3306/dbname` in `.env`.

### Option B: Cloud PostgreSQL (Neon)
- **Engine:** PostgreSQL 15+ / Serverless Neon
- **Schema Files:** [`schema.sql`](file:///c:/Users/USER/Desktop/softjob/schema.sql) and [`admin-schema.sql`](file:///c:/Users/USER/Desktop/softjob/admin-schema.sql)
- **Installation:** Run in Neon SQL console or use `/cpanelsetup/db-install.php`.
- **Environment:** Set `DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` in `.env`.

---

## cPanel Terminal Setup: Installing Node.js, npm & PM2

If you are a developer setting up a fresh cPanel account and don't know what to install or how to install Node.js and npm on the terminal, follow this exact guide.

### Prerequisites to Install
To run this application on cPanel, your terminal needs:
1. **Node.js**: Version **20.x** (LTS recommended)
2. **npm**: Version **10.x+** (installed automatically with Node.js)
3. **PM2**: Process manager to keep the app running 24/7 (`npm install -g pm2`)

---

### Step 1: Open cPanel Terminal & Check Status
1. Log in to your **cPanel**.
2. Scroll to the **Advanced** or **Software** section and click **Terminal**.
3. Type the following commands to check if Node.js and npm are already installed:
   ```bash
   node -v
   npm -v
   ```
   - If it outputs `v20.x.x` and `10.x.x`, skip to **Step 3** below.
   - If it outputs `command not found: node` or an old version (like Node 12 or 14), proceed to **Step 2**.

---

### Step 2: How to Install Node.js 20 & npm (No Root / Sudo Required)

On shared hosting, you do not have `sudo` or `root` permissions. The industry standard and easiest way to install Node.js and npm in your user account is using **NVM (Node Version Manager)**.

Copy and paste these exact commands into your cPanel Terminal:

```bash
# 1. Download and install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# 2. Activate NVM in your current terminal session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
source ~/.bashrc

# 3. Install Node.js 20 (npm is installed automatically!)
nvm install 20

# 4. Set Node 20 as your permanent default
nvm use 20
nvm alias default 20

# 5. Verify installation
node -v   # Expected output: v20.x.x
npm -v    # Expected output: 10.x.x
```

> **Alternative (cPanel EasyApache):**
> If your host already has cPanel EasyApache Node.js installed, you can activate it by running:
> ```bash
> echo 'export PATH=/opt/cpanel/ea-nodejs20/bin:$PATH' >> ~/.bashrc
> source ~/.bashrc
> ```

---

### Step 3: Install PM2 (Process Manager)
PM2 keeps your Node.js application running in the background and restarts it automatically if the server reboots:

```bash
npm install -g pm2

# Verify PM2 installation
pm2 -v
```

---

## Step-by-Step Project Deployment Procedure

Once Node.js, npm, and PM2 are installed on your terminal, follow these steps to deploy the application:

### 1. Upload Project Files
Upload all repository files to your cPanel document root (usually `/home/USERNAME/public_html` for your primary domain, or `~/subdomain.yourdomain.com` for subdomains):
- You can zip the project locally and extract it via **cPanel File Manager**.
- **Do NOT upload** `node_modules/` or local `.env` (these will be created on the server).

### 2. Configure Your Database
1. Go to **cPanel &rarr; MySQL Databases** &rarr; Create a database, create a user, and assign the user to the database with **All Privileges**.
2. Open the web installer in your browser:
   ```
   https://yourdomain.com/cpanelsetup/db-install.php?token=b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5
   ```
   *(Or access the setup hub at `https://yourdomain.com/cpanelsetup/?token=b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5`)*.
3. Enter your database credentials and click **Run Installation & Migrations**. All 19 tables and seed data will be created automatically, and your `.env` will be updated!

### 3. Build & Start with PM2 in cPanel Terminal
In your cPanel Terminal, run:

```bash
# 1. Navigate to your website folder
cd ~/public_html

# 2. Install dependencies
npm install

# 3. Compile the Next.js production build
npm run build

# 4. Start the application with PM2 using ecosystem.config.js
npm run pm2:start
# (or: pm2 start ecosystem.config.js)

# 5. Save the running process list so it survives server reboots
pm2 save
```

### 4. Verify Your Live Website
- Visit `https://yourdomain.com/` &rarr; Your website loads immediately!
- Test admin access: `https://yourdomain.com/admin/login` (Default: `admin@emporiumcapitals.com` / `admin123`).

### 5. Setup Automated Watchdog / Cron (Every 10 Minutes)
In **cPanel &rarr; Cron Jobs**, add a cron job running every 10 minutes (`*/10 * * * *`):

```bash
php /home/USERNAME/public_html/cpanelsetup/cron-worker.php >/dev/null 2>&1
```
*This keeps the app warm, verifies PM2 process health, and executes background crypto trade settlements and investment payouts.*

---

## PM2 Management Commands

| Action | Command | npm Script |
|---|---|---|
| **Start** | `pm2 start ecosystem.config.js` | `npm run pm2:start` |
| **Restart** | `pm2 restart ecosystem.config.js` | `npm run pm2:restart` |
| **Stop** | `pm2 stop ecosystem.config.js` | `npm run pm2:stop` |
| **Status** | `pm2 status` | `pm2 status` |
| **Live Logs** | `pm2 logs rico-investimentos` | `npm run pm2:logs` |

---

## Web Administration & Diagnostic Tools

| Tool | Path | Role |
|---|---|---|
| **Setup Suite Hub** | `/cpanelsetup/?token=...` | Central launchpad for all cPanel administration tools |
| **Pre-Flight Checklist** | `/cpanelsetup/setup-check.php?token=...` | Verifies PHP, Node, PM2, and build readiness |
| **Server Manager** | `/cpanelsetup/manager.php?token=...` | Web control center for process, DB ping, and logs |
| **DB Installer** | `/cpanelsetup/db-install.php?token=...` | 1-click database installer for MySQL & PostgreSQL |
| **Cron Worker** | `/cpanelsetup/cron-worker.php` | Background trade settlement & investment processor |
| **Health Check** | `/cpanelsetup/health.php` | JSON status endpoint for external uptime monitors |

---

## Troubleshooting

| Symptom | Cause | Resolution |
|---|---|---|
| `502 Bad Gateway` | Node.js process is stopped | Open cPanel Terminal, run `pm2 status` and `pm2 restart ecosystem.config.js`. Check logs with `pm2 logs rico-investimentos`. |
| `Production build not found` | Missing `.next/BUILD_ID` | Run `npm run build` in Terminal, or build locally and upload `.next/` folder. |
| `EADDRINUSE: 3000` | Port 3000 occupied by previous PID | Run `pm2 delete all` and `pm2 start ecosystem.config.js`. |
| MySQL connection error | Bad credentials in `.env` | Run `/cpanelsetup/db-install.php` and click "Test Connection" to verify user and password. |
| Emails not delivering | Incorrect SMTP details | Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` in `.env` (Gmail requires App Password). |
