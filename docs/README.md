# Emporium Capitals — Technical Documentation

This document provides a comprehensive technical reference for engineers, system administrators, and DevOps personnel deploying and maintaining **Emporium Capitals**.

---

## 1. System Architecture

The platform is architected around two complementary paradigms:

```
                                  [ Incoming Traffic ]
                                            │
                                            ▼
                    ┌──────────────────────────────────────────────┐
                    │      LiteSpeed / Apache 2.4 / Nginx          │
                    │         (Root .htaccess & RewriteRules)      │
                    └──────────────────────┬───────────────────────┘
                                           │
                ┌──────────────────────────┴──────────────────────────┐
                ▼                                                     ▼
     [ Pure CDN Frontend ]                                 [ Next.js 16 SSR / PM2 ]
   • Standalone HTML per route                            • Node.js 20 LTS
   • Tailwind CSS v3 via CDN                              • server.js wrapper
   • Chart.js & Lucide Icons                              • PM2 process supervision
   • Direct fetch to api.php                              • Route /api/* handling
                │                                                     │
                └──────────────────────────┬──────────────────────────┘
                                           │
                                           ▼
                                [ Unified REST API ]
                                   (api.php / PDO)
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     ▼                                           ▼
          [ PostgreSQL 15+ / Neon ]                  [ MySQL 5.7+ / MariaDB ]
          • Serverless connection pooler              • Native cPanel database
          • schema.sql & admin-schema.sql             • schema-mysql.sql
```

