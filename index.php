<?php
/**
 * Emporium Capitals — Direct Reverse Proxy for PM2 / Node.js
 *
 * NOTE: The background process auto-starter and cold-start loading screen have been
 * completely removed as the application is managed directly by PM2 via ecosystem.config.js.
 *
 * This script serves as a lightweight fallback proxy to http://127.0.0.1:PORT
 * when Apache mod_proxy is not enabled on the shared host.
 */

define('NODE_HOST', '127.0.0.1');
define('DEFAULT_NODE_PORT', 3000);

$appRoot = __DIR__;

// Defense in depth: strictly block sensitive files and internal code
$guardPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (preg_match('#(^|/)\.[^/]*$#', $guardPath)
    || preg_match('#\.(env(\..*)?|sql|log|pem|key|crt|ini)$#i', $guardPath)
    || preg_match('#^/(node_modules|\.git|\.next/server|\.next/cache|app|lib|components|sections|scripts|coverage|server\.js|proxy\.js|next\.config\.mjs|ecosystem\.config\.js|package(-lock)?\.json|bun\.lock)#', $guardPath)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "403 Forbidden: Direct access to internal application files is prohibited.\n";
    exit;
}

// Determine target port from .env or default to 3000
$nodePort = DEFAULT_NODE_PORT;
if (file_exists($appRoot . '/.env')) {
    $envContent = file_get_contents($appRoot . '/.env');
    if (preg_match('/^PORT\s*=\s*(\d+)/m', $envContent, $matches)) {
        $nodePort = (int)$matches[1];
    }
}

// Direct reverse proxy to Node.js / PM2
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$targetUrl = 'http://' . NODE_HOST . ':' . $nodePort . $requestUri;

$ch = curl_init($targetUrl);

// Collect incoming request headers
if (function_exists('getallheaders')) {
    $incomingHeaders = getallheaders();
} else {
    $incomingHeaders = array();
    foreach ($_SERVER as $k => $v) {
        if (strpos($k, 'HTTP_') === 0) {
            $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($k, 5)))));
            $incomingHeaders[$name] = $v;
        }
    }
    if (isset($_SERVER['CONTENT_TYPE'])) { $incomingHeaders['Content-Type'] = $_SERVER['CONTENT_TYPE']; }
    if (isset($_SERVER['CONTENT_LENGTH'])) { $incomingHeaders['Content-Length'] = $_SERVER['CONTENT_LENGTH']; }
}

$forwardHeaders = array();
$clientHost = $_SERVER['HTTP_HOST'] ?? 'localhost';

foreach ($incomingHeaders as $name => $value) {
    $lower = strtolower($name);
    if ($lower === 'host') {
        $forwardHeaders[] = 'Host: ' . $clientHost;
        $forwardHeaders[] = 'X-Forwarded-Host: ' . $clientHost;
    } elseif ($lower !== 'content-length') {
        $forwardHeaders[] = $name . ': ' . $value;
    }
}

$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$forwardHeaders[] = 'X-Forwarded-For: ' . $clientIp;
$forwardHeaders[] = 'X-Forwarded-Proto: ' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http');
$forwardHeaders[] = 'X-Real-IP: ' . $clientIp;

curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 90);

// Forward request payload for POST, PUT, PATCH, DELETE
if (in_array($_SERVER['REQUEST_METHOD'], array('POST', 'PUT', 'PATCH', 'DELETE'))) {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: text/plain; charset=utf-8');
    echo "502 Bad Gateway: Failed to connect to Node.js application on port {$nodePort}.\n";
    echo "Please ensure the app is running in PM2: `pm2 status` or `pm2 start ecosystem.config.js`.\n";
    echo "Error: " . curl_error($ch) . "\n";
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$rawHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

http_response_code($httpCode);

// Send back response headers, preserving multiple Set-Cookie headers
$headerLines = explode("\r\n", $rawHeaders);
foreach ($headerLines as $line) {
    if (empty($line) || stripos($line, 'HTTP/') === 0) continue;
    if (stripos($line, 'Transfer-Encoding:') === 0) continue;
    header($line, false);
}

echo $body;
