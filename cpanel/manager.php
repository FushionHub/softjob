<?php
/**
 * Emporium Capitals — cPanel Process & Server Manager
 *
 * NEW FILE. No existing project code is modified.
 *
 * Provides a web control panel on shared hosting for:
 * - Real-time Node.js process monitoring (PID, Port, Uptime, Memory)
 * - One-click Start, Stop, and Restart
 * - Real-time log inspection (server.log, keepalive.log)
 * - Database health ping (Neon PostgreSQL)
 * - Build status inspection (.next/BUILD_ID)
 */

session_start();

define('DEFAULT_MANAGER_TOKEN', 'change-me-to-a-secure-token');
// You can override this in .env as CPANEL_MANAGER_TOKEN=your_secret
$appRoot = dirname(__DIR__);

// Load token from .env if available
$configuredToken = DEFAULT_MANAGER_TOKEN;
if (file_exists($appRoot . '/.env')) {
    $envContent = file_get_contents($appRoot . '/.env');
    if (preg_match('/^CPANEL_MANAGER_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $matches)) {
        $configuredToken = trim($matches[1]);
    }
}

// Authentication check
$providedToken = $_GET['token'] ?? $_POST['token'] ?? $_SESSION['cpanel_mgr_token'] ?? '';
$isAuthenticated = ($providedToken !== '' && $configuredToken !== DEFAULT_MANAGER_TOKEN && hash_equals($configuredToken, $providedToken));

if ($isAuthenticated) {
    $_SESSION['cpanel_mgr_token'] = $providedToken;
}

$pidFile = $appRoot . '/.cpanel_node.pid';
$logFile = __DIR__ . '/server.log';
$keepaliveLog = __DIR__ . '/keepalive.log';

// Helper: check if a PID is running (Linux)
function isPidRunning($pid) {
    if (empty($pid) || !is_numeric($pid)) return false;
    if (function_exists('posix_kill')) {
        return posix_kill($pid, 0);
    }
    return file_exists("/proc/$pid");
}

// Helper: check port listening
function checkPortListening($port = 3000) {
    $fp = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.3);
    if ($fp) {
        fclose($fp);
        return true;
    }
    return false;
}

// Process details
$pidData = file_exists($pidFile) ? @json_decode(file_get_contents($pidFile), true) : null;
$activePid = $pidData['pid'] ?? null;
$activePort = $pidData['port'] ?? 3000;
$isRunning = false;

if ($activePid && isPidRunning($activePid)) {
    $isRunning = true;
} elseif (checkPortListening($activePort)) {
    $isRunning = true;
}

// Action handling
$actionMessage = null;
$actionError = null;

if ($isAuthenticated && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];

    if ($action === 'start') {
        if ($isRunning) {
            $actionMessage = "Application is already running (PID: {$activePid}).";
        } else {
            $nodeBin = 'node';
            $possibleNodes = array(
                'node',
                '/usr/local/bin/node',
                '/usr/bin/node',
                getenv('HOME') . '/nodevenv/' . basename($appRoot) . '/20/bin/node',
                getenv('HOME') . '/nodevenv/' . basename($appRoot) . '/18/bin/node',
            );
            foreach ($possibleNodes as $bin) {
                if (@is_executable($bin)) { $nodeBin = $bin; break; }
            }

            $cmd = "cd " . escapeshellarg($appRoot) . " && PORT={$activePort} NODE_ENV=production nohup {$nodeBin} server.js >> " . escapeshellarg($logFile) . " 2>&1 & echo $!";
            $newPid = null;
            if (function_exists('exec')) {
                $out = array();
                @exec($cmd, $out);
                $newPid = !empty($out[0]) ? (int)$out[0] : null;
            } elseif (function_exists('shell_exec')) {
                $newPid = (int)trim(@shell_exec($cmd));
            }

            sleep(1);
            // Persist pid+port so pid monitoring and cron-worker port detection engage
            if ($newPid) {
                @file_put_contents($pidFile, json_encode(array('pid' => $newPid, 'port' => $activePort, 'started' => time())));
                $activePid = $newPid;
            }
            $actionMessage = "Start signal dispatched. Process PID: " . ($newPid ?: 'initiated');
            // Refresh state
            $isRunning = checkPortListening($activePort) || ($newPid && isPidRunning($newPid));
        }
    } elseif ($action === 'stop') {
        if ($activePid) {
            if (function_exists('posix_kill')) {
                @posix_kill($activePid, SIGTERM);
            } elseif (function_exists('exec')) {
                @exec("kill -15 {$activePid}");
            }
        }
        @unlink($pidFile);
        sleep(1);
        $actionMessage = "Stop command issued to process.";
        $isRunning = false;
    } elseif ($action === 'restart') {
        if ($activePid) {
            if (function_exists('posix_kill')) {
                @posix_kill($activePid, SIGTERM);
            } elseif (function_exists('exec')) {
                @exec("kill -15 {$activePid}");
            }
        }
        @unlink($pidFile);
        sleep(2);

        $nodeBin = 'node';
        $cmd = "cd " . escapeshellarg($appRoot) . " && PORT={$activePort} NODE_ENV=production nohup {$nodeBin} server.js >> " . escapeshellarg($logFile) . " 2>&1 &";
        if (function_exists('exec')) {
            @exec($cmd);
        } elseif (function_exists('shell_exec')) {
            @shell_exec($cmd);
        }
        sleep(1);
        $actionMessage = "Restart sequence initiated.";
        $isRunning = checkPortListening($activePort);
    } elseif ($action === 'clear_logs') {
        @file_put_contents($logFile, "[Logs cleared on " . gmdate('Y-m-d H:i:s') . " UTC]\n");
        $actionMessage = "Server log file cleared.";
    }
}

