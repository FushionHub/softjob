# cPanel Shared Hosting — Deploy Guide

> **Zero project changes.** This setup only *adds* files (`server.js`, `.htaccess`,
> `.nvmrc`, `cpanel/`). No existing code, config, or behavior is modified.
>
> **Honest constraint:** PHP cannot run Next.js. This app requires **Node.js 20**
> on the server. On cPanel shared hosting that means your plan must include
> **"Setup Node.js App"** (CloudLinux). PHP's role here is supporting, not serving:
> browser-based DB installer, health checks, and a keep-alive cron so Passenger
> doesn't cold-start on every visitor.

## 0. Requirement check (2 minutes)

1. Log in to cPanel → look under **Software** for **"Setup Node.js App"**.
   - **Present:** continue below (Passenger path, recommended). Select **Node.js 20** (matches `.nvmrc`).
   - **Absent (pure Apache/LiteSpeed only):** fallback path exists via `index.php`,
     which auto-starts Node and reverse-proxies traffic. Requirements for the
     fallback: a Node 20 binary reachable on the host, PHP `exec`/`shell_exec`/
     `proc_open` enabled, and `curl` extension. Steps: point the domain's
     document root at the app root, complete steps 1, 3–8 below via Terminal/Cron
     (no Node-app UI), then run `touch /home/USERNAME/emporiumcapitals/.use_php_proxy`
     to activate the `.htaccess` rewrite into `index.php`. If `exec` is disabled
     or no Node binary exists, the app cannot run on that plan — upgrade or use
     a Node-capable host (Vercel, Render, a VPS).

## 1. Upload the project

Upload everything in this folder to the application root, e.g.
`/home/USERNAME/emporiumcapitals`, **excluding**:

