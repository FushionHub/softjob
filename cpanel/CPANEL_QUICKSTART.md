# cPanel Shared Hosting — 5-Minute Quickstart

Quick reference card for deploying Emporium Capitals on cPanel.

```
┌────────────────────────────────────────────────────────┐
│               5-MINUTE CPANEL DEPLOYMENT               │
└────────────────────────────────────────────────────────┘
```

### 1. Upload & Extract
- Zip repository &rarr; Upload to `public_html` via cPanel File Manager &rarr; Extract.
- Don't upload local `node_modules` or local `.env`.

### 2. Configure Database
- cPanel &rarr; **MySQL Databases** &rarr; Create database & user.
- Open `https://yourdomain.com/cpanel/db-install.php?token=change-me-to-a-long-random-string`
- Enter credentials &rarr; Click **Run Installation & Migrations**.

### 3. Build & Run
**Method A (Setup Node.js App - CloudLinux):**
- cPanel &rarr; **Setup Node.js App** &rarr; Create:
  - Startup file: `server.js`
  - Node Version: `20`
- Click **Run NPM Install**.
- Open cPanel Terminal &rarr; Run `npm run build` &rarr; Click **Restart**.

**Method B (Pure Apache / No Node App UI):**
- Terminal &rarr; `npm install --production && npm run build`
- Visit your website `https://yourdomain.com/` (auto-boots via `index.php`).

### 4. Setup Cron (Every 10 min)
- cPanel &rarr; **Cron Jobs** &rarr; Every 10 min:
  ```
  php /home/USERNAME/public_html/cpanel/cron-worker.php >/dev/null 2>&1
  ```

### 5. Control Panel & Diagnostics
- **Check Status:** `https://yourdomain.com/cpanel/setup-check.php`
- **Server Manager:** `https://yourdomain.com/cpanel/manager.php`
- **Default Admin:** `admin@emporiumcapitals.com` / `admin123`
