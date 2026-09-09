# cPanel Shared Hosting — 5-Minute PM2 Quickstart

Quick reference card for deploying Emporium Capitals on cPanel using **PM2**.

```
┌────────────────────────────────────────────────────────┐
│             PM2 CPANEL DEPLOYMENT WORKFLOW             │
└────────────────────────────────────────────────────────┘
```

### 1. Upload & Extract
- Zip repository &rarr; Upload to `public_html` via cPanel File Manager &rarr; Extract.
- Do not upload local `node_modules` or local `.env`.

### 2. Configure Database
- cPanel &rarr; **MySQL Databases** &rarr; Create database & user.
- Open `https://yourdomain.com/cpanel/db-install.php?token=change-me-to-a-long-random-string`
- Enter credentials &rarr; Click **Run Installation & Migrations**.

### 3. Build & Run with PM2 in cPanel Terminal
Open cPanel **Terminal** and run:

```bash
# 1. Install dependencies
npm install

# 2. Build the Next.js application
npm run build

# 3. Start with PM2 using ecosystem.config.js
pm2 start ecosystem.config.js

# 4. Save PM2 process list across server restarts
pm2 save
```

### 4. PM2 Useful Commands
- **Check status:** `pm2 status`
- **View live logs:** `pm2 logs rico-investimentos`
- **Restart app:** `pm2 restart ecosystem.config.js`
- **Stop app:** `pm2 stop ecosystem.config.js`

### 5. Automated Watchdog / Cron (Every 10 min)
- cPanel &rarr; **Cron Jobs** &rarr; Every 10 min:
  ```bash
  php /home/USERNAME/public_html/cpanel/cron-worker.php >/dev/null 2>&1
  ```
  *(Processes crypto trades and investment payouts)*.
