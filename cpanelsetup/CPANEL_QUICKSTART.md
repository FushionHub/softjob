# cPanel Shared Hosting — 5-Minute PM2 Quickstart

Quick reference card for deploying Emporium Capitals on cPanel using **PM2**.

```
┌────────────────────────────────────────────────────────┐
│             PM2 CPANEL DEPLOYMENT WORKFLOW             │
└────────────────────────────────────────────────────────┘
```

### 0. If Node.js & npm are not installed yet:
In cPanel Terminal, install Node 20 and PM2 with these copy-paste commands:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc && nvm install 20 && nvm use 20 && nvm alias default 20
npm install -g pm2
node -v && npm -v && pm2 -v
```

### 1. Upload & Extract
- Zip repository &rarr; Upload to `public_html` via cPanel File Manager &rarr; Extract.
- Do not upload local `node_modules` or local `.env`.

### 2. Configure Database
- cPanel &rarr; **MySQL Databases** &rarr; Create database & user.
- Open `https://yourdomain.com/cpanelsetup/db-install.php?token=b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5`
  *(Or access the setup hub at `https://yourdomain.com/cpanelsetup/?token=b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5`)*
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
  php /home/USERNAME/public_html/cpanelsetup/cron-worker.php >/dev/null 2>&1
  ```

  *(Processes crypto trades and investment payouts)*.
