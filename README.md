# Emporium Capitals

Crypto investment platform — Next.js 16 fullstack app (pages, APIs, admin panel).

> [!CAUTION]
> **Rotate credentials:** a previous commit published a `.env` with live secrets
> (Neon password, SMTP password, Bachs `sk_live` key, JWT secret) to the public
> `origin/main` history. Regenerate each key in its dashboard (Neon, mail
> provider, Bachs.io), then set the new values in `.env.local`
> (never commit it).

## Structure

```
app/                  Pages + 62 API routes (auth, deposits, swap, trade, KYC, Bachs, admin…)
components/ lib/ sections/ scripts/
lib/db.js             Dual-driver DB adapter (Postgres default, MySQL opt-in)
public/               Static assets
cpanel/               PHP helpers for Node hosting (proxy, manager, db-install…)
schema.sql / admin-schema.sql   PostgreSQL schemas (Neon)
package.json / proxy.js / server.js / next.config.mjs
```

## Quickstart

```bash
npm install
cp env.example .env.local   # JWT_SECRET, DATABASE_URL, SMTP_*, ADMIN_EMAIL, BACHS_*, GOOGLE_*
npm run dev                 # http://localhost:3000
npm run build               # production build (server.js serves .next/)
```

Admin: `/admin/login` → `jmauricennadi@gmail.com` / `admin123` (change it;
seeded from `admin-schema.sql`).

## Database

- Default: Neon PostgreSQL — `psql $DATABASE_URL -f schema.sql -f admin-schema.sql`.
- Or shared MySQL: set `DATABASE_URL=mysql://…` (needs the `mysql2` package,
  already in `package.json`). Same queries run on both engines; the switch is
  config-only, both directions.

## Deploy

- **cPanel shared hosting** (see `cpanel/DEPLOY.md` for the full guide):
  1. Upload everything except `node_modules/` + `.next/`; docroot = app root.
  2. Node.js app → startup file `server.js` (`npm install`, then `npm run build`).
     Pure-Apache hosts: `touch .use_php_proxy` so `index.php` fronts all routes.
  3. Set env vars (copy `env.example` → `.env`, incl. `CPANEL_*` tokens you invent).
  4. Run `cpanel/db-install.php?token=…` (then **delete it**), set the Bachs
     webhook to `https://yourdomain.com/api/bachs/webhook`, add the keepalive cron.
  5. Requires `AllowOverride FileInfo AuthConfig` so `.htaccess` protections apply.
- **VPS**: build + `node server.js`.
- **Vercel**: import the repo, set env vars, deploy.

## Troubleshooting

| Symptom | Fix |
|---|---|
| 500 `relation does not exist` | run `schema.sql` + `admin-schema.sql`; API self-heals on retry |
| Admin login 401 | re-run `admin-schema.sql` (`ON CONFLICT DO UPDATE` repairs the seed hash) |
| MySQL mode 500s | `mysql2` installed? `mysql://` scheme? migrations run? remote access allowed? |
| Mail not sending | `SMTP_*` in `.env.local` (Gmail needs an App Password) |
| 403 on `/.env`, `/server.js`, `/package.json` | intended — secrets/source are blocked at both layers |
| 503 cold-start page on cPanel | Node app asleep or crashed — check manager/logs, keepalive cron warms it |
| Rewrites ignored / secrets downloadable | `AllowOverride None` on host — request `FileInfo AuthConfig` |