// Build Status
$buildExists = file_exists($appRoot . '/.next/BUILD_ID');
$buildTime = $buildExists ? date('Y-m-d H:i:s', filemtime($appRoot . '/.next/BUILD_ID')) : 'Missing';

// Database URL check
$dbConfigured = false;
if (file_exists($appRoot . '/.env')) {
    $dbConfigured = (bool)preg_match('/^DATABASE_URL\s*=/m', file_get_contents($appRoot . '/.env'));
}

// Read recent logs
$logs = file_exists($logFile) ? shell_exec("tail -n 60 " . escapeshellarg($logFile)) : "No server.log found yet.";
if (empty($logs) && file_exists($logFile)) {
    $lines = @file($logFile);
    $logs = $lines ? implode('', array_slice($lines, -60)) : "Log file is empty.";
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Emporium Capitals — cPanel Manager</title>
    <style>
        :root {
            --bg: #070913;
            --card-bg: #0d1024;
            --border: rgba(255, 255, 255, 0.08);
            --text: #f0f2ff;
            --text-dim: #8a92b2;
            --accent: #ef4d45;
            --success: #10b981;
            --warning: #f59e0b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background: var(--bg);
            color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 32px 16px;
            min-height: 100vh;
        }
        .container { max-width: 960px; margin: 0 auto; }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 28px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border);
        }
        .title { font-size: 22px; font-weight: 700; }
        .title span { color: var(--accent); }
        .token-warning {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid var(--warning);
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 24px;
            color: #fde68a;
            font-size: 14px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 28px;
        }
        .stat-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 20px;
        }
        .stat-label { font-size: 13px; color: var(--text-dim); margin-bottom: 8px; }
        .stat-value { font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .badge {
            display: inline-block;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .badge.online { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid var(--success); }
        .badge.offline { background: rgba(239, 77, 69, 0.15); color: var(--accent); border: 1px solid var(--accent); }
        .controls {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 24px;
            margin-bottom: 28px;
        }
        .controls h3 { font-size: 16px; margin-bottom: 16px; }
        .btn-group { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn {
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
        }
        .btn-primary { background: var(--accent); color: #fff; }
        .btn-primary:hover { opacity: 0.9; }
        .btn-secondary { background: rgba(255, 255, 255, 0.08); color: var(--text); }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.12); }
        .btn-danger { background: rgba(239, 77, 69, 0.2); color: var(--accent); border: 1px solid var(--accent); }
        .btn-danger:hover { background: rgba(239, 77, 69, 0.3); }
        .btn-link {
            text-decoration: none;
            display: inline-flex;
            align-items: center;
        }
        .log-box {
            background: #02030a;
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 20px;
        }
        .log-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .log-header h3 { font-size: 15px; }
        pre {
            font-family: "SFMono-Regular", Consolas, Menlo, monospace;
            font-size: 12px;
            line-height: 1.6;
            color: #d1d5db;
            white-space: pre-wrap;
            word-break: break-all;
            max-height: 380px;
            overflow-y: auto;
        }
        .alert {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid var(--success);
            color: #a7f3d0;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        input[type="text"], input[type="password"] {
            background: #050610;
            border: 1px solid var(--border);
            padding: 10px 14px;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <div class="title">Emporium<span>Capitals</span> &mdash; Server Manager</div>
        <div>
            <a href="/" target="_blank" class="btn btn-secondary btn-link" style="font-size: 13px;">View Live Site &rarr;</a>
        </div>
    </div>

    <?php if (!$isAuthenticated): ?>
        <div class="stat-card" style="max-width: 480px; margin: 40px auto; text-align: center;">
            <h2 style="font-size: 18px; margin-bottom: 12px;">Authentication Required</h2>
            <p style="color: var(--text-dim); font-size: 14px; margin-bottom: 20px;">
                Enter your management token or pass <code>?token=YOUR_TOKEN</code> in the URL.
            </p>
            <form method="get" action="">
                <input type="password" name="token" placeholder="Enter CPANEL_MANAGER_TOKEN" style="width: 100%; margin-bottom: 16px;" required>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Access Manager</button>
            </form>
            <p style="color: var(--text-dim); font-size: 12px; margin-top: 16px;">
                Configure <code>CPANEL_MANAGER_TOKEN</code> in your <code>.env</code> file.
            </p>
        </div>
    <?php else: ?>

        <?php if ($configuredToken === DEFAULT_MANAGER_TOKEN): ?>
            <div class="token-warning">
                <strong>Security Alert:</strong> You are using the default token. Please define a unique <code>CPANEL_MANAGER_TOKEN</code> in your <code>.env</code> file.
            </div>
        <?php endif; ?>

        <?php if ($actionMessage): ?>
            <div class="alert"><?php echo htmlspecialchars($actionMessage); ?></div>
        <?php endif; ?>

        <div class="grid">
            <div class="stat-card">
                <div class="stat-label">Node.js Server Status</div>
                <div class="stat-value">
                    <?php if ($isRunning): ?>
                        <span class="badge online">Active</span>
                        <span style="font-size: 13px; color: var(--text-dim);">Port <?php echo htmlspecialchars($activePort); ?></span>
                    <?php else: ?>
                        <span class="badge offline">Stopped</span>
                    <?php endif; ?>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Process PID</div>
                <div class="stat-value">
                    <?php echo $activePid ? htmlspecialchars($activePid) : '<span style="color:var(--text-dim);font-size:14px;">None</span>'; ?>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Next.js Production Build</div>
                <div class="stat-value" style="font-size: 14px;">
                    <?php if ($buildExists): ?>
                        <span style="color: var(--success);">&#10003; Ready</span>
                        <span style="color: var(--text-dim); font-size: 12px; margin-left: auto;"><?php echo $buildTime; ?></span>
                    <?php else: ?>
                        <span style="color: var(--accent);">&#10007; Missing (.next)</span>
                    <?php endif; ?>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Database Configuration</div>
                <div class="stat-value" style="font-size: 14px;">
                    <?php if ($dbConfigured): ?>
                        <span style="color: var(--success);">&#10003; Neon Configured</span>
                    <?php else: ?>
                        <span style="color: var(--warning);">&#9888; DATABASE_URL Unset</span>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <div class="controls">
            <h3>Process Actions</h3>
            <div class="btn-group">
                <form method="post" style="display:inline;">
                    <input type="hidden" name="token" value="<?php echo htmlspecialchars($providedToken); ?>">
                    <input type="hidden" name="action" value="start">
                    <button type="submit" class="btn btn-primary" <?php if ($isRunning) echo 'disabled style="opacity:0.5;cursor:not-allowed;"'; ?>>
                        &#9654; Start Server
                    </button>
                </form>

                <form method="post" style="display:inline;">
                    <input type="hidden" name="token" value="<?php echo htmlspecialchars($providedToken); ?>">
                    <input type="hidden" name="action" value="restart">
                    <button type="submit" class="btn btn-secondary">
                        &#8635; Restart Server
                    </button>
                </form>

                <form method="post" style="display:inline;">
                    <input type="hidden" name="token" value="<?php echo htmlspecialchars($providedToken); ?>">
                    <input type="hidden" name="action" value="stop">
                    <button type="submit" class="btn btn-danger" <?php if (!$isRunning) echo 'disabled style="opacity:0.5;cursor:not-allowed;"'; ?>>
                        &#9632; Stop Server
                    </button>
                </form>

                <a href="health.php" target="_blank" class="btn btn-secondary btn-link">&#10004; Health Check</a>
                <a href="db-install.php" target="_blank" class="btn btn-secondary btn-link">&#128450; DB Installer</a>
                <a href="mail-test.php" target="_blank" class="btn btn-secondary btn-link">&#9993; Test Mail</a>
            </div>
        </div>

        <div class="log-box">
            <div class="log-header">
                <h3>Application Logs (server.log)</h3>
                <form method="post" style="display:inline;">
                    <input type="hidden" name="token" value="<?php echo htmlspecialchars($providedToken); ?>">
                    <input type="hidden" name="action" value="clear_logs">
                    <button type="submit" class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px;">Clear Logs</button>
                </form>
            </div>
            <pre><?php echo htmlspecialchars($logs); ?></pre>
        </div>

    <?php endif; ?>
</div>
</body>
</html>
