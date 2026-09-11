<?php
/**
 * Emporium Capitals — cPanel Setup & Administration Suite Hub
 *
 * Startup file for the cPanel deployment and management tools.
 * Serves as the central launchpad for database setup, pre-flight checks,
 * PM2 server management, and cron configuration.
 *
 * Usage:
 *   Visit https://yourdomain.com/cpanelsetup/?token=YOUR_TOKEN
 */

session_start();

$appRoot = dirname(__DIR__);

define('DEFAULT_TOKEN', 'b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5');
$configuredToken = DEFAULT_TOKEN;

// Load token from .env if present
$databaseConfigured = false;
if (file_exists($appRoot . '/.env')) {
    $envContent = file_get_contents($appRoot . '/.env');
    if (preg_match('/^CPANEL_SETUP_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $m)) {
        $configuredToken = trim($m[1]);
    } elseif (preg_match('/^CPANEL_MANAGER_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $m)) {
        $configuredToken = trim($m[1]);
    }
    if (preg_match('/^DATABASE_URL\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $m)) {
        $databaseConfigured = true;
    }
}

// Authentication
$providedToken = $_GET['token'] ?? $_POST['token'] ?? $_SESSION['cpanelsetup_token'] ?? '';
$isAuthenticated = ($providedToken !== '' && hash_equals($configuredToken, $providedToken));

if ($isAuthenticated) {
    $_SESSION['cpanelsetup_token'] = $providedToken;
}
$activeToken = $providedToken ?: $configuredToken;

// System checks at a glance
$nodePort = 3000;
if (file_exists($appRoot . '/.env') && preg_match('/^PORT\s*=\s*(\d+)/m', file_get_contents($appRoot . '/.env'), $pm)) {
    $nodePort = (int)$pm[1];
}

$portOpen = false;
$fp = @fsockopen('127.0.0.1', $nodePort, $errno, $errstr, 0.2);
if ($fp) {
    fclose($fp);
    $portOpen = true;
}

$buildExists = file_exists($appRoot . '/.next/BUILD_ID');
$ecosystemExists = file_exists($appRoot . '/ecosystem.config.js');
$modulesExists = is_dir($appRoot . '/node_modules');

// Current PHP & Server path info
$phpBin = PHP_BINDIR . '/php';
if (!@is_executable($phpBin)) {
    $phpBin = 'php';
}
$cronCommand = "*/10 * * * * {$phpBin} " . __DIR__ . "/cron-worker.php >/dev/null 2>&1";

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Emporium Capitals — cPanel Setup & Administration Suite</title>
    <style>
        :root {
            --bg: #060714;
            --card-bg: #0e1026;
            --border: rgba(255, 255, 255, 0.08);
            --accent: #ef4d45;
            --accent-glow: rgba(239, 77, 69, 0.2);
            --success: #10b981;
            --warning: #f59e0b;
            --text: #f0f2ff;
            --text-dim: #8a92b2;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background: var(--bg);
            color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 36px 16px;
            min-height: 100vh;
        }
        .container { max-width: 960px; margin: 0 auto; }
        .header {
            text-align: center;
            margin-bottom: 36px;
        }
        .logo { font-size: 26px; font-weight: 800; margin-bottom: 8px; }
        .logo span { color: var(--accent); }
        .subtitle { color: var(--text-dim); font-size: 14px; }
        .status-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 14px;
            margin-bottom: 32px;
        }
        .stat-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px 20px;
        }
        .stat-label { font-size: 12px; color: var(--text-dim); margin-bottom: 6px; }
        .stat-value { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 9999px;
            text-transform: uppercase;
        }
        .badge.online  { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid var(--success); }
        .badge.offline { background: rgba(239, 77, 69, 0.15); color: var(--accent); border: 1px solid var(--accent); }
        .tools-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 18px;
            margin-bottom: 32px;
        }
        .tool-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: all 0.2s ease;
            text-decoration: none;
            color: inherit;
        }
        .tool-card:hover {
            border-color: var(--accent);
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.4);
        }
        .tool-icon {
            font-size: 24px;
            margin-bottom: 12px;
        }
        .tool-title { font-size: 17px; font-weight: 700; margin-bottom: 6px; color: #fff; }
        .tool-desc { font-size: 13px; color: var(--text-dim); line-height: 1.5; margin-bottom: 16px; }
        .tool-action {
            font-size: 13px;
            font-weight: 600;
            color: var(--accent);
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .panel {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 24px;
            margin-bottom: 24px;
        }
        .panel-title { font-size: 15px; font-weight: 700; margin-bottom: 12px; }
        .code-box {
            background: #04050d;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 14px 16px;
            font-family: monospace;
            font-size: 13px;
            color: #38bdf8;
            word-break: break-all;
            user-select: all;
            margin-bottom: 8px;
        }
        .auth-box {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 40px;
            text-align: center;
            max-width: 480px;
            margin: 40px auto;
        }
        .btn {
            padding: 10px 20px;
            background: var(--accent);
            color: #fff;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
        }
        input[type="password"] {
            width: 100%;
            padding: 12px 14px;
            background: #060714;
            border: 1px solid var(--border);
            border-radius: 8px;
            color: #fff;
            margin-bottom: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Emporium<span>Capitals</span></div>
            <div class="subtitle">cPanel Setup & Administration Suite Hub</div>
        </div>

        <?php if (!$isAuthenticated): ?>
            <div class="auth-box">
                <h2 style="font-size: 19px; margin-bottom: 10px; color: var(--accent);">Access Restricted</h2>
                <p style="color: var(--text-dim); font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
                    Please enter the setup token configured in your <code>.env</code> file (<code>CPANEL_SETUP_TOKEN</code> or <code>CPANEL_MANAGER_TOKEN</code>):
                </p>
                <form method="POST">
                    <input type="password" name="token" placeholder="Enter setup token" required>
                    <button type="submit" class="btn" style="width: 100%;">Unlock Setup Suite</button>
                </form>
            </div>
            <?php exit; ?>
        <?php endif; ?>

        <!-- Quick Status Bar -->
        <div class="status-bar">
            <div class="stat-card">
                <div class="stat-label">Node.js / PM2 App</div>
                <div class="stat-value">
                    <span class="badge <?= $portOpen ? 'online' : 'offline' ?>"><?= $portOpen ? 'Listening' : 'Offline' ?></span>
                    <span style="font-size: 12px; color: var(--text-dim);">Port <?= $nodePort ?></span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-label">PM2 Config</div>
                <div class="stat-value">
                    <span class="badge <?= $ecosystemExists ? 'online' : 'offline' ?>"><?= $ecosystemExists ? 'Ready' : 'Missing' ?></span>
                    <span style="font-size: 12px; color: var(--text-dim);">ecosystem.config.js</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Next.js Production Build</div>
                <div class="stat-value">
                    <span class="badge <?= $buildExists ? 'online' : 'offline' ?>"><?= $buildExists ? 'Compiled' : 'Build Needed' ?></span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Database Configuration</div>
                <div class="stat-value">
                    <span class="badge <?= $databaseConfigured ? 'online' : 'offline' ?>"><?= $databaseConfigured ? 'Configured' : 'Needs Setup' ?></span>
                </div>
            </div>
        </div>

        <!-- Suite Tools -->
        <div class="tools-grid">
            <a href="setup-check.php?token=<?= htmlspecialchars($activeToken) ?>" class="tool-card">
                <div>
                    <div class="tool-icon">🔍</div>
                    <div class="tool-title">Pre-Flight Diagnostic Check</div>
                    <div class="tool-desc">Verify PHP extensions, Node.js installation, folder permissions, and build readiness before going live.</div>
                </div>
                <div class="tool-action">Launch Pre-Flight Check &rarr;</div>
            </a>

            <a href="db-install.php?token=<?= htmlspecialchars($activeToken) ?>" class="tool-card">
                <div>
                    <div class="tool-icon">🗄️</div>
                    <div class="tool-title">Database Installer</div>
                    <div class="tool-desc">1-click browser installer for native cPanel MySQL / MariaDB and Neon PostgreSQL with automatic schema migration.</div>
                </div>
                <div class="tool-action">Launch DB Installer &rarr;</div>
            </a>

            <a href="manager.php?token=<?= htmlspecialchars($activeToken) ?>" class="tool-card">
                <div>
                    <div class="tool-icon">⚡</div>
                    <div class="tool-title">Server & PM2 Manager</div>
                    <div class="tool-desc">Monitor process health, execute live start / restart / stop commands, inspect real-time logs, and test database connectivity.</div>
                </div>
                <div class="tool-action">Open Process Manager &rarr;</div>
            </a>

            <a href="mail-test.php?token=<?= htmlspecialchars($activeToken) ?>" class="tool-card">
                <div>
                    <div class="tool-icon">✉️</div>
                    <div class="tool-title">SMTP Mail Diagnostics</div>
                    <div class="tool-desc">Test email delivery configuration, SMTP ports, TLS handshakes, and verification email templates.</div>
                </div>
                <div class="tool-action">Test Mail Delivery &rarr;</div>
            </a>

            <a href="health.php" target="_blank" class="tool-card">
                <div>
                    <div class="tool-icon">🩺</div>
                    <div class="tool-title">Health API (JSON)</div>
                    <div class="tool-desc">Real-time JSON endpoint for external uptime monitors (UptimeRobot, BetterStack) and health checks.</div>
                </div>
                <div class="tool-action">View JSON Health &rarr;</div>
            </a>

            <a href="DEPLOY.md" target="_blank" class="tool-card">
                <div>
                    <div class="tool-icon">📖</div>
                    <div class="tool-title">Deployment Guide</div>
                    <div class="tool-desc">Read the comprehensive step-by-step PM2 cPanel documentation and developer terminal guide.</div>
                </div>
                <div class="tool-action">Open Guide &rarr;</div>
            </a>
        </div>

        <!-- Terminal Cheat Sheet -->
        <div class="panel">
            <div class="panel-title">Quick Terminal Commands (PM2)</div>
            <div class="code-box">pm2 start ecosystem.config.js &amp;&amp; pm2 save</div>
            <div class="code-box">pm2 status</div>
            <div class="code-box">pm2 logs rico-investimentos</div>
        </div>

        <!-- Cron Helper -->
        <div class="panel">
            <div class="panel-title">Automated Watchdog Cron Command (cPanel &rarr; Cron Jobs, every 10 min)</div>
            <div class="code-box"><?= htmlspecialchars($cronCommand) ?></div>
        </div>

        <div style="text-align: center; color: var(--text-dim); font-size: 12px; margin-top: 24px;">
            Emporium Capitals &bull; cPanel Setup Suite &bull; PHP <?= PHP_VERSION ?>
        </div>
    </div>
</body>
</html>
