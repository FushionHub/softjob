<?php
/**
 * Emporium Capitals — Advanced cPanel Process, Server & Cron Manager
 *
 * Provides a secure web control suite for cPanel shared hosting:
 * - Real-time Node.js process monitoring (PID, Port, Socket, Uptime, Memory)
 * - Safe Process Controls: Start, Stop, Restart, and Clear Logs
 * - Dynamic cPanel Cron Job Command Generator (exact paths tailored to server)
 * - Node.js Binary & Environment Discovery across cPanel paths
 * - Database Connectivity Diagnostics (MySQL / MariaDB & PostgreSQL)
 * - Live Log Viewer for server.log, keepalive.log, and error_log
 * - Build status verification (.next/BUILD_ID)
 */

session_start();

define('DEFAULT_MANAGER_TOKEN', 'change-me-to-a-secure-token');
$appRoot = dirname(__DIR__);

// Load token from .env if available
$configuredToken = DEFAULT_MANAGER_TOKEN;
$databaseUrl = '';
if (file_exists($appRoot . '/.env')) {
    $envContent = file_get_contents($appRoot . '/.env');
    if (preg_match('/^CPANEL_MANAGER_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $matches)) {
        $configuredToken = trim($matches[1]);
    }
    if (preg_match('/^DATABASE_URL\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $matches)) {
        $databaseUrl = trim($matches[1]);
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
$errorLog = __DIR__ . '/error_log';

/**
 * Locate best available Node binary on the host
 */
function resolveNodeBinary($appRoot) {
    $candidates = array(
        'node',
        '/usr/local/bin/node',
        '/usr/bin/node',
        '/opt/cpanel/ea-nodejs20/bin/node',
        '/opt/cpanel/ea-nodejs18/bin/node',
        '/opt/cpanel/ea-nodejs22/bin/node',
        '/opt/cpanel/ea-nodejs16/bin/node',
        getenv('HOME') . '/nodevenv/' . basename($appRoot) . '/20/bin/node',
        getenv('HOME') . '/nodevenv/' . basename($appRoot) . '/18/bin/node',
        getenv('HOME') . '/nodevenv/' . basename($appRoot) . '/22/bin/node',
    );

    $nvmNodes = glob(getenv('HOME') . '/.nvm/versions/node/v*/bin/node');
    if ($nvmNodes && is_array($nvmNodes)) {
        $candidates = array_merge($candidates, $nvmNodes);
    }

    foreach ($candidates as $bin) {
        if (@is_executable($bin)) {
            return $bin;
        }
    }
    return 'node';
}

function isPidRunning($pid) {
    if (empty($pid) || !is_numeric($pid)) return false;
    if (function_exists('posix_kill')) {
        return posix_kill($pid, 0);
    }
    return file_exists("/proc/$pid");
}

function checkPortListening($port = 3000) {
    $fp = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.3);
    if ($fp) {
        fclose($fp);
        return true;
    }
    return false;
}

// Process state
$pidData = file_exists($pidFile) ? @json_decode(file_get_contents($pidFile), true) : null;
$activePid = $pidData['pid'] ?? null;
$activePort = $pidData['port'] ?? 3000;
$activeSocket = $pidData['path'] ?? null;
$nodeBinary = resolveNodeBinary($appRoot);

$isRunning = false;
if ($activePid && isPidRunning($activePid)) {
    $isRunning = true;
} elseif (checkPortListening($activePort)) {
    $isRunning = true;
}

// Handle actions
$actionMessage = null;
$actionError = null;

if ($isAuthenticated && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $action = $_POST['action'];

    if ($action === 'start') {
        if ($isRunning) {
            $actionMessage = "Application is already running (PID: {$activePid}).";
        } else {
            $nodeCmd = resolveNodeBinary($appRoot);
            $cmd = "cd " . escapeshellarg($appRoot) . " && PORT={$activePort} NODE_ENV=production nohup {$nodeCmd} server.js >> " . escapeshellarg($logFile) . " 2>&1 & echo $!";
            $newPid = null;
            if (function_exists('exec')) {
                $out = array();
                @exec($cmd, $out);
                $newPid = !empty($out[0]) ? (int)$out[0] : null;
            } elseif (function_exists('shell_exec')) {
                $newPid = (int)trim(@shell_exec($cmd));
            }

            sleep(1);
            if ($newPid) {
                @file_put_contents($pidFile, json_encode(array(
                    'pid' => $newPid,
                    'port' => $activePort,
                    'startedAt' => date('c')
                )));
                $activePid = $newPid;
            }
            $actionMessage = "Start signal dispatched with binary '{$nodeCmd}'.";
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

        $nodeCmd = resolveNodeBinary($appRoot);
        $cmd = "cd " . escapeshellarg($appRoot) . " && PORT={$activePort} NODE_ENV=production nohup {$nodeCmd} server.js >> " . escapeshellarg($logFile) . " 2>&1 & echo $!";
        $newPid = null;
        if (function_exists('exec')) {
            $out = array();
            @exec($cmd, $out);
            $newPid = !empty($out[0]) ? (int)$out[0] : null;
        } elseif (function_exists('shell_exec')) {
            $newPid = (int)trim(@shell_exec($cmd));
        }

        sleep(1);
        if ($newPid) {
            @file_put_contents($pidFile, json_encode(array(
                'pid' => $newPid,
                'port' => $activePort,
                'startedAt' => date('c')
            )));
            $activePid = $newPid;
        }
        $actionMessage = "Restart sequence completed with binary '{$nodeCmd}'.";
        $isRunning = checkPortListening($activePort) || ($newPid && isPidRunning($newPid));
    } elseif ($action === 'clear_logs') {
        @file_put_contents($logFile, "[Logs cleared on " . gmdate('Y-m-d H:i:s') . " UTC]\n");
        $actionMessage = "Server log file cleared.";
    }
}

// Build status
$buildExists = file_exists($appRoot . '/.next/BUILD_ID');
$buildTime = $buildExists ? date('Y-m-d H:i:s', filemtime($appRoot . '/.next/BUILD_ID')) : 'Missing';

// Database ping test
$dbStatus = 'Not configured';
$dbIsOk = false;
if (!empty($databaseUrl)) {
    if (strpos($databaseUrl, 'mysql://') === 0 || strpos($databaseUrl, 'mysql2://') === 0) {
        $p = parse_url($databaseUrl);
        $mHost = $p['host'] ?? '127.0.0.1';
        $mPort = $p['port'] ?? 3306;
        $mDb   = ltrim($p['path'] ?? '', '/');
        $mUser = isset($p['user']) ? rawurldecode($p['user']) : '';
        $mPass = isset($p['pass']) ? rawurldecode($p['pass']) : '';
        if (extension_loaded('pdo_mysql')) {
            try {
                $mPdo = new PDO("mysql:host={$mHost};port={$mPort};dbname={$mDb}", $mUser, $mPass, array(PDO::ATTR_TIMEOUT => 3));
                $dbStatus = "Connected (MySQL: {$mDb})";
                $dbIsOk = true;
            } catch (Exception $e) {
                $dbStatus = "Failed: " . $e->getMessage();
            }
        } else {
            $dbStatus = "Configured (MySQL), pdo_mysql extension missing";
        }
    } elseif (strpos($databaseUrl, 'postgres://') === 0 || strpos($databaseUrl, 'postgresql://') === 0) {
        $p = parse_url($databaseUrl);
        $pHost = $p['host'] ?? '127.0.0.1';
        $pPort = $p['port'] ?? 5432;
        $pDb   = ltrim($p['path'] ?? '', '/');
        $pUser = isset($p['user']) ? rawurldecode($p['user']) : '';
        $pPass = isset($p['pass']) ? rawurldecode($p['pass']) : '';
        if (extension_loaded('pdo_pgsql')) {
            try {
                $pPdo = new PDO("pgsql:host={$pHost};port={$pPort};dbname={$pDb};sslmode=require", $pUser, $pPass, array(PDO::ATTR_TIMEOUT => 3));
                $dbStatus = "Connected (PostgreSQL Neon)";
                $dbIsOk = true;
            } catch (Exception $e) {
                $dbStatus = "Failed: " . $e->getMessage();
            }
        } else {
            $dbStatus = "Configured (Postgres), pdo_pgsql extension missing";
        }
    }
}

// Log selection
$logType = $_GET['log'] ?? 'server';
$currentLogFile = $logFile;
if ($logType === 'keepalive') $currentLogFile = $keepaliveLog;
if ($logType === 'error') $currentLogFile = $errorLog;

$logContent = "Log file is empty or does not exist yet.";
if (file_exists($currentLogFile)) {
    $lines = @file($currentLogFile);
    if ($lines) {
        $logContent = implode('', array_slice($lines, -80));
    }
}

// PHP binary for cron command
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
    <title>Emporium Capitals — cPanel Server Manager</title>
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
            padding: 32px 16px;
            min-height: 100vh;
        }
        .container { max-width: 980px; margin: 0 auto; }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border);
        }
        .title { font-size: 22px; font-weight: 700; }
        .title span { color: var(--accent); }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .stat-label { font-size: 13px; color: var(--text-dim); margin-bottom: 8px; }
        .stat-value { font-size: 17px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 9999px;
            text-transform: uppercase;
        }
        .badge.online  { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid var(--success); }
        .badge.offline { background: rgba(239, 77, 69, 0.15); color: var(--accent); border: 1px solid var(--accent); }
        .badge.neutral { background: rgba(255, 255, 255, 0.1); color: var(--text-dim); border: 1px solid var(--border); }
        .btn-group { display: flex; flex-wrap: wrap; gap: 10px; }
        .btn {
            padding: 10px 18px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .btn-start   { background: var(--success); color: #fff; }
        .btn-stop    { background: var(--accent); color: #fff; }
        .btn-restart { background: #3b82f6; color: #fff; }
        .btn-clear   { background: rgba(255,255,255,0.08); color: var(--text); }
        .btn-link    { background: rgba(255,255,255,0.05); color: var(--text); border: 1px solid var(--border); }
        .alert {
            padding: 14px 18px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .alert-info { background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; color: #93c5fd; }
        .code-box {
            background: #04050d;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 14px;
            font-family: monospace;
            font-size: 13px;
            color: #38bdf8;
            word-break: break-all;
            margin-top: 8px;
            user-select: all;
        }
        pre.log-viewer {
            background: #04050d;
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 16px;
            font-family: monospace;
            font-size: 12px;
            color: #a5b4fc;
            max-height: 380px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
            line-height: 1.5;
        }
        .log-nav { display: flex; gap: 8px; margin-bottom: 12px; }
        .log-nav a {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-decoration: none;
            color: var(--text-dim);
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border);
        }
        .log-nav a.active {
            color: #fff;
            background: var(--accent);
            border-color: var(--accent);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">Emporium<span>Capitals</span> &mdash; cPanel Manager</div>
            <div style="display: flex; gap: 8px;">
                <a href="setup-check.php?token=<?= htmlspecialchars($providedToken) ?>" class="btn btn-link">Pre-Flight Check</a>
                <a href="db-install.php?token=<?= htmlspecialchars($providedToken) ?>" class="btn btn-link">DB Installer</a>
                <a href="health.php" target="_blank" class="btn btn-link">Health JSON</a>
            </div>
        </div>

        <?php if (!$isAuthenticated): ?>
            <div class="card" style="text-align: center; padding: 40px;">
                <h3 style="margin-bottom: 12px; color: var(--accent);">Authentication Required</h3>
                <p style="color: var(--text-dim); font-size: 14px; margin-bottom: 20px;">
                    Set <code>CPANEL_MANAGER_TOKEN</code> in your <code>.env</code> file, then authenticate below:
                </p>
                <form method="GET" style="max-width: 400px; margin: 0 auto; display: flex; gap: 8px;">
                    <input type="password" name="token" placeholder="Enter manager token" style="flex:1; padding:10px 14px; background:#060714; border:1px solid var(--border); border-radius:8px; color:#fff;" required>
                    <button type="submit" class="btn btn-start">Unlock</button>
                </form>
            </div>
            <?php exit; ?>
        <?php endif; ?>

        <?php if ($actionMessage): ?>
            <div class="alert alert-info"><?= htmlspecialchars($actionMessage) ?></div>
        <?php endif; ?>

        <!-- Stat Cards -->
        <div class="grid">
            <div class="card">
                <div class="stat-label">Node.js Process</div>
                <div class="stat-value">
                    <span class="badge <?= $isRunning ? 'online' : 'offline' ?>">
                        <?= $isRunning ? 'Online' : 'Stopped' ?>
                    </span>
                    <?php if ($activePid): ?>
                        <span style="font-size: 13px; color: var(--text-dim);">PID: <?= $activePid ?></span>
                    <?php endif; ?>
                </div>
            </div>
            <div class="card">
                <div class="stat-label">Target Port / Mode</div>
                <div class="stat-value">
                    <span><?= htmlspecialchars($activeSocket ?: "Port {$activePort}") ?></span>
                </div>
            </div>
            <div class="card">
                <div class="stat-label">Next.js Production Build</div>
                <div class="stat-value">
                    <span class="badge <?= $buildExists ? 'online' : 'offline' ?>">
                        <?= $buildExists ? 'Compiled' : 'Missing' ?>
                    </span>
                    <span style="font-size: 12px; color: var(--text-dim);"><?= $buildTime ?></span>
                </div>
            </div>
            <div class="card">
                <div class="stat-label">Database Connection</div>
                <div class="stat-value">
                    <span class="badge <?= $dbIsOk ? 'online' : 'neutral' ?>">
                        <?= $dbIsOk ? 'Connected' : 'Check Env' ?>
                    </span>
                    <span style="font-size: 12px; color: var(--text-dim);"><?= htmlspecialchars($dbStatus) ?></span>
                </div>
            </div>
        </div>

        <!-- Action Controls -->
        <div class="card">
            <h3 style="font-size: 15px; margin-bottom: 14px;">Process Controls</h3>
            <form method="POST" class="btn-group">
                <input type="hidden" name="token" value="<?= htmlspecialchars($providedToken) ?>">
                <?php if (!$isRunning): ?>
                    <button type="submit" name="action" value="start" class="btn btn-start">Start Application</button>
                <?php else: ?>
                    <button type="submit" name="action" value="restart" class="btn btn-restart">Restart Application</button>
                    <button type="submit" name="action" value="stop" class="btn btn-stop" onclick="return confirm('Stop internal Node.js process?')">Stop Application</button>
                <?php endif; ?>
                <button type="submit" name="action" value="clear_logs" class="btn btn-clear">Clear Server Log</button>
            </form>
        </div>

        <!-- Cron Configuration -->
        <div class="card">
            <h3 style="font-size: 15px; margin-bottom: 6px;">Recommended cPanel Cron Job</h3>
            <p style="font-size: 13px; color: var(--text-dim);">
                In <strong>cPanel &rarr; Cron Jobs</strong>, add the following cron command (every 10 minutes) to keep the app warm and process background trades:
            </p>
            <div class="code-box"><?= htmlspecialchars($cronCommand) ?></div>
        </div>

        <!-- Live Logs -->
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <h3 style="font-size: 15px;">Application Logs (Last 80 lines)</h3>
                <div class="log-nav">
                    <a href="?token=<?= htmlspecialchars($providedToken) ?>&log=server" class="<?= $logType === 'server' ? 'active' : '' ?>">server.log</a>
                    <a href="?token=<?= htmlspecialchars($providedToken) ?>&log=keepalive" class="<?= $logType === 'keepalive' ? 'active' : '' ?>">keepalive.log</a>
                    <a href="?token=<?= htmlspecialchars($providedToken) ?>&log=error" class="<?= $logType === 'error' ? 'active' : '' ?>">error_log</a>
                </div>
            </div>
            <pre class="log-viewer"><?= htmlspecialchars($logContent) ?></pre>
        </div>

        <div style="text-align: center; color: var(--text-dim); font-size: 12px; margin-top: 16px;">
            Node Binary Detected: <code><?= htmlspecialchars($nodeBinary) ?></code> &bull; PHP Version: <?= PHP_VERSION ?>
        </div>
    </div>
</body>
</html>
