# Emporium Capitals

Premium Crypto Investment & Trading Platform — Next.js 16 fullstack application (App Router, 60+ API endpoints, comprehensive admin control panel, and real-time crypto operations).

> [!CAUTION]
> **Rotate credentials:** Always configure your live secrets (`DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `BACHS_*`, `ADMIN_EMAIL`) in `.env`. Never commit `.env` to public source control.

---

## Project Structure

```
├── app/                  # Next.js App Router pages + 60+ API routes
├── components/           # Reusable UI components
├── sections/             # Marketing and dashboard section layouts
├── lib/                  # Core services (db.js, auth.js, email.js, wallets.js, etc.)
│   ├── db.js             # Dual-driver DB adapter (MySQL & PostgreSQL Neon)
│   └── wallets.js        # Static deposit wallet addresses config
├── public/               # Static public assets (images, icons, fonts)
├── cpanelsetup/          # cPanel management & monitoring suite
│   ├── index.php         # Startup & health check entry point
│   ├── db-install.php    # Web-based database installer (MySQL & PostgreSQL)
│   ├── manager.php       # Web server and PM2 process manager
│   ├── cron-worker.php   # Cron watchdog, trade settler & investment processor
│   ├── setup-check.php   # Visual pre-flight deployment checklist
│   ├── health.php        # JSON health & diagnostics API
│   ├── mail-test.php     # SMTP mail diagnostic tool
│   ├── keepalive.php     # Route warming monitor
│   └── DEPLOY.md         # Detailed deployment guide
├── ecosystem.config.js   # PM2 production process configuration
├── server.js             # Next.js production HTTP server wrapper
├── schema-mysql.sql      # Native cPanel MySQL / MariaDB production schema
├── schema.sql            # PostgreSQL core schema (Neon)
├── admin-schema.sql      # PostgreSQL admin schema (Neon)
├── .htaccess             # Apache direct reverse proxy (PM2 port 3000) & static offload
├── .user.ini / php.ini   # Shared hosting PHP configuration tuning
├── .env                  # Environment variables (sole config file)
└── package.json          # Project scripts and dependencies
```

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp env.example .env
# Edit .env with your live secrets

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
- Email: `jmauricennadi@gmail.com`
- Password: `admin123` *(Change on initial login)*

---

## Deploying to cPanel Shared Hosting (Step-by-Step)

This guide walks you through deploying Emporium Capitals on cPanel shared hosting with **LiteSpeed/Apache** — even if you have never used a terminal before.

### Prerequisites

You need a cPanel account with:
- **Terminal** access (under "Advanced" or "Software" in cPanel)
- **File Manager** or FTP access to upload files
- **MySQL Databases** (under "Databases" in cPanel)
- **Cron Jobs** (under "Advanced" in cPanel)

### Step 1: Install Node.js & npm on cPanel Terminal

Open **cPanel → Terminal** (click the Terminal icon in your cPanel dashboard). If you see a black terminal window, you're in the right place.

**Check if Node.js is already installed:**
```bash
node -v
npm -v
```
- If you see `v20.x.x` (or v18+), skip to **Step 2**.
- If you see `command not found` or an error, continue below.

**Install NVM (Node Version Manager) — no root access needed:**

Copy and paste this entire block into your cPanel Terminal and press Enter:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Wait for it to finish (takes ~10 seconds). Then paste this:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
source ~/.bashrc 2>/dev/null || true
```

**Install Node.js 20 (npm is included automatically):**

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

**Verify everything works:**
```bash
node -v    # Should show: v20.x.x
npm -v     # Should show: 10.x.x
```

> **Alternative:** If your host has cPanel EasyApache Node.js, try:
> ```bash
> echo 'export PATH=/opt/cpanel/ea-nodejs20/bin:$PATH' >> ~/.bashrc
> source ~/.bashrc
> ```

### Step 2: Install PM2 (Process Manager)

PM2 keeps your app running 24/7 and restarts it if it crashes:

```bash
npm install -g pm2
pm2 -v    # Should show a version number
```

### Step 3: Upload Project Files

1. Zip all project files on your computer (exclude `node_modules/` and `.git/`)
2. Upload the zip to cPanel **File Manager** → `/home/USERNAME/public_html/`
3. Extract the zip in File Manager

Alternatively, use the cPanel Terminal:
```bash
cd ~/public_html
# Upload via SCP, Git, or File Manager
```

### Step 4: Configure Environment Variables

In cPanel File Manager, open `.env` and fill in your live values:

```
DATABASE_URL=mysql://your_user:your_password@127.0.0.1:3306/your_dbname
JWT_SECRET=your-generated-secret-here
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=465
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_email_password
SMTP_FROM=noreply@yourdomain.com
ADMIN_EMAIL=your-admin@email.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
BACHS_API_KEY=sk_live_your_key_here
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Install Dependencies & Build

In cPanel Terminal:
```bash
cd ~/public_html

# Install all dependencies
npm install

# Build the production bundle
npm run build
```

> **Important:** The build creates the `.next/` folder. This must exist for the app to run.

### Step 6: Setup the Database

1. Create a MySQL database and user in **cPanel → MySQL Databases**
2. Open in your browser:
   ```
   https://yourdomain.com/cpanelsetup/db-install.php?token=YOUR_CPANEL_SETUP_TOKEN
   ```
3. Enter your database credentials and click **Run Installation & Migrations**
4. The default admin account is created automatically

### Step 7: Start the Application

```bash
cd ~/public_html

# Start with PM2
pm2 start ecosystem.config.js

# Save so PM2 restarts on server reboot
pm2 save

# Check it's running
pm2 status
```

### Step 8: Setup Cron Job (Keep-Alive + Trade Processing)

In **cPanel → Cron Jobs**, add a new cron job running every 10 minutes:

```
*/10 * * * * php /home/USERNAME/public_html/cpanelsetup/keepalive.php >/dev/null 2>&1
```

### Step 9: Verify

- Visit `https://yourdomain.com/` — the homepage should load
- Visit `https://yourdomain.com/api/health` — should return `{"status":"ok"}`
- Check PM2 status: `pm2 status`

---

## cPanel Setup Tools

| Tool | URL | Purpose |
|---|---|---|
| **Startup & Health** | `/cpanelsetup/index.php?token=...` | Check app status, start/stop/restart |
| **Pre-Flight Checklist** | `/cpanelsetup/setup-check.php?token=...` | Verifies PHP, Node, PM2, build readiness |
| **Server Manager** | `/cpanelsetup/manager.php?token=...` | Web control center for process, DB, logs |
| **DB Installer** | `/cpanelsetup/db-install.php?token=...` | 1-click database installer (MySQL & PostgreSQL) |
| **Cron Worker** | `/cpanelsetup/cron-worker.php` | Background trade settlement & investment processor |
| **Health Check** | `/cpanelsetup/health.php` | JSON status endpoint for external uptime monitors |
| **Mail Test** | `/cpanelsetup/mail-test.php?token=...` | SMTP diagnostic tool |

All tokens are configured via `CPANEL_SETUP_TOKEN`, `CPANEL_MANAGER_TOKEN`, `CPANEL_MAILTEST_TOKEN` in your `.env` file.

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

## Database Configuration

The application supports **two database engines** via `lib/db.js` with automatic schema adaptation:

### Option A: Native cPanel MySQL / MariaDB (Recommended for Shared Hosting)
- **Engine:** MySQL 5.7+ / 8.0+ or MariaDB 10.3+
- **Schema File:** `schema-mysql.sql`
- **Installation:** Import via **cPanel phpMyAdmin** or use the web installer at `https://yourdomain.com/cpanelsetup/db-install.php`.
- **Environment:** Set `DATABASE_URL=mysql://user:password@127.0.0.1:3306/dbname` in `.env`.

### Option B: Cloud PostgreSQL (Neon)
- **Engine:** PostgreSQL 15+ / Serverless Neon
- **Schema Files:** `schema.sql` and `admin-schema.sql`
- **Installation:** Run in Neon SQL console or use `/cpanelsetup/db-install.php`.
- **Environment:** Set `DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` in `.env`.

---

## Deposit System

### Default: Direct Crypto Deposits
Users send crypto directly to static wallet addresses configured in `.env`:

```
USDT_DEPOSIT_ADDRESS=T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb
BTC_DEPOSIT_ADDRESS=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
ETH_DEPOSIT_ADDRESS=0x71C836eB3F3d44F6bF0Fe331d279148d4b3bEAc2
```

Wallet addresses are managed via `lib/wallets.js` and served through `/api/wallets`. QR codes are generated client-side via the `api.qrserver.com` API.

### Alternative: Bachs.io Card Payments
Users can also pay with card, mobile money, or bank transfer via Bachs.io hosted checkout. Set `BACHS_API_KEY=sk_live_...` in `.env` to enable.

---

## Troubleshooting

| Symptom | Cause | Resolution |
|---|---|---|
| `502 Bad Gateway` | Node.js process stopped | Run `pm2 status` and `pm2 restart ecosystem.config.js` in Terminal |
| `command not found: node` | Node.js not installed | Follow Step 1 above to install via NVM |
| `Production build not found` | Missing `.next/BUILD_ID` | Run `npm run build` in Terminal |
| `EADDRINUSE: 3000` | Port occupied by old process | Run `pm2 delete all` then `pm2 start ecosystem.config.js` |
| MySQL connection error | Bad credentials in `.env` | Run `/cpanelsetup/db-install.php` and test connection |
| Emails not delivering | Incorrect SMTP details | Verify `SMTP_*` values in `.env` |
| Static assets 404 | `.next` folder missing | Run `npm run build` in Terminal |
