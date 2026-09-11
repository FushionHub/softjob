<?php
/**
 * Emporium Capitals — Passenger keep-alive warmer (NEW FILE, no project code modified).
 *
 * cPanel/Passenger shuts down idle Node.js apps; the first visitor after that
 * waits through a cold start. Point a cPanel Cron Job at this script every
 * 15 minutes to keep the app warm:
 *
 *   php /home/USERNAME/public_html/cpanelsetup/keepalive.php
 *
 * Configuration: APP_BASE_URL is read from NEXT_PUBLIC_APP_URL in the root
 * .env automatically (override by editing the fallback below, no trailing slash).
 */
define('APP_BASE_URL_FALLBACK', 'http://127.0.0.1:3000');
define('CRON_TOKEN', 'b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5');

$__appBase = APP_BASE_URL_FALLBACK;
$__envPath = dirname(__DIR__) . '/.env';
$cronToken = CRON_TOKEN;
if (is_file($__envPath)) {
    $envContent = file_get_contents($__envPath);
    if (preg_match('/^NEXT_PUBLIC_APP_URL\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $__m)) {
        $__appBase = rtrim(trim($__m[1]), '/');
    }
    if (preg_match('/^CPANEL_CRON_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $cm)) {
        $cronToken = trim($cm[1]);
    } elseif (preg_match('/^CPANEL_SETUP_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $cm)) {
        $cronToken = trim($cm[1]);
    }
}
define('APP_BASE_URL', $__appBase);

$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    $given = isset($_GET['token']) ? $_GET['token'] : '';
    if (empty($given) || !hash_equals($cronToken, $given)) {
        http_response_code(403);
        echo "Forbidden.\n";
        exit(1);
    }
}

$targets = array('/', '/api/prices');
$results = array();

foreach ($targets as $path) {
    $url = rtrim(APP_BASE_URL, '/') . $path;
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 25,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'EmporiumCapitals-KeepAlive/1.0',
    ));
    $body = curl_exec($ch);
    $results[$path] = array(
        'http'  => curl_getinfo($ch, CURLINFO_HTTP_CODE),
        'time'  => round(curl_getinfo($ch, CURLINFO_TOTAL_TIME), 2),
        'error' => curl_error($ch) ? curl_error($ch) : null,
        'bytes' => is_string($body) ? strlen($body) : 0,
    );
    curl_close($ch);
}

$summary = array('at' => gmdate('c'), 'results' => $results);
@file_put_contents(__DIR__ . '/keepalive.log', json_encode($summary) . "\n", FILE_APPEND);

if ($isCli) {
    echo json_encode($summary, JSON_PRETTY_PRINT) . "\n";
} else {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($summary, JSON_PRETTY_PRINT);
}
