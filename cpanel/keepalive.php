<?php
/**
 * Emporium Capitals — Passenger keep-alive warmer (NEW FILE, no project code modified).
 *
 * cPanel/Passenger shuts down idle Node.js apps; the first visitor after that
 * waits through a cold start. Point a cPanel Cron Job at this script every
 * 15 minutes to keep the app warm:
 *
 *   php /home/USERNAME/emporiumcapitals/cpanel/keepalive.php
 *
 * Configuration: edit APP_BASE_URL below (no trailing slash).
 */
define('APP_BASE_URL', 'https://yourdomain.com');
define('CRON_TOKEN', 'change-me-to-a-random-string');

$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    $given = isset($_GET['token']) ? $_GET['token'] : '';
    if (!hash_equals(CRON_TOKEN, $given) || CRON_TOKEN === 'change-me-to-a-random-string') {
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
