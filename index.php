<?php
/**
 * Emporium Capitals — Universal PHP Reverse Proxy & Auto-Starter for cPanel Shared Hosting
 *
 * Compatible with:
 * 1. CloudLinux Passenger ("Setup Node.js App" in cPanel)
 * 2. Pure Apache / LiteSpeed Web Server
 * 3. FastCGI / PHP-FPM environments
 *
 * Architecture:
 * - If CloudLinux Passenger is active, Apache / Passenger serves directly via server.js.
 * - If Passenger is inactive or on budget shared hosting, this script intercepts
 *   requests, checks if the internal Node.js server is listening, boots it in
 *   the background if stopped, and reverse-proxies all HTTP traffic with full fidelity.
 * - During cold-start, visitors see an ultra-sleek, branded status screen with
 *   background polling and instant auto-redirection.
 */

// Configuration
define('NODE_HOST', '127.0.0.1');
define('DEFAULT_NODE_PORT', 3000);
define('STARTUP_TIMEOUT_SECONDS', 35);

$appRoot = __DIR__;
$pidFile = $appRoot . '/.cpanel_node.pid';
$logFile = $appRoot . '/cpanel/server.log';

// Defense in depth: strictly block sensitive files and internal code even if
// Apache .htaccess is disabled on the host (e.g. AllowOverride None).
$guardPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (preg_match('#(^|/)\.[^/]*$#', $guardPath)
    || preg_match('#\.(env(\..*)?|sql|log|pem|key|crt|ini)$#i', $guardPath)
    || preg_match('#^/(node_modules|\.git|\.next/server|\.next/cache|app|lib|components|sections|scripts|coverage|server\.js|proxy\.js|next\.config\.mjs|package(-lock)?\.json|bun\.lock)#', $guardPath)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "403 Forbidden: Direct access to internal application files is prohibited.\n";
    exit;
}

// Determine target port from .env or .cpanel_node.pid
$nodePort = DEFAULT_NODE_PORT;
if (file_exists($appRoot . '/.env')) {
    $envContent = file_get_contents($appRoot . '/.env');
    if (preg_match('/^PORT\s*=\s*(\d+)/m', $envContent, $matches)) {
        $nodePort = (int)$matches[1];
    }
}
if (file_exists($pidFile)) {
    $pidData = @json_decode(file_get_contents($pidFile), true);
    if (!empty($pidData['port'])) {
        $nodePort = (int)$pidData['port'];
    }
}

/**
 * Check if the Node.js application is listening on localhost
 */
function isNodeRunning($host, $port) {
    $connection = @fsockopen($host, $port, $errno, $errstr, 0.3);
    if (is_resource($connection)) {
        fclose($connection);
        return true;
    }
    return false;
}

/**
 * Locate the most suitable Node.js binary on the shared host
 */
