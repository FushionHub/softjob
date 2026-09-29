# Deployment Guide

Emporium Capitals can be deployed to modern cloud hosting platforms (Pxxl, SoftDeploy, Render, Vercel, Railway, DigitalOcean) or traditional cPanel shared hosting.

---

## 1. Cloud & VPS Deployment (Pxxl / SoftDeploy / Ubuntu / Debian)

### Environment Prerequisites
- **Runtime**: Node.js 20.x or 22.x LTS
- **Package Manager**: npm 10+
- **Build System**: Next.js 16 with Webpack / Turbopack integration

### Environment Configuration (`.env`)
Create `.env` in the root of the project:
```ini
# Database: PostgreSQL (Neon) or MySQL
DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require

# Security Keys
JWT_SECRET=generate_with_openssl_rand_base64_64
ADMIN_JWT_SECRET=generate_with_openssl_rand_base64_64
ADMIN_EMAIL=jmauricennadi@gmail.com

# Public URLs
NEXT_PUBLIC_APP_URL=https://www.rico-investimentos.com

# SMTP Email Dispatcher
SMTP_HOST=mail.rico-investimentos.com
SMTP_PORT=465
SMTP_USER=noreply@rico-investimentos.com
SMTP_PASSWORD=your_secure_password
SMTP_FROM="Emporium Capitals <noreply@rico-investimentos.com>"

# Deposit Addresses
BTC_DEPOSIT_ADDRESS=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
ETH_DEPOSIT_ADDRESS=0x71C836eB3F3d44F6bF0Fe331d279148d4b3bEAc2
USDT_DEPOSIT_ADDRESS=T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb
```

### Build & Start Commands
```bash
# 1. Install production dependencies
npm ci

# 2. Build the Next.js bundle
npm run build

# 3. Start the production server
npm run start
# Server listens on port 3000 (or $PORT)
```

### Reverse Proxy & SSL (Nginx / Pxxl / Orion)
If running behind an Nginx reverse proxy, ensure standard forwarded headers are passed:
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## 2. cPanel Shared Hosting (LiteSpeed / Apache)

For cPanel shared hosting environments, a full suite of management scripts is located in `cpanelsetup/`.

### Deployment Steps:
1. **Node.js**: Install via NVM (`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash`).
2. **PM2**: Install globally (`npm install -g pm2`).
3. **Database**: Create a MySQL database and run the installer at `/cpanelsetup/db-install.php`.
4. **Apache Proxy**: The included `.htaccess` automatically routes incoming traffic to the internal Node.js port 3000 while serving static files directly.
5. **Keep-Alive Cron**: Set a cPanel cron job every 10 minutes:
   ```bash
   */10 * * * * php /home/USERNAME/public_html/cpanelsetup/keepalive.php >/dev/null 2>&1
   ```

---

## 3. Database Migration & Dual-Driver Support

The application features a zero-configuration dual-driver adapter (`lib/db.js`):
- If `DATABASE_URL` starts with `postgresql://` or `postgres://`, it uses the `@neondatabase/serverless` connection pool.
- If `DATABASE_URL` starts with `mysql://` or `mysql2://`, it automatically switches to `mysql2/promise`, remapping positional placeholders (`$1`, `$2`) to `?`.

### Initial Schemas:
- **PostgreSQL**: Run `schema.sql` and `admin-schema.sql`.
- **MySQL / MariaDB**: Run `schema-mysql.sql`.
- **Automated Self-Healing**: The server automatically verifies and creates `admin_users` and core tables if missing during startup.
