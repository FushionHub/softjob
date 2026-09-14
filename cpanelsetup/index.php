<?php
/**
 * Emporium Capitals — cPanel Startup & Health Check Entry Point
 *
 * LiteSpeed / Apache compatible. Place in cpanelsetup/ directory.
 * Works on shared hosting without root access.
 *
 * Usage:
 *   1. Visit https://yourdomain.com/cpanelsetup/index.php (first time setup)
 *   2. Use as a health check / startup verification endpoint
 *   3. Can be called by cron to verify app is running
 *
 * This file does NOT serve the app — the app runs via Node.js on port 3000
 * and is reverse-proxied by .htaccess. This file manages the startup process.
 */

session_start();
$appRoot = dirname(__DIR__);

// Load .env values
$env = [];
if (file_exists($appRoot . '/.env')) {
    $lines = file($appRoot . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') !== false) {
            [$key, $val] = explode('=', $line, 2);
            $env[trim($key)] = trim($val, " \t\n\r\0\x0B\"'");
        }
    }
}

$appUrl = $env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
$appUrl = rtrim($appUrl, '/');

// Security: require token
$setupToken = $env['CPANEL_SETUP_TOKEN'] ?? null;
$token = $_GET['token'] ?? $_POST['token'] ?? $_SESSION['startup_token'] ?? '';

$hasAccess = false;
if ($setupToken && $token && hash_equals($setupToken, $token)) {
    $hasAccess = true;
    $_SESSION['startup_token'] = $token;
}

// CLI access (always allowed)
$isCli = (php_sapi_name() === 'cli');

if (!$isCli && !$hasAccess) {
    http_response_code(403);
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <title>403 — Access Denied</title>
        <style>
            body { background: #060714; color: #fff; font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .card { background: #0e1026; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; }
            h2 { font-size: 20px; margin-bottom: 12px; color: #ef4d45; }
            p { color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6; }
            code { background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 6px; color: #f97316; font-size: 13px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>403 — Access Denied</h2>
            <p>Set <code>CPANEL_SETUP_TOKEN</code> in your <code>.env</code> file and pass <code>?token=YOUR_TOKEN</code> in the URL.</p>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// --- Health Check ---
function checkNodeApp($url) {
    $ch = curl_init($url . '/_cpanel_ping');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 5,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_USERAGENT      => 'EmporiumCapitals-Startup/1.0',
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) return ['status' => 'offline', 'error' => $err];
    if ($code === 200) {
        $json = json_decode($body, true);
        return ['status' => 'online', 'data' => $json];
    }
    return ['status' => 'error', 'http_code' => $code];
}

// --- Port Check ---
function checkPort($port) {
    $fp = @fsockopen('127.0.0.1', $port, $errno, $errstr, 2);
    if ($fp) {
        fclose($fp);
        return true;
    }
    return false;
}

// --- Find Node Binary ---
function findNode() {
    $paths = [
        '/opt/cpanel/ea-nodejs20/bin/node',
        '/opt/cpanel/ea-nodejs18/bin/node',
        exec('which node 2>/dev/null') ?: '',
        getenv('HOME') . '/.nvm/versions/node/v20.' . glob(getenv('HOME') . '/.nvm/versions/node/v20.*/bin/node')[0] ?? '',
    ];
    foreach ($paths as $p) {
        $p = trim($p);
        if ($p && file_exists($p) && is_executable($p)) return $p;
    }
    return 'node';
}

// --- Main Logic ---
$action = $_GET['action'] ?? 'status';
$output = [];

if ($action === 'status' || $action === 'health') {
    $health = checkNodeApp($appUrl);
    $port3000 = checkPort(3000);
    $nodePath = findNode();

    $output['app_url'] = $appUrl;
    $output['port_3000'] = $port3000 ? 'listening' : 'not listening';
    $output['node_binary'] = $nodePath;
    $output['node_version'] = trim(exec("$nodePath --version 2>/dev/null") ?: 'unknown');
    $output['php_version'] = phpversion();
    $output['platform'] = PHP_OS;
    $output['health'] = $health;

    // Check build
    $buildIdPath = $appRoot . '/.next/BUILD_ID';
    $output['build_exists'] = file_exists($buildIdPath);
    if ($output['build_exists']) {
        $output['build_id'] = trim(file_get_contents($buildIdPath));
    }

    // Check .env
    $output['env_loaded'] = count($env) > 0;
    $output['env_keys'] = array_keys($env);

    // Check PM2
    $pm2Status = trim(exec('pm2 jlist 2>/dev/null') ?: '[]');
    $pm2Data = json_decode($pm2Status, true);
    $output['pm2_processes'] = is_array($pm2Data) ? count($pm2Data) : 0;

    // Overall status
    $output['overall'] = ($health['status'] === 'online') ? 'running' : 'offline';
} elseif ($action === 'start') {
    $nodePath = findNode();
    $port = $env['PORT'] ?? 3000;
    $cmd = "cd " . escapeshellarg($appRoot) . " && $nodePath server.js > server.log 2>&1 &";
    exec($cmd, $out, $rc);
    $output['command'] = $cmd;
    $output['exit_code'] = $rc;
    $output['message'] = $rc === 0 ? 'Start command issued. Wait 5 seconds, then check status.' : 'Failed to issue start command.';
} elseif ($action === 'stop') {
    $pids = trim(exec("pgrep -f 'node server.js' 2>/dev/null") ?: '');
    if ($pids) {
        exec("kill $pids 2>/dev/null");
        $output['killed_pids'] = $pids;
        $output['message'] = 'Processes killed.';
    } else {
        $output['message'] = 'No running node processes found.';
    }
} elseif ($action === 'restart') {
    $nodePath = findNode();
    exec("pkill -f 'node server.js' 2>/dev/null", $out1, $rc1);
    sleep(2);
    $port = $env['PORT'] ?? 3000;
    $cmd = "cd " . escapeshellarg($appRoot) . " && $nodePath server.js > server.log 2>&1 &";
    exec($cmd, $out2, $rc2);
    $output['message'] = 'Restart issued. Wait 5 seconds, then check status.';
    $output['exit_code'] = $rc2;
} else {
    $output['error'] = "Unknown action: $action";
}

// --- Output ---
if ($isCli) {
    header('Content-Type: text/plain');
    print_r($output);
} else {
    header('Content-Type: application/json');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}
