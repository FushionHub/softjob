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

## cPanel Deployment with PM2

The application is configured for production execution via **PM2** on cPanel Terminal with direct Apache reverse proxying on port 3000.

### 1. Upload Project Files
Upload all files to your cPanel document root (e.g., `/home/USERNAME/public_html`), excluding `node_modules/` and `.git/`.

### 2. Configure Database
In cPanel &rarr; **MySQL Databases**, create your database and user. Then open:
```
https://yourdomain.com/cpanel/db-install.php?token=change-me-to-a-long-random-string
```
Enter your database credentials and click **Run Installation & Migrations**.

### 3. Launch with PM2 in cPanel Terminal
Open cPanel **Terminal** and execute:

```bash
# Navigate to document root
cd ~/public_html

# Install dependencies
npm install

# Compile the Next.js production build
npm run build

# Start the application with PM2 using ecosystem.config.js
npm run pm2:start
# (or: pm2 start ecosystem.config.js)

# Save the PM2 list to auto-restart on server reboots
pm2 save
```

### 4. Setup Automated Watchdog / Cron (Every 10 Minutes)
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
