<?php
/**
 * Emporium Capitals — Watchdog & Keep-Alive Cron Worker for cPanel Shared Hosting
 *
 * Functions:
 * 1. Warms up the Next.js application to prevent CloudLinux Passenger cold starts.
 * 2. Revives the Node.js server automatically if stopped on pure Apache hosts.
 * 3. Triggers automated crypto trade settlements and investment maturity processing.
 * 4. Rotates logs in cpanelsetup/keepalive.log to prevent quota saturation.
 *
 * cPanel Cron Job Configuration (Every 10 minutes):
 *   php /home/USERNAME/public_html/cpanelsetup/cron-worker.php
 * Or via web (token protected):
 *   https://yourdomain.com/cpanelsetup/cron-worker.php?token=YOUR_TOKEN
 */

$appRoot = dirname(__DIR__);
$logFile = __DIR__ . '/keepalive.log';
$serverLog = __DIR__ . '/server.log';

// Default configuration
$baseUrl = 'http://127.0.0.1:3000';
$cronToken = 'b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5';

// Load values from .env if available
if (file_exists($appRoot . '/.env')) {
    $envContent = file_get_contents($appRoot . '/.env');
    if (preg_match('/^NEXT_PUBLIC_APP_URL\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $matches)) {
        $baseUrl = rtrim(trim($matches[1]), '/');
    }
    if (preg_match('/^CPANEL_CRON_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $matches)) {
        $cronToken = trim($matches[1]);
    } elseif (preg_match('/^CPANEL_SETUP_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $matches)) {
        $cronToken = trim($matches[1]);
    } elseif (preg_match('/^CPANEL_MANAGER_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $matches)) {
        $cronToken = trim($matches[1]);
    }
}

// Security: require token for web invocations
$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    $providedToken = $_GET['token'] ?? '';
    if (empty($providedToken) || !hash_equals($cronToken, $providedToken)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        exit(json_encode(array('status' => 'error', 'message' => 'Forbidden: Invalid or unconfigured cron token.')));
    }
}

/**
 * Check if target port is active
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

/**
 * Revive Node server if down
 */
function reviveNodeServer($appRoot, $serverLog, $port = 3000) {
    // If ecosystem.config.js is present, attempt PM2 revival first
    if (file_exists($appRoot . '/ecosystem.config.js')) {
        $pm2Cmd = "cd " . escapeshellarg($appRoot) . " && (pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js) >> " . escapeshellarg($serverLog) . " 2>&1 &";
        if (function_exists('exec')) {
            @exec($pm2Cmd);
            return;
        } elseif (function_exists('shell_exec')) {
            @shell_exec($pm2Cmd);
            return;
        }
    }

    $nodeCmd = resolveNodeBinary($appRoot);
    $cmd = "cd " . escapeshellarg($appRoot) . " && PORT={$port} NODE_ENV=production nohup {$nodeCmd} server.js >> " . escapeshellarg($serverLog) . " 2>&1 &";
    if (function_exists('exec')) {
        @exec($cmd);
    } elseif (function_exists('shell_exec')) {
        @shell_exec($cmd);
    }
}

// Resolve port
$appPort = 3000;
$pidFile = $appRoot . '/.cpanel_node.pid';
if (file_exists($pidFile)) {
    $pidData = @json_decode(file_get_contents($pidFile), true);
    if (!empty($pidData['port'])) {
        $appPort = (int)$pidData['port'];
    }
} elseif (file_exists($appRoot . '/.env') && preg_match('/^PORT\s*=\s*(\d+)/m', file_get_contents($appRoot . '/.env'), $pm)) {
    $appPort = (int)$pm[1];
}

// Watchdog: verify port activity and revive if dead
$wasDown = false;
if (!isPortActive($appPort) && file_exists($appRoot . '/server.js')) {
    $wasDown = true;
    reviveNodeServer($appRoot, $serverLog, $appPort);
    sleep(2);
}

// Target routes to warm and process
$targets = array(
    'home'         => $baseUrl . '/',
    'ping'         => $baseUrl . '/_cpanel_ping',
    'prices'       => $baseUrl . '/api/prices',
    'cron_process' => $baseUrl . '/api/cron/process?token=' . urlencode($cronToken),
);

$results = array();
foreach ($targets as $label => $url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'EmporiumCapitals-Watchdog/3.0',
    ));

    $start = microtime(true);
    $response = curl_exec($ch);
    $duration = round(microtime(true) - $start, 3);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    $results[$label] = array(
        'url'     => $url,
        'http'    => $httpCode,
        'latency' => $duration,
        'error'   => $error ?: null,
    );
}

$summary = array(
    'timestamp'          => gmdate('Y-m-d H:i:s \U\T\C'),
    'watchdog_revived'   => $wasDown,
    'app_port'           => $appPort,
    'results'            => $results,
);

// Rotate log if larger than 1MB
if (file_exists($logFile) && filesize($logFile) > 1048576) {
    @rename($logFile, $logFile . '.old');
}

@file_put_contents($logFile, json_encode($summary) . "\n", FILE_APPEND);

if (!$isCli) {
    header('Content-Type: application/json; charset=utf-8');
}
echo json_encode($summary, JSON_PRETTY_PRINT) . "\n";