- `node_modules/` (installed on the server — Windows binaries won't run on Linux)
- `.next/` (built on the server; see step 4 — unless the build keeps running out
  of memory, in which case see Troubleshooting)
- `.env` / `.env.local` (set these in the Node.js app UI instead, step 5)

File Manager (zip → upload → extract) is faster than FTP for thousands of files.

## 2. Create the Node.js app

cPanel → **Setup Node.js App** → **Create Application**:

| Field | Value |
|---|---|
| Node.js version | 20 |
| Application mode | Production |
| Application root | `/home/USERNAME/emporiumcapitals` |
| Application URL | your domain (e.g. `https://yourdomain.com`) |
| Application startup file | `server.js` |

`server.js` reads the port from `PORT` (injected by Passenger), verifies the
`.next` production build exists, and serves the app. It fails fast with a clear
message if you forgot the build step.

## 3. Install dependencies

In the Node.js app screen click **"Run NPM Install"** (runs `npm install`
against the project `package.json`). Wait for it to finish — shared hosts are
slow; 5–15 minutes is normal.

## 4. Build the app

Open cPanel **Terminal** (or SSH if provided), then:

```bash
cd ~/emporiumcapitals
npm run build
```

Expect route output ending with `ƒ Proxy (Middleware)`. Then back in the
Node.js app screen, click **Restart**.

> No Terminal available? Some hosts allow a one-off command via cron:
> `cd ~/emporiumcapitals && npm run build` run once, then delete the cron entry.
> Otherwise contact support to run the build for you.

## 5. Environment variables

In the Node.js app screen add **every** variable from `env.example`
(at minimum `JWT_SECRET`, `DATABASE_URL`, `SMTP_HOST/PORT/USER/PASSWORD`,
`ADMIN_EMAIL`, `NEXT_PUBLIC_APP_URL=https://yourdomain.com`,
`BACHS_*`, `GOOGLE_*`, `KYC_*`). Restart the app after saving.

> `NEXT_PUBLIC_*` values are baked in at **build time** — set them *before*
> step 4, or rebuild after changing them.

## 6. Database (no SSH needed)

Visit `https://yourdomain.com/cpanel/db-install.php?token=YOUR_TOKEN`:

1. First set `CPANEL_SETUP_TOKEN` to a random string — either as a Node.js app
   environment variable or by editing the default in `cpanel/db-install.php`.
2. Paste your Neon `DATABASE_URL`, tick both schema files, Install.
3. **Delete `db-install.php` from the server when done.**

Prefer the Neon console? Run `schema.sql`, then `admin-schema.sql` there instead.
Either way, the API also self-heals missing tables on first request.

Default admin: `jmauricennadi@gmail.com` / `admin123` — change it on first login.

## 7. Keep the app warm + watchdog (cron)

Passenger stops idle apps, causing slow first loads. Add a Cron Job (every
10–15 minutes) using the watchdog worker — it warms `/` and `/api/prices`,
revives Node if the port goes quiet, and rotates `keepalive.log`:

```
php /home/USERNAME/emporiumcapitals/cpanel/cron-worker.php
```

Set `CPANEL_CRON_TOKEN` (Node app env) if you also want to trigger it via
web (`cron-worker.php?token=...`); CLI cron needs no token. The base URL is
read from `NEXT_PUBLIC_APP_URL` in `.env` automatically.
(`keepalive.php` remains as a lighter alternative warmer.)

## 7b. Manage the server from the browser

`https://yourdomain.com/cpanel/manager.php?token=YOUR_TOKEN` — live process
status, start/stop/restart, log viewer, build + DB checks, and links to the
health check, DB installer, and mail tester. Set `CPANEL_MANAGER_TOKEN` in the
Node.js app env first. Test mail delivery with `mail-test.php?token=...`
(same token pattern; delete both test scripts when finished).

## 8. Verify

- `https://yourdomain.com/cpanel/health.php` → JSON: `next_build: true`,
  `node_modules: true`, required env flags `true`.
- `https://yourdomain.com/` → homepage loads.
- `https://yourdomain.com/admin/login` → admin login works.
- Register a test user → verify login, dashboard, and email delivery.

## What each added file does

| File | Role |
|---|---|
| `server.js` | Passenger startup wrapper (`next({dev:false}).prepare()` + `listen(PORT)`) |
| `index.php` | Pure-Apache fallback: auto-starts Node, reverse-proxies all routes, branded cold-start screen |
| `.use_php_proxy` | Marker file (create with `touch`) that activates the `.htaccess` rewrite into `index.php`. Only for hosts **without** Passenger |
| `.nvmrc` | Pins Node 20 for the app selector |
| `.htaccess` (root) | Secret blocking + static caching + gated rewrite to `index.php` (Passenger-safe) |
| `public/.htaccess` | Static-asset caching/compression when Apache serves `public/` directly |
| `cpanel/health.php` | JSON diagnostics (versions, extensions, files, env presence — no secrets) |
| `cpanel/db-install.php` | Token-gated browser installer for both schema files (delete after use) |
| `cpanel/sql-splitter.php` | Shared SQL splitter used by the installer (quote/dollar-quote aware) |
| `cpanel/manager.php` | Token-gated web control panel: status, start/stop/restart, logs, build + DB checks |
| `cpanel/mail-test.php` | Token-gated SMTP port + `mail()` diagnostics (delete after use) |
| `cpanel/cron-worker.php` | Cron watchdog: warms routes, revives Node, rotates logs |
| `cpanel/keepalive.php` | Lighter alternative cron warmer |

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `server.js` logs "Production build not found" | Step 4 not done. Build, then Restart. |
| 503 / app won't start | Check app logs in the Node.js screen; usually a missing env var (`JWT_SECRET`, `DATABASE_URL`) or a failed `npm install`. |
| Build runs out of memory | Shared plans are RAM-limited. Build **locally** (`npm run build`), upload the resulting `.next/` folder, then restart. Never upload local `node_modules/`. |
| Slow first visit, fast after | Normal Passenger cold start — the cron in step 7 mitigates it. |
| `NEXT_PUBLIC_*` change has no effect | Those are build-time constants — rebuild + restart. |
| Emails not sending | Verify `SMTP_*` in the app env screen (Gmail needs an App Password, not the login password), then restart. |
| Admin login 500 `admin_users does not exist` | Run step 6. The API self-heals on retry as a fallback. |
| `manager.php` / `mail-test.php` 403 | Set `CPANEL_MANAGER_TOKEN` (manager) or the file token (mail-test) and pass `?token=...`. |
| Watchdog revives on wrong port | It reads `.cpanel_node.pid` (written by manager starts), then `PORT` in `.env`, then 3000. Start via manager once to pin the port. |
| PHP files download instead of executing | The domain/docroot isn't routed through PHP for that path — serve `cpanel/` from a PHP-enabled docroot or run the scripts via cron/CLI (`php cpanel/db-install.php` won't work interactively; use the Neon console instead). |
