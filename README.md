# Emporium Capitals

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.1-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](#)

Institutional-Grade Crypto Investment, Trading & Asset Management Platform built on Next.js 16 (App Router), featuring a **Real-Time Binary Trading Terminal**, multi-currency **Instant Crypto Swap**, live price feeds via Binance Vision CDN, automated contract settlement, dual-driver database persistence (PostgreSQL / MySQL), and a comprehensive administrative command center.

> [!CAUTION]
> **Rotate credentials:** Always configure your live secrets (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `SMTP_*`, `ADMIN_EMAIL`) in `.env`. Never commit `.env` to public source control.

---

## 📚 Documentation Index

Detailed architectural and deployment documentation is available in the [`docs/`](file:///c:/Users/USER/Desktop/softjob/docs) directory:

- 📊 [**Real-Time Trading & Crypto Pricing Engine**](file:///c:/Users/USER/Desktop/softjob/docs/TRADING_AND_PRICES.md) — Live Binance Vision feed, ticker statistics, tick glow animations, mark-to-market floating P&L, and automated trade settlement.
- 🔌 [**API Reference**](file:///c:/Users/USER/Desktop/softjob/docs/API.md) — Complete endpoint documentation for Market Data, Trading, Swap, Authentication, Deposits, and the Admin Desk.
- 🏛️ [**Architecture & System Design**](file:///c:/Users/USER/Desktop/softjob/docs/ARCHITECTURE.md) — System topology, security models, session management, and dual-driver DB abstraction.
- 🚀 [**Multi-Platform Deployment Guide**](file:///c:/Users/USER/Desktop/softjob/docs/DEPLOYMENT.md) — Production setup on Pxxl, SoftDeploy, Linux VPS, Docker, and cPanel shared hosting.

---

## 🌟 Core Features

### 1. Real-Time Trading Terminal (`/trading`)
- **Live Market Feed**: Ultra-reliable price stream backed by Binance Vision global CDN (`https://data-api.binance.vision`).
- **Supported Pairs**: BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, XRP/USDT, ADA/USDT, DOGE/USDT, TRX/USDT.
- **Micro-Tick Flash**: Visual green/red tick glows on real-time price changes.
- **Market Metrics**: 24h High/Low, Best Bid, Best Ask, Spread, and 24h Volume.
- **Synchronized Charts**: Interactive TradingView charts coupled with a live simulated Order Book & Depth monitor.
- **Contract Execution**: Call (Higher) and Put (Lower) binary contracts with 85% return rate and durations from 1m to 24h.
- **Mark-to-Market Positions**: Live floating P&L (`IN THE MONEY 🎯` vs `OUT OF THE MONEY ⚠️`) and countdown progress bars.
- **Automated Settlement**: Zero-delay settlement on expiry with direct balance crediting and profit history logging.

### 2. Instant Crypto Swap (`/swap`)
- Live rate calculation between all supported assets and stablecoins.
- Atomic balance conversion with instant portfolio updates.

### 3. Investor Dashboard (`/dashboard`)
- Real-time portfolio valuation in USD.
- Visual asset distribution charts and earnings growth breakdown.
- Fast-action deposit and withdrawal requests.

### 4. Admin Command Desk (`/admin`)
- Accessible via `/admin/login` (Protected by `admin_token` JWT).
- **User Management**: Balance adjustments, status controls, and user logs.
- **Deposit & Withdrawal Processing**: 1-click approvals and rejections with automated email dispatch.
- **KYC Verification**: Document audit desk for identity approvals.
- **Global Logs**: Audit trail of transactions, swaps, and trades.

---

## Project Structure

```
├── app/                  # Next.js App Router pages + 60+ API routes
│   ├── (marketing)/      # Public marketing landing pages
│   ├── admin/            # Administrative control center pages
│   ├── api/              # Backend REST API routes (prices, trade, swap, auth, etc.)
│   ├── dashboard/        # Customer investor dashboard
│   ├── swap/             # Instant crypto swap desk
│   └── trading/          # Real-time binary trading terminal
├── components/           # UI components (TradingView widgets, layout, forms, toasts)
├── docs/                 # Detailed system & architecture documentation
├── lib/                  # Core modules (crypto-prices.js, db.js, auth.js, lifecycle.js)
├── cpanelsetup/          # cPanel monitoring, cron worker & database installer suite
├── schema.sql            # PostgreSQL core schema (Neon)
├── admin-schema.sql      # PostgreSQL admin schema (Neon)
├── schema-mysql.sql      # Native cPanel MySQL / MariaDB production schema
├── proxy.js              # Reverse proxy header normalization & redirect helpers
├── .env                  # Environment configuration
└── package.json          # Project scripts and dependencies
```

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp env.example .env
# Fill in DATABASE_URL, JWT_SECRET, and ADMIN_EMAIL in .env

# 3. Start local development server
npm run dev
# Terminal runs at http://localhost:3000

# 4. Compile production bundle
npm run build

# 5. Start production server
npm run start
```

### 🛡️ Administrator Credentials & Access Points

| Field | Detail |
|---|---|
| **Dedicated Admin Portal** | [`/admin/login`](https://www.rico-investimentos.com/admin/login) |
| **Unified Investor Portal** | [`/login`](https://www.rico-investimentos.com/login) (Supports both Investor & Admin via portal tabs or automatic role detection) |
| **Primary Super Admin** | `admin@emporiumcapitals.com` |
| **Secondary Super Admin** | `jmauricennadi@gmail.com` |
| **Alternative Administrator** | `admin@example.com` |
| **Shorthand Login** | Entering `admin` as the email in the admin portal automatically routes to the Super Admin account |
| **Default Master Password** | `admin123` |
| **Session Cookie** | `admin_token` (HTTP-only, SameSite=Lax, Path=/, 24-hour expiration) |

> [!TIP]
> **Self-Healing Authentication:** If the database hash ever gets out of sync during manual SQL imports, logging in with `admin123` (or the configured `ADMIN_PASSWORD` in `.env`) automatically validates the admin and immediately re-synchronizes the password hash in the database.

---

## Environment Variables Dictionary

| Variable | Description | Example / Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL or MySQL connection string | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Secret key for signing customer user tokens | `64-character base64 string` |
| `ADMIN_JWT_SECRET` | Secret key for signing admin desk tokens | `64-character base64 string` |
| `ADMIN_EMAIL` | Default administrator login email | `jmauricennadi@gmail.com` |
| `NEXT_PUBLIC_APP_URL` | Canonical public website URL | `https://www.rico-investimentos.com` |
| `SMTP_HOST` | Outgoing SMTP mail server | `mail.rico-investimentos.com` |
| `SMTP_PORT` | SMTP port (465 SSL or 587 TLS) | `465` |
| `SMTP_USER` | SMTP username | `noreply@rico-investimentos.com` |
| `SMTP_PASSWORD` | SMTP password | `********` |
| `SMTP_FROM` | Outgoing display name and email | `"Emporium Capitals <noreply@...>` |
| `BTC_DEPOSIT_ADDRESS` | Static Bitcoin wallet address | `bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh` |
| `ETH_DEPOSIT_ADDRESS` | Static Ethereum wallet address | `0x71C836eB3F3d44F6bF0Fe331d279148d4b3bEAc2` |
| `USDT_DEPOSIT_ADDRESS` | Static Tether (TRC20) wallet address | `T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb` |

---

## Production Deployment Overview

See [**docs/DEPLOYMENT.md**](file:///c:/Users/USER/Desktop/softjob/docs/DEPLOYMENT.md) for full setup guides:

### 1. Modern Cloud & VPS (Pxxl, SoftDeploy, DigitalOcean, Render)
```bash
npm ci
npm run build
npm run start
```
*Behind Nginx or reverse proxy, ensure `X-Forwarded-Proto` and `X-Forwarded-Host` are passed.*

### 2. cPanel Shared Hosting (LiteSpeed / Apache)
1. Install Node.js 20+ via NVM.
2. Install PM2: `npm install -g pm2`.
3. Set up MySQL database via `/cpanelsetup/db-install.php`.
4. Start process: `pm2 start ecosystem.config.js && pm2 save`.
5. Add Keep-Alive Cron job running every 10 minutes:
   ```bash
   */10 * * * * php /home/USERNAME/public_html/cpanelsetup/keepalive.php >/dev/null 2>&1
   ```

---

## Troubleshooting Guide

| Symptom | Cause | Resolution |
|---|---|---|
| `/api/admin/*` responds with 401 | Missing `admin_token` cookie | Standard security behavior. Log in at `/admin/login`. |
| `/api/auth/login` responds with 401 | Invalid email or password | Check user credentials in database or register at `/register`. |
| `[Violation] Permissions policy: unload` | TradingView widget unload handler | Informational browser warning from third-party widget. Harmless. |
| Mixed-Content / "Form is not secure" | Reverse proxy missing forwarded headers | Ensure `X-Forwarded-Proto: https` is passed or use `proxy.js` redirect helper. |
| Crypto prices showing static/offline | Binance API rate limit / block | The engine automatically falls back to Binance Vision CDN mirror and cache. |
| `502 Bad Gateway` (cPanel) | Node.js process halted | Check `pm2 status` and run `pm2 restart ecosystem.config.js`. |
