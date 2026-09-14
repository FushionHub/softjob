# cPanel Shared Hosting — Enterprise Deployment Guide (PM2 & Node.js)

This guide details how to deploy Emporium Capitals on cPanel shared hosting using **PM2** and `ecosystem.config.js`. Compatible with **LiteSpeed** and **Apache** web servers.

---

## 1. Architecture Overview

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
Served Directly by LiteSpeed/Apache            Apache Reverse Proxy (mod_proxy)
(0 Node.js RAM/CPU used)                      ProxyPass / -> http://127.0.0.1:3000/
                                                                   │
                                                                   ▼
                                                       PM2 Process Manager
                                                     (ecosystem.config.js)
                                                                   │
                                                                   ▼
                                                       server.js (Node.js 20)
                                                        rico-investimentos
```

---

## 2. Prerequisites

| Requirement | Details |
|---|---|
| **cPanel account** | With Terminal, File Manager, MySQL Databases, Cron Jobs |
| **Node.js 20+** | Installed via NVM (see Step 3 below) |
| **npm 10+** | Installed automatically with Node.js |
| **PM2** | Global process manager (`npm install -g pm2`) |
| **MySQL or PostgreSQL** | Via cPanel MySQL Databases or Neon cloud |

---

## 3. Terminal Setup: Installing Node.js & npm on cPanel

If you are a developer setting up on cPanel for the first time, follow these exact steps.

### What Needs to Be Installed
1. **Node.js 20.x (LTS)** — Required runtime for Next.js 16
2. **npm 10.x+** — Package manager (installed automatically with Node.js)
3. **PM2** — Production process manager to keep the app running 24/7

### Step A: Check if Node.js is already installed
Open **cPanel → Terminal** and type:
```bash
node -v
npm -v
```
- If it returns `v20.x.x` (or 18+), skip to **Step C**
- If it returns `command not found` or an old version, proceed to **Step B**

### Step B: Install Node.js 20 via NVM (No Root Needed)

Copy and paste this entire block into your cPanel Terminal:

```bash
# 1. Download and install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# 2. Load NVM into your current shell
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
source ~/.bashrc 2>/dev/null || true

# 3. Install Node.js 20 (npm is installed automatically)
nvm install 20

# 4. Set Node 20 as your permanent default
nvm use 20
nvm alias default 20

# 5. Confirm installation
node -v   # Output: v20.x.x
npm -v    # Output: 10.x.x
```

> **Alternative: If your host has cPanel EasyApache Node.js installed:**
> ```bash
> echo 'export PATH=/opt/cpanel/ea-nodejs20/bin:$PATH' >> ~/.bashrc
> source ~/.bashrc
> ```

### Step C: Install PM2 Globally
```bash
npm install -g pm2
pm2 -v   # Should show a version number
```

---

## 4. Step-by-Step Deployment

### Step 1: Upload Files
Upload all files to your cPanel document root (e.g. `/home/USERNAME/public_html`), **excluding** `node_modules/` and `.git/`.
- Tip: Zip your files locally, upload via cPanel File Manager, and click "Extract".

### Step 2: Configure Environment Variables
Edit `.env` in File Manager with your live values:
```bash
DATABASE_URL=mysql://user:password@127.0.0.1:3306/dbname
JWT_SECRET=your-generated-secret
SMTP_HOST=mail.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Step 3: Install Dependencies & Build
```bash
cd ~/public_html
npm install
npm run build
```

### Step 4: Setup Database
1. Create MySQL database and user in **cPanel → MySQL Databases**
2. Visit: `https://yourdomain.com/cpanelsetup/db-install.php?token=YOUR_TOKEN`
3. Enter credentials and click **Run Installation & Migrations**

### Step 5: Start with PM2
```bash
cd ~/public_html
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

### Step 6: Setup Cron Job
In **cPanel → Cron Jobs**, add every 10 minutes:
```
*/10 * * * * php /home/USERNAME/public_html/cpanelsetup/keepalive.php >/dev/null 2>&1
```

### Step 7: Verify
- Visit `https://yourdomain.com/` → Homepage loads
- Check `pm2 status` → Process is online
- Check `https://yourdomain.com/api/health` → Returns `{"status":"ok"}`

---

## 5. LiteSpeed Specific Notes

LiteSpeed on cPanel shared hosting works identically to Apache for this project:

- `.htaccess` rules are natively supported (LiteSpeed reads Apache `.htaccess`)
- `mod_rewrite`, `mod_proxy`, `mod_headers`, `mod_expires` all work out of the box
- `mod_deflate` and `mod_brotli` are automatically enabled on most LiteSpeed hosts
- PHP runs as `lsapi` which is faster than Apache's `mod_php`

No additional configuration is needed for LiteSpeed — the `.htaccess` file handles everything.

---

## 6. Web Administration & Diagnostic Tools

| Tool | URL | Purpose |
|---|---|---|
| **Startup & Health** | `/cpanelsetup/index.php?token=...` | Check app status, start/stop/restart |
| **Pre-Flight Checklist** | `/cpanelsetup/setup-check.php?token=...` | Verifies PHP, Node, PM2, build readiness |
| **Server Manager** | `/cpanelsetup/manager.php?token=...` | Web control center for process, DB, logs |
| **DB Installer** | `/cpanelsetup/db-install.php?token=...` | 1-click database installer |
| **Cron Worker** | `/cpanelsetup/cron-worker.php` | Background trade settlement & investment processor |
| **Health Check** | `/cpanelsetup/health.php` | JSON status endpoint for uptime monitors |
| **Mail Test** | `/cpanelsetup/mail-test.php?token=...` | SMTP diagnostic tool |

Tokens are configured via `CPANEL_SETUP_TOKEN`, `CPANEL_MANAGER_TOKEN`, `CPANEL_MAILTEST_TOKEN` in `.env`.

---

## 7. Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `502 Bad Gateway` | PM2 is stopped or crashed | Run `pm2 status` and `pm2 restart ecosystem.config.js` |
| `EADDRINUSE: 3000` | Port 3000 occupied | Run `pm2 delete all` and `pm2 start ecosystem.config.js` |
| `command not found: node` | Node.js not installed | Follow Step 3 above to install via NVM |
| Memory limit restart | Process exceeded 500M | PM2 auto-restarts due to `max_memory_restart: "500M"` |
| Static assets 404 | `.next` folder missing | Run `npm run build` in Terminal |
| MySQL connection error | Bad credentials in `.env` | Run `/cpanelsetup/db-install.php` and test connection |
| Emails not delivering | Incorrect SMTP details | Verify `SMTP_*` values in `.env` |
