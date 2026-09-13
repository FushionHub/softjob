/**
 * Emporium Capitals — Production Startup Wrapper for cPanel Shared Hosting
 *
 * Compatible with:
 * 1. PM2 Process Manager (ecosystem.config.js)
 * 2. CloudLinux Passenger ("Setup Node.js App" in cPanel)
 * 3. Standalone Node.js execution via Terminal or Cron
 */

const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');
const next = require('next');

const dir = __dirname;
const pidFilePath = path.join(dir, '.cpanel_node.pid');

// Fail fast with a clear, actionable diagnostic message if the production build is missing.
const buildIdPath = path.join(dir, '.next', 'BUILD_ID');
if (!fs.existsSync(buildIdPath)) {
  console.error(
    '[server.js] Production build not found (.next/BUILD_ID missing).\n' +
      'Please run `npm run build` in your cPanel Terminal or upload the local `.next` build folder.\n' +
      'See cpanel/DEPLOY.md for step-by-step instructions.'
  );
  process.exit(1);
}

// Support numeric ports, hostnames, and Passenger Unix domain socket paths
const rawPort = process.env.PORT;
const host = process.env.HOST || '127.0.0.1';

let listenTarget;
if (!rawPort) {
  listenTarget = { port: 3000, host };
} else if (!isNaN(Number(rawPort))) {
  listenTarget = { port: parseInt(rawPort, 10), host };
} else {
  // Unix domain socket or named pipe injected by CloudLinux Passenger
  listenTarget = { path: rawPort };
}

const app = next({ dev: false, dir });
const handle = app.getRequestHandler();

// Capture uncaught exceptions to ensure diagnostics are recorded in cpanel/server.log
process.on('uncaughtException', (err) => {
  console.error('[server.js] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[server.js] Unhandled Rejection:', reason);
});

app
  .prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      // Lightweight internal diagnostic ping for PHP reverse-proxy & cron watchdog checks
      if (req.url === '/_cpanel_ping') {
        const mem = process.memoryUsage();
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        });
        res.end(
          JSON.stringify({
            status: 'ok',
            uptime: Math.round(process.uptime()),
            pid: process.pid,
            nodeVersion: process.version,
            platform: process.platform,
            port: listenTarget.port || null,
            socket: listenTarget.path || null,
            memory: {
              rssMb: Math.round(mem.rss / 1024 / 1024),
              heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
              heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
            },
            timestamp: Date.now(),
          })
        );
        return;
      }

      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('[server.js] Request handler error:', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
        res.end('Internal Server Error');
      }
    });

    // Handle port collision gracefully with clear instruction for shared hosting users
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `[server.js] Port ${listenTarget.port || listenTarget.path} is already in use by another process.\n` +
            'On cPanel shared hosting, change PORT in your .env or cPanel Node.js App settings (e.g. PORT=3001).'
        );
      } else {
        console.error('[server.js] Server error:', err);
      }
      process.exit(1);
    });

    if (listenTarget.path) {
      server.listen(listenTarget.path, () => {
        console.log(`[server.js] Ready on socket ${listenTarget.path} (PID: ${process.pid})`);
        writePidFile();
      });
    } else {
      server.listen(listenTarget.port, listenTarget.host, () => {
        console.log(`[server.js] Ready on http://${listenTarget.host}:${listenTarget.port} (PID: ${process.pid})`);
        writePidFile();
      });
    }
  })
  .catch((err) => {
    console.error('[server.js] Next.js prepare() failed:', err);
    process.exit(1);
  });

function writePidFile() {
  try {
    const pidInfo = {
      pid: process.pid,
      port: listenTarget.port || null,
      path: listenTarget.path || null,
      host: listenTarget.host || null,
      startedAt: new Date().toISOString(),
      nodeVersion: process.version,
    };
    fs.writeFileSync(pidFilePath, JSON.stringify(pidInfo, null, 2));
  } catch (e) {
    // Non-critical if filesystem permissions are restricted
  }
}

function cleanup() {
  try {
    if (fs.existsSync(pidFilePath)) {
      fs.unlinkSync(pidFilePath);
    }
  } catch (e) {}
  process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGHUP', cleanup);
