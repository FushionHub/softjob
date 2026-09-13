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

## 3. Step-by-Step Deployment

### Step 1: Upload Files
Upload all files to your cPanel document root (e.g. `/home/USERNAME/public_html`), **excluding** `node_modules/` and `.git/`.

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
# Navigate to project directory
cd ~/public_html

# Install dependencies
npm install

# Build the Next.js production bundle
npm run build

# Start the application using PM2
pm2 start ecosystem.config.js

# Save the process to restart automatically on server reboot
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