function findNodeBinary($appRoot) {
    $possibleNodes = array(
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

    // Also check wildcard nvm installations in user directory
    $nvmPaths = glob(getenv('HOME') . '/.nvm/versions/node/v*/bin/node');
    if ($nvmPaths && is_array($nvmPaths)) {
        $possibleNodes = array_merge($possibleNodes, $nvmPaths);
    }

    foreach ($possibleNodes as $bin) {
        if (@is_executable($bin)) {
            return $bin;
        }
    }
    return 'node';
}

/**
 * Launch the Node.js production server in the background
 */
function startNodeServer($appRoot, $logFile, $port) {
    $nodeCmd = findNodeBinary($appRoot);
    $serverJs = escapeshellarg($appRoot . '/server.js');
    $logPath = escapeshellarg($logFile);
    $cdDir = escapeshellarg($appRoot);

    $cmd = "cd {$cdDir} && PORT={$port} NODE_ENV=production nohup {$nodeCmd} {$serverJs} >> {$logPath} 2>&1 & echo $!";

    if (function_exists('exec')) {
        $output = array();
        @exec($cmd, $output);
        return !empty($output[0]) ? (int)$output[0] : true;
    } elseif (function_exists('shell_exec')) {
        $pid = @shell_exec($cmd);
        return $pid ? (int)trim($pid) : true;
    } elseif (function_exists('proc_open')) {
        $descriptors = array(
            0 => array('pipe', 'r'),
            1 => array('file', $logFile, 'a'),
            2 => array('file', $logFile, 'a')
        );
        $process = @proc_open("cd {$cdDir} && PORT={$port} NODE_ENV=production {$nodeCmd} {$serverJs}", $descriptors, $pipes, $appRoot);
        if (is_resource($process)) {
            $status = proc_get_status($process);
            return !empty($status['pid']) ? $status['pid'] : true;
        }
    }
    return false;
}

// 1. Check if Node.js server is up
$isUp = isNodeRunning(NODE_HOST, $nodePort);

if (!$isUp) {
    $lockFile = $appRoot . '/cpanel/.starting.lock';
    $isStarting = file_exists($lockFile) && (time() - filemtime($lockFile) < STARTUP_TIMEOUT_SECONDS);

    if (!$isStarting) {
        @file_put_contents($lockFile, time());
        startNodeServer($appRoot, $logFile, $nodePort);
    }

    // Wait up to 2 seconds for fast boots
    for ($i = 0; $i < 10; $i++) {
        usleep(200000); // 200ms
        if (isNodeRunning(NODE_HOST, $nodePort)) {
            $isUp = true;
            @unlink($lockFile);
            break;
        }
    }

    // If still booting, show appropriate response
    if (!$isUp) {
        $requestUri = $_SERVER['REQUEST_URI'] ?? '/';

        // API requests get JSON retry response
        if (strpos($requestUri, '/api/') === 0) {
            http_response_code(503);
            header('Content-Type: application/json; charset=utf-8');
            header('Retry-After: 3');
            echo json_encode(array(
                'status' => 'starting',
                'message' => 'Node.js application server is initializing. Please retry shortly.',
                'retry_after' => 3
            ));
            exit;
        }

        // Web users get polished branded waiting screen
        http_response_code(503);
        header('Retry-After: 3');
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Initializing — Emporium Capitals</title>
            <meta http-equiv="refresh" content="3">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    background: #060714;
                    color: #ffffff;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                }
                .card {
                    background: #0e1026;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    padding: 44px 36px;
                    max-width: 480px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
                }
                .logo {
                    font-size: 24px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    margin-bottom: 28px;
                    color: #ffffff;
                }
                .logo span { color: #ef4d45; }
                .spinner-wrap {
                    position: relative;
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 28px;
                }
                .spinner {
                    width: 64px;
                    height: 64px;
                    border: 3px solid rgba(239, 77, 69, 0.15);
                    border-top-color: #ef4d45;
                    border-radius: 50%;
                    animation: spin 0.9s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                h1 { font-size: 20px; font-weight: 600; margin-bottom: 12px; }
                p { color: rgba(255, 255, 255, 0.65); font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
                .badge {
                    display: inline-block;
                    background: rgba(239, 77, 69, 0.1);
                    color: #ef4d45;
                    border: 1px solid rgba(239, 77, 69, 0.3);
                    font-size: 12px;
                    padding: 6px 16px;
                    border-radius: 9999px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
                .hint {
                    margin-top: 24px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.35);
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="logo">Emporium<span>Capitals</span></div>
                <div class="spinner-wrap">
                    <div class="spinner"></div>
                </div>
                <h1>Initializing Application Server</h1>
                <p>The application is waking up on cPanel shared hosting. This page will connect automatically as soon as services are online.</p>
                <div class="badge">Cold Start Optimization</div>
                <div class="hint">Shared hosting preserves resources by sleeping idle processes.</div>
            </div>
            <script>
                // Continuous background probe to reload the second the server responds
                setInterval(function() {
                    fetch('/_cpanel_ping', { method: 'GET', cache: 'no-cache' })
                        .then(function(r) {
                            if (r.ok) { window.location.reload(); }
                        })
                        .catch(function() {});
                }, 1200);
            </script>
        </body>
        </html>
        <?php
        exit;
    }
}

// 2. Node.js is active: Execute high-fidelity reverse proxy
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
    echo "502 Bad Gateway: Failed to reach internal application server on port {$nodePort}.\n";
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
