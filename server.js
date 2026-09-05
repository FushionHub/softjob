/**
 * Emporium Capitals — production startup wrapper for cPanel shared hosting.
 *
 * NEW FILE. No existing project code is modified.
 *
 * Purpose:
 *   cPanel's "Setup Node.js App" (CloudLinux/Passenger) needs a single
 *   JavaScript startup file. Point "Application startup file" to `server.js`.
 *   Passenger injects the port or socket via the PORT environment variable;
 *   this file prepares the built Next.js app (`.next/`) and serves it.
 *   It can also be started standalone or managed via PHP process manager.
 */

const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');
const next = require('next');

const dir = __dirname;

// Fail fast with a helpful message if the production build is missing.
const buildIdPath = path.join(dir, '.next', 'BUILD_ID');
if (!fs.existsSync(buildIdPath)) {
  console.error(
    '[server.js] Production build not found (.next/BUILD_ID missing).\n' +
      'Run `npm run build` in the application root, ' +
      'then restart the Node.js app. See cpanel/DEPLOY.md.'
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
  // Unix domain socket or named pipe from Passenger
  listenTarget = { path: rawPort };
}

const app = next({ dev: false, dir });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      // Lightweight internal ping for PHP reverse-proxy / watchdog checks
      if (req.url === '/_cpanel_ping') {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        });
        res.end(
          JSON.stringify({
            status: 'ok',
            uptime: process.uptime(),
            pid: process.pid,
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
    };
    fs.writeFileSync(path.join(dir, '.cpanel_node.pid'), JSON.stringify(pidInfo, null, 2));
  } catch (e) {
    // Non-critical, ignore if read-only
  }
}

// Clean exit on termination
function cleanup() {
  try {
    const pidFile = path.join(dir, '.cpanel_node.pid');
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
  } catch (e) {}
  process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
