# cPanel Shared Hosting — Enterprise Deployment Guide

This guide details how to deploy Emporium Capitals on any cPanel shared hosting environment with zero compromises, maximum performance, and automated operations.

---

## 1. Hosting Architecture Overview

Emporium Capitals supports a **Dual Hosting Engine** architecture designed to run on 100% of cPanel shared hosts:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Incoming HTTP / HTTPS Traffic                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         Apache / LiteSpeed Web Server
                                    │
       ┌────────────────────────────┴─────────────────────────────┐
       ▼                                                          ▼
[Direct Static Offloading]                                [Dynamic Routes]
- /_next/static/* (Next.js Chunks)                                │
- /public/* (Images, Icons, Fonts)                                │
- 1-Year Immutable Caching                                        │
- Brotli & Gzip Compression                                       │
       │                                                          │
       ▼                                                          ▼
Served Directly by Apache                         ┌───────────────┴───────────────┐
(0 Node.js RAM/CPU used)                          ▼                               ▼
                                       [CloudLinux Passenger]          [PHP Proxy & Supervisor]
                                      cPanel "Setup Node.js App"       Fallback for Pure Apache
                                                  │                               │
                                                  ▼                               ▼
                                              server.js                       index.php
                                                  │                               │
                                                  └───────────────┬───────────────┘
                                                                  ▼
                                                      Next.js Production App
                                                        (Port or Unix Socket)
```

1. **Engine A (Recommended): CloudLinux Passenger ("Setup Node.js App")**
   - Available on most shared cPanel hosts with CloudLinux OS.
   - Passenger natively manages application processes, workers, and sockets.
2. **Engine B (Universal Fallback): Pure Apache / LiteSpeed + PHP Auto-Starter (`index.php`)**
   - Available on budget or standard Apache/LiteSpeed cPanel hosts without the Node.js selector UI.
   - `index.php` acts as an intelligent supervisor: boots Node in the background if idle, displays an elegant branded cold-start screen, and reverse-proxies all traffic with streaming and cookie persistence.

---

## 2. Choosing Your Database

| Feature | cPanel Native MySQL / MariaDB (Recommended) | Neon Cloud PostgreSQL |
|---|---|---|
| **Location** | Local on your cPanel account | Remote cloud database |
| **Tool** | cPanel phpMyAdmin / MySQL Wizard | Neon Web Console |
| **Schema File** | `schema-mysql.sql` | `schema.sql` + `admin-schema.sql` |
| **PHP Extension** | `pdo_mysql` or `mysqli` (100% pre-installed) | `pdo_pgsql` (often disabled on shared) |
| **Latency** | ~0.2ms (Localhost socket) | 20–80ms (Cloud roundtrip) |
| **DATABASE_URL** | `mysql://user:pass@127.0.0.1:3306/dbname` | `postgresql://user:pass@ep-xxx.neon.tech/neondb` |

---

## 3. Step-by-Step Deployment

### Step 1: Upload Files
Upload all repository files to your application directory (e.g. `/home/USERNAME/public_html` or `/home/USERNAME/emporiumcapitals`), **excluding**:
- `node_modules/` (always install on the server)
- `.git/` (unless using cPanel Git Version Control)
- Local `.env` (configure in cPanel or manager)

> **Tip:** Creating a `.zip` locally and extracting via cPanel File Manager takes ~10 seconds.

### Step 2: Database Setup (1 Minute)
1. In cPanel, go to **MySQL Databases** &rarr; Create a database and user with full privileges.
2. Open your browser to:
   ```
   https://yourdomain.com/cpanel/db-install.php?token=YOUR_TOKEN
   ```
   *(Set `CPANEL_SETUP_TOKEN=YOUR_TOKEN` in `.env` or edit the file)*.
3. Select **cPanel Native MySQL / MariaDB**, fill in your credentials, and click **Run Installation & Migrations**.
4. The installer automatically creates all 19 tables, seeds default data, and updates `.env` with your `DATABASE_URL`!
5. Default administrator credentials:
   - Email: `admin@emporiumcapitals.com`
   - Password: `admin123` *(Change immediately after first login)*

### Step 3: Application Setup

#### If your cPanel has "Setup Node.js App" (Engine A):
1. Go to **Setup Node.js App** &rarr; **Create Application**.
   - **Node.js version:** 20 (or 18 / 22)
   - **Application mode:** Production
   - **Application root:** `/home/USERNAME/public_html` (or your folder)
   - **Application startup file:** `server.js`
2. Click **Run NPM Install**.
3. Open cPanel **Terminal** and compile the build:
   ```bash
   npm run build
   ```
4. Back in the Node.js app screen, click **Restart**.

#### If your cPanel does NOT have Node.js App UI (Engine B):
1. Open cPanel **Terminal** (or run via one-off Cron):
   ```bash
   cd ~/public_html
   npm install --production
   npm run build
   ```
2. Visit `https://yourdomain.com/`. `index.php` will auto-detect your Node binary, boot `server.js` in the background, and proxy all traffic!

> **RAM-Saving Pro-Tip for Low Memory Plans:**
> If `npm run build` fails on your server due to shared hosting RAM limits, build locally on your computer with `npm run build`, and upload the generated `.next/` folder to cPanel!

---

## 4. Setup Automated Watchdog & Cron (Every 10 Minutes)

Shared hosting plans sleep idle processes to save resources. Setting up a cPanel Cron Job ensures your application stays warm, revives automatically if stopped, and executes crypto trades/investment payouts on schedule.

1. Go to **cPanel &rarr; Cron Jobs**.
2. Select **Every 10 minutes** (`*/10 * * * *`).
3. Enter the command (tailored to your server):
   ```bash
   php /home/USERNAME/public_html/cpanel/cron-worker.php >/dev/null 2>&1
   ```
4. Click **Add New Cron Job**.

---

## 5. Web Management Suite

Your installation includes a complete cPanel web suite under `/cpanel/`:

| Tool | URL | Description |
|---|---|---|
| **Pre-Flight Check** | `/cpanel/setup-check.php?token=...` | Visual prerequisite checklist (PHP, Node, Build, DB) |
| **Server Manager** | `/cpanel/manager.php?token=...` | Process monitor, live restart/start/stop, and log viewer |
| **DB Installer** | `/cpanel/db-install.php?token=...` | One-click MySQL and PostgreSQL installer |
| **Watchdog Worker** | `/cpanel/cron-worker.php` | CLI / Web keep-alive and trade settlement processor |
| **Health API** | `/cpanel/health.php` | JSON status endpoint for external uptime monitors |

---

## 6. Automated Deployment via cPanel Git (`.cpanel.yml`)

If you host your code on GitHub/GitLab:
1. In cPanel, navigate to **Git Version Control** &rarr; **Create**.
2. Clone your repository.
3. Under **Manage**, click **Deploy HEAD Commit**.
4. The included `.cpanel.yml` will automatically copy all application files, public assets, and server configs to your public document root with correct permissions!

---

## 7. Troubleshooting Matrix

| Issue | Cause | Resolution |
|---|---|---|
| `Production build not found` | `.next/BUILD_ID` missing | Run `npm run build` in Terminal, or upload `.next/` from local build. |
| `Port already in use (EADDRINUSE)` | Another process took port 3000 | Set `PORT=3005` in `.env` or cPanel Node.js screen. |
| 503 on first visit | Application cold starting | Normal for shared hosting. Page will auto-refresh in ~3 seconds. Cron in Step 4 eliminates cold starts. |
| MySQL connection refused | Incorrect DB credentials | Run `cpanel/db-install.php` and click "Test Connection" to verify user/password. |
| Uploaded images not showing | Direct static rule missing | Root `.htaccess` handles direct delivery from `/public/*`. Ensure file exists in `public/`. |
| `.env` file downloaded directly | Apache rules bypassed | Root `.htaccess` blocks `.env*`. `index.php` also provides code-level 403 enforcement. |
| `pdo_pgsql not found` | Host lacks Postgres driver | Switch to native cPanel MySQL using `schema-mysql.sql` in `cpanel/db-install.php`. |
