# cPanel Shared Hosting — Enterprise Deployment Guide (PM2 & Node.js)

This guide details how to deploy Emporium Capitals on cPanel shared hosting using **PM2** and `ecosystem.config.js`.

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
Served Directly by Apache                         Apache Reverse Proxy (mod_proxy)
(0 Node.js RAM/CPU used)                          ProxyPass / -> http://127.0.0.1:3000/
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

## 2. PM2 Configuration (`ecosystem.config.js`)

The project includes `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "rico-investimentos",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
```

---

## 3. Terminal Setup: Installing Node.js, npm & PM2 on cPanel

If you are a developer setting up on cPanel for the first time, you might not know what needs to be installed or how to install Node.js without `root` / `sudo` access. Follow these exact steps:

### What Needs to Be Installed
1. **Node.js 20.x (LTS)** — Required runtime for Next.js 16.
2. **npm 10.x+** — Package manager (installed automatically with Node.js).
3. **PM2** — Production process manager to keep the application running 24/7.

---

### Step A: Check if Node.js is already installed
Open **cPanel &rarr; Terminal** (under the "Advanced" or "Software" category) and type:
```bash
node -v
npm -v
```
- If it returns `v20.x.x` (or 18+), you already have Node.js! Skip to **Step C**.
- If it returns `command not found: node` or an old version, proceed to **Step B**.

---

### Step B: How to Install Node.js 20 & npm via NVM (No Root Needed)
On shared hosting, you cannot run `sudo apt` or `yum`. Instead, you install **NVM (Node Version Manager)** inside your user account. It takes 30 seconds:

Copy and paste this block into your cPanel Terminal:

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

# 4. Set Node 20 as your permanent default
nvm use 20
nvm alias default 20

# 5. Confirm installation
node -v   # Output: v20.x.x
npm -v    # Output: 10.x.x
```

> **Alternative: If your host has cPanel EasyApache Node.js installed**
> ```bash
> echo 'export PATH=/opt/cpanel/ea-nodejs20/bin:$PATH' >> ~/.bashrc
> source ~/.bashrc
> ```

---

### Step C: Install PM2 Globally
Once npm is working, install PM2:
```bash
npm install -g pm2

# Verify PM2 is ready
pm2 -v
```

---

## 4. Step-by-Step Project Deployment Procedure

### Step 1: Upload Files
Upload all files to your cPanel document root (e.g. `/home/USERNAME/public_html`), **excluding** `node_modules/` and `.git/`.
- Tip: Zip your files locally, upload via cPanel File Manager, and click "Extract".

### Step 2: Database Setup (1 Minute)
1. Create a MySQL database and user in **cPanel &rarr; MySQL Databases**.
2. Open in your browser:
   ```
   https://yourdomain.com/cpanel/db-install.php?token=change-me-to-a-long-random-string
   ```
3. Enter your database details and click **Run Installation & Migrations**.
4. Default admin: `admin@emporiumcapitals.com` / `admin123`.

### Step 3: Run with PM2 in cPanel Terminal
Open cPanel **Terminal** and run:

```bash
# 1. Navigate to your project folder
cd ~/public_html

# 2. Install dependencies
npm install

# 3. Build the Next.js production bundle
npm run build

# 4. Start the application using PM2 and ecosystem.config.js
pm2 start ecosystem.config.js

# 5. Save the process so PM2 restarts automatically if the server reboots
pm2 save
```

### Step 4: Verify
- Visit `https://yourdomain.com/` &rarr; Homepage loads immediately with 0 cold start screen!
- Check PM2 status: `pm2 status`
- View live application logs: `pm2 logs rico-investimentos`

---

## 4. Setup Automated Watchdog / Trade Processor (Cron)

In **cPanel &rarr; Cron Jobs**, add a cron job every 10 minutes (`*/10 * * * *`):

```bash
php /home/USERNAME/public_html/cpanel/cron-worker.php >/dev/null 2>&1
```

This processes scheduled crypto trade settlements and mature investment returns in the background.

---

## 5. Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `502 Bad Gateway` | PM2 is stopped or crashed | Run `pm2 status` and `pm2 logs rico-investimentos` in cPanel terminal. Run `pm2 restart ecosystem.config.js`. |
| `EADDRINUSE: 3000` | Port 3000 occupied by old process | Run `pm2 delete all` and `pm2 start ecosystem.config.js`. |
| Memory limit restart | Process exceeded 500M | PM2 will automatically restart it cleanly due to `max_memory_restart: "500M"`. |
| Static assets 404 | `.next` folder missing | Run `npm run build` in Terminal. |
