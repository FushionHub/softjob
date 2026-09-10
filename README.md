# Emporium Capitals

Premium Crypto Investment & Trading Platform — Next.js 16 fullstack application (App Router, 60+ API endpoints, comprehensive admin control panel, and real-time crypto operations).

> [!CAUTION]
> **Rotate credentials:** Always configure your live secrets (`DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `BACHS_*`, `ADMIN_EMAIL`) in `.env` or `.env.local`. Never commit `.env` or `.env.local` to public source control.

---

## Project Structure

```
├── app/                  # Next.js App Router pages + 60+ API routes
├── components/           # Reusable UI components
├── sections/             # Marketing and dashboard section layouts
├── lib/                  # Core services (db.js, auth.js, email.js, lifecycle.js, etc.)
│   └── db.js             # Dual-driver DB adapter (MySQL & PostgreSQL Neon)
├── public/               # Static public assets (images, icons, fonts)
├── cpanel/               # cPanel management & monitoring suite
│   ├── db-install.php    # Web-based database installer (MySQL & PostgreSQL)
│   ├── manager.php       # Web server and PM2 process manager
│   ├── cron-worker.php   # Cron watchdog, trade settler & investment processor
│   ├── setup-check.php   # Visual pre-flight deployment checklist
│   ├── health.php        # JSON health & diagnostics API
│   ├── mail-test.php     # SMTP mail diagnostic tool
│   └── keepalive.php     # Route warming monitor
├── ecosystem.config.js   # PM2 production process configuration
├── server.js             # Next.js production HTTP server wrapper
├── schema-mysql.sql      # Native cPanel MySQL / MariaDB production schema
├── schema.sql            # PostgreSQL core schema (Neon)
├── admin-schema.sql      # PostgreSQL admin schema (Neon)
├── .htaccess             # Apache direct reverse proxy (PM2 port 3000) & static offload
├── .user.ini / php.ini   # Shared hosting PHP configuration tuning
└── package.json          # Project scripts and dependencies
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
- **Installation:** Import via **cPanel phpMyAdmin** or use the web installer at `https://yourdomain.com/cpanel/db-install.php`.
- **Environment:** Set `DATABASE_URL=mysql://user:password@127.0.0.1:3306/dbname` in `.env`.

### Option B: Cloud PostgreSQL (Neon)
- **Engine:** PostgreSQL 15+ / Serverless Neon
- **Schema Files:** [`schema.sql`](file:///c:/Users/USER/Desktop/softjob/schema.sql) and [`admin-schema.sql`](file:///c:/Users/USER/Desktop/softjob/admin-schema.sql)
- **Installation:** Run in Neon SQL console or use `/cpanel/db-install.php`.
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
   https://yourdomain.com/cpanel/db-install.php?token=change-me-to-a-long-random-string
   ```
   *(Or edit `CPANEL_SETUP_TOKEN` in `.env` to your custom token)*.
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
php /home/USERNAME/public_html/cpanel/cron-worker.php >/dev/null 2>&1
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
| **Pre-Flight Checklist** | `/cpanel/setup-check.php?token=...` | Verifies PHP, Node, PM2, and build readiness |
| **Server Manager** | `/cpanel/manager.php?token=...` | Web control center for process, DB ping, and logs |
| **DB Installer** | `/cpanel/db-install.php?token=...` | 1-click database installer for MySQL & PostgreSQL |
| **Cron Worker** | `/cpanel/cron-worker.php` | Background trade settlement & investment processor |
| **Health Check** | `/cpanel/health.php` | JSON status endpoint for external uptime monitors |

---

## Troubleshooting

| Symptom | Cause | Resolution |
|---|---|---|
| `502 Bad Gateway` | Node.js process is stopped | Open cPanel Terminal, run `pm2 status` and `pm2 restart ecosystem.config.js`. Check logs with `pm2 logs rico-investimentos`. |
| `Production build not found` | Missing `.next/BUILD_ID` | Run `npm run build` in Terminal, or build locally and upload `.next/` folder. |
| `EADDRINUSE: 3000` | Port 3000 occupied by previous PID | Run `pm2 delete all` and `pm2 start ecosystem.config.js`. |
| MySQL connection error | Bad credentials in `.env` | Run `/cpanel/db-install.php` and click "Test Connection" to verify user and password. |
| Emails not delivering | Incorrect SMTP details | Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` in `.env` (Gmail requires App Password). |
