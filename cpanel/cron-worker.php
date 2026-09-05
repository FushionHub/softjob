<?php
/**
 * Emporium Capitals — Watchdog & Keep-Alive Cron Worker for cPanel Shared Hosting
 *
 * NEW FILE. No existing project code is modified.
 *
 * Purpose:
 * 1. Warm up the application to prevent CloudLinux Passenger cold starts.
 * 2. Act as a watchdog: automatically revive the Node.js server if it stopped.
 * 3. Maintain clean, rotated logs in cpanel/keepalive.log.
 *
 * Usage in cPanel Cron Jobs (Every 10 or 15 minutes):
 *   php /home/USERNAME/public_html/cpanel/cron-worker.php
 * Or via web (token protected):
 *   https://yourdomain.com/cpanel/cron-worker.php?token=YOUR_TOKEN
 */

$appRoot = dirname(__DIR__);
$logFile = __DIR__ . '/keepalive.log';
$serverLog = __DIR__ . '/server.log';

// Configuration
$baseUrl = 'http://127.0.0.1:3000';
$cronToken = 'change-me-to-a-secure-token';

// Load values from .env if available
if (file_exists($appRoot . '/.env')) {
    $envContent = file_get_contents($appRoot . '/.env');
    if (preg_match('/^NEXT_PUBLIC_APP_URL\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $matches)) {
        $baseUrl = rtrim(trim($matches[1]), '/');
    }
    if (preg_match('/^CPANEL_CRON_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $matches)) {
        $cronToken = trim($matches[1]);
    }
}

// Authentication for web invocations
$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    $providedToken = $_GET['token'] ?? '';
    if (empty($providedToken) || $cronToken === 'change-me-to-a-secure-token' || !hash_equals($cronToken, $providedToken)) {
        http_response_code(403);
        exit(json_encode(array('status' => 'error', 'message' => 'Forbidden. Invalid or unconfigured cron token.')));
    }
}

/**
 * Check if a port is listening on localhost
 */
function isPortActive($port = 3000) {
    $fp = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.4);
    if ($fp) {
        fclose($fp);
        return true;
    }
    return false;
}

/**
 * Revive the Node server if down
 */
function reviveNodeServer($appRoot, $serverLog, $port = 3000) {
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

    $cmd = "cd " . escapeshellarg($appRoot) . " && PORT={$port} NODE_ENV=production nohup {$nodeBin} server.js >> " . escapeshellarg($serverLog) . " 2>&1 &";
    if (function_exists('exec')) {
        @exec($cmd);
    } elseif (function_exists('shell_exec')) {
        @shell_exec($cmd);
    }
}

// Resolve the app port: pid file written by manager.php/index.php wins,
// otherwise fall back to PORT in .env, otherwise 3000.
$appPort = 3000;
$pidFile = $appRoot . '/.cpanel_node.pid';
if (file_exists($pidFile)) {
    $pidData = @json_decode(file_get_contents($pidFile), true);
    if (!empty($pidData['port'])) { $appPort = (int) $pidData['port']; }
} elseif (file_exists($appRoot . '/.env')
    && preg_match('/^PORT\s*=\s*(\d+)/m', file_get_contents($appRoot . '/.env'), $pm)) {
    $appPort = (int) $pm[1];
}

// Check watchdog status
$wasDown = false;
if (!isPortActive($appPort)) {
    // Only attempt revival if server.js exists
    if (file_exists($appRoot . '/server.js')) {
        $wasDown = true;
        reviveNodeServer($appRoot, $serverLog, $appPort);
        sleep(2);
    }
}

// Targets to ping: real Node routes (/_cpanel_ping does not exist).
$targets = array(
    'home'   => $baseUrl . '/',
    'prices' => $baseUrl . '/api/prices',
);

$results = array();
foreach ($targets as $label => $url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'EmporiumCapitals-Watchdog/2.0',
    ));

    $start = microtime(true);
    $response = curl_exec($ch);
    $duration = round(microtime(true) - $start, 3);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    $results[$label] = array(
        'url'      => $url,
        'http'     => $httpCode,
        'latency'  => $duration,
        'error'    => $error ?: null,
    );
}

$summary = array(
    'timestamp' => gmdate('Y-m-d H:i:s \U\T\C'),
    'watchdog_triggered' => $wasDown,
    'results'   => $results,
);

// Rotate log if larger than 1MB
if (file_exists($logFile) && filesize($logFile) > 1048576) {
    @rename($logFile, $logFile . '.old');
}

// Append log entry
@file_put_contents($logFile, json_encode($summary) . "\n", FILE_APPEND);

// Return output
if (!$isCli) {
    header('Content-Type: application/json; charset=utf-8');
}
echo json_encode($summary, JSON_PRETTY_PRINT) . "\n";