### Pure CDN Frontend
- **Zero Build Artifacts Required**: Every client page (`/`, `/dashboard/`, `/trading/`, `/deposit/`, `/withdraw/`, `/plans/`, `/swap/`, `/transactions/`, `/profile/`, `/referrals/`, `/login/`, `/register/`, `/admin/`) is served as a static HTML file.
- **Client Assets**: All design tokens, animations, and modals are encapsulated in [`assets/css/app.css`](file:///c:/Users/USER/Desktop/softjob/assets/css/app.css) and [`assets/js/app-core.js`](file:///c:/Users/USER/Desktop/softjob/assets/js/app-core.js).
- **Zero Mock / Demo Data**: Pages bootstrap with real user state and live Binance websocket/REST tickers, synchronizing with the database via [`api.php`](file:///c:/Users/USER/Desktop/softjob/api.php).

---

## 2. Environment Configuration Dictionary (`.env`)

Every operational parameter is defined in `.env`. The table below outlines each key:

| Variable | Type | Default / Example | Purpose |
|---|---|---|---|
| `DATABASE_URL` | String | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` | Master database connection string (PostgreSQL or MySQL). |
| `SITE_NAME` | String | `Emporium Capitals` | Platform brand name injected into navigation, titles, and API config. |
| `SITE_TAGLINE` | String | `Institutional Algorithmic Liquidity & Crypto Portfolios` | Brand tagline shown in headers, footers, and SEO meta tags. |
| `SUPPORT_EMAIL` | String | `support@emporiumcapitals.com` | Primary support email displayed across modals and support desk. |
| `ADMIN_EMAIL` | String | `jmauricennadi@gmail.com` | Operator email receiving KYC alerts, payout requests, and error notifications. |
| `DEFAULT_USER_EMAIL` | String | `juniachinedu@gmail.com` | Primary default investor account email used as fallback for guest sessions. |
| `DEFAULT_USER_NAME` | String | `Chinex digital` | Legal display name for the default investor account. |
| `DEFAULT_USER_USERNAME` | String | `Chinex` | Username for the default investor account. |
| `DEFAULT_USER_PHONE` | String | `08100167556` | Contact phone number for the default investor account. |
| `USDT_DEPOSIT_ADDRESS` | String | `T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb` | Official USDT (TRC20) cold custody wallet for client deposits. |
| `BTC_DEPOSIT_ADDRESS` | String | `bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh` | Official Bitcoin SegWit wallet for client deposits. |
| `ETH_DEPOSIT_ADDRESS` | String | `0x71C836eB3F3d44F6bF0Fe331d279148d4b3bEAc2` | Official Ethereum (ERC20) wallet for client deposits. |
| `MIN_DEPOSIT` | Float | `50.00` | Minimum allowed deposit in USD equivalent. |
| `MAX_DEPOSIT` | Float | `500000.00` | Maximum allowed deposit in USD equivalent. |
| `MIN_WITHDRAWAL` | Float | `50.00` | Minimum allowed withdrawal threshold in USD. |
| `MAX_WITHDRAWAL` | Float | `100000.00` | Maximum allowed withdrawal ceiling per transaction in USD. |
| `WITHDRAWAL_FEE` | Float | `2.00` | Platform processing fee percentage deducted on withdrawals. |
| `SWAP_FEE` | Float | `0.50` | Liquidity provider spread percentage on instant crypto swaps. |
| `REFERRAL_BONUS_TIER1`| Float | `5.00` | Percentage credited to Tier 1 direct sponsor on client deposits. |
| `REFERRAL_BONUS_TIER2`| Float | `2.00` | Percentage credited to Tier 2 indirect sponsor on client deposits. |
| `REFERRAL_BONUS_TIER3`| Float | `1.00` | Percentage credited to Tier 3 indirect sponsor on client deposits. |
| `JWT_SECRET` | String | Base64 String | Cryptographic signing secret for user session tokens. |
| `ADMIN_JWT_SECRET` | String | Base64 String | Cryptographic signing secret for administrator clearance. |
| `WALLET_ENCRYPTION_KEY`| String | 64-char Hex | AES-256 key for storing private credentials and seed phrases. |
| `CPANEL_SETUP_TOKEN` | String | 64-char Hex | Security token required to access `/cpanelsetup/` diagnostic tools. |
| `PORT` | Integer | `3000` | Port for the optional Next.js / Node.js background process. |

---

## 3. Real-Time 3-Tier Multi-Level Affiliate System

### Architecture & Mechanics
1. **Generic Referral Links**:
   - Every investor is assigned a persistent, generic referral code upon registration (or derived from username/email).
   - Format: `https://yourdomain.com/register/?ref=EC-XXXXXX`
   - When visitors land with `?ref=...`, the code is stored in `localStorage` and auto-populated in the registration form.
2. **Referral Hierarchy**:
   - The `users` table contains a `referred_by` column pointing to the sponsor's `id` or `referral_code`.
   - The tree traverses up to 3 levels:
     - Level 1 (Direct Sponsor): Receives `REFERRAL_BONUS_TIER1` (Default: 5%).
     - Level 2 (Sponsor of Sponsor): Receives `REFERRAL_BONUS_TIER2` (Default: 2%).
     - Level 3 (Root Sponsor): Receives `REFERRAL_BONUS_TIER3` (Default: 1%).
3. **Execution on Deposit**:
   - Upon confirming a deposit in [`api.php?action=deposit`](file:///c:/Users/USER/Desktop/softjob/api.php), the commission calculator executes:
     ```php
     $tierRates = [1 => $tier1Rate, 2 => $tier2Rate, 3 => $tier3Rate];
     // Loop through sponsor chain up to 3 generations
     // Credit sponsor balance: balance = balance + commission
     // Insert into transactions (type: 'referral_bonus')
     // Insert into notifications for sponsor
     ```
   - Commissions are liquid and available immediately for trading, investing, or withdrawal.

---

## 4. cPanel Terminal Setup & Deployment

Follow this guide when configuring a fresh shared hosting or VPS cPanel environment.

### 4.1. Node.js & npm Installation (via NVM)
Because cPanel shared hosting users lack root/sudo permissions, install Node.js in user-space using NVM:

```bash
# 1. Download and install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# 2. Source NVM in the active terminal session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
source ~/.bashrc

# 3. Install Node.js 20 LTS
nvm install 20

# 4. Set Node 20 as default
nvm use 20
nvm alias default 20

# 5. Verify versions
node -v   # Returns v20.x.x
npm -v    # Returns 10.x.x
```

### 4.2. PM2 Process Manager Installation
Install PM2 globally in your user directory:
```bash
npm install -g pm2
pm2 -v
```

### 4.3. Project Deployment Workflow
```bash
# Navigate to web root
cd ~/public_html

# Install dependencies
npm install

# Compile Next.js production build
npm run build

# Launch application via ecosystem.config.js
npm run pm2:start

# Save process list to persist across reboots
pm2 save
```

### 4.4. Cron Job Automation
Set up a recurring cron job in **cPanel &rarr; Cron Jobs** running every 10 minutes (`*/10 * * * *`):
```bash
php /home/USERNAME/public_html/cpanelsetup/cron-worker.php >/dev/null 2>&1
```
The cron worker:
- Verifies that PM2 is active and restarts it if an outage is detected.
- Checks pending binary trades and closes contracts whose expiry timestamp has passed.
- Credits daily ROI dividends on active investment packages.
- Cleans orphaned temporary upload files.

---

## 5. Security & Administrative Access

### Client-Facing Isolation
- Client-facing investor pages contain **no administrative or cPanel setup links**.
- Navigation and footer components focus strictly on user features (Dashboard, Trading, Plans, Deposit, Withdraw, Swap, Ledger, KYC).

### Gated Setup Suite (`/cpanelsetup/`)
The setup directory provides server administrators with critical deployment tools:
- `index.php`: Central management dashboard.
- `setup-check.php`: Validates PHP modules (`pdo_pgsql`, `pdo_mysql`, `curl`, `openssl`), Node.js, and PM2.
- `db-install.php`: Web-based database installer for MySQL and PostgreSQL.
- `manager.php`: Process restart and log inspection tool.
- `health.php`: Unauthenticated JSON health probe for uptime monitors.

All web administrative interfaces require `?token=YOUR_CPANEL_SETUP_TOKEN` matching the `CPANEL_SETUP_TOKEN` defined in `.env`.

---

## 6. REST API Reference (`api.php`)

All requests can be submitted via `GET` or `POST` to `/api.php`:

| Endpoint Action | Method | Description |
|---|---|---|
| `?action=config` | GET | Returns live `.env` settings (addresses, limits, fees, affiliate tiers). |
| `?action=user` | GET/POST | Retrieves investor profile, balances, active investments, and transactions. |
| `?action=deposit` | POST | Records a crypto deposit and processes 3-tier affiliate commissions. |
| `?action=withdraw` | POST | Validates balance and records a payout request. |
| `?action=invest` | POST | Subscribes investor to one of the 5 investment plans. |
| `?action=trade` | POST | Opens a Call/Put binary order with specified expiry. |
| `?action=swap` | POST | Executes an instant crypto currency exchange. |
| `?action=referrals` | GET/POST | Fetches list of sponsored investors and commission totals. |
| `?action=transactions` | GET/POST | Fetches historical ledger entries with pagination and filtering. |
| `?action=update_profile`| POST | Updates legal name, phone number, and KYC status. |
| `?action=login` | POST | Authenticates investor credentials. |
| `?action=register` | POST | Creates a new investor account with optional sponsor code. |
