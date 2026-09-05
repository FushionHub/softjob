<?php
/**
 * Emporium Capitals — Universal PHP Reverse Proxy & Auto-Starter for cPanel Shared Hosting
 *
 * NEW FILE. No existing project code is modified.
 *
 * How this works:
 * 1. If CloudLinux Passenger is active, Apache handles requests directly via server.js.
 * 2. If Passenger is inactive or on standard Apache/LiteSpeed, this script intercepts
 *    requests, checks if the local Node.js application is running, boots it in the
 *    background if stopped, and reverse-proxies all HTTP traffic (headers, body, cookies).
 * 3. While Node.js prepares and compiles during cold start, visitors see a sleek,
 *    branded loading screen with automatic polling and instant redirection.
 */

// Configuration
define('NODE_HOST', '127.0.0.1');
define('DEFAULT_NODE_PORT', 3000);
define('STARTUP_TIMEOUT_SECONDS', 30);

$appRoot = __DIR__;
$pidFile = $appRoot . '/.cpanel_node.pid';
$logFile = $appRoot . '/cpanel/server.log';

// Determine target port
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
 * Check if the Node.js application is listening and healthy
 */
function isNodeRunning($host, $port) {
    $connection = @fsockopen($host, $port, $errno, $errstr, 0.4);
    if (is_resource($connection)) {
        fclose($connection);
        return true;
    }
    return false;
}

/**
 * Attempt to launch the Node.js application in the background
 */
function startNodeServer($appRoot, $logFile, $port) {
    // Find node binary
    $nodeBinaries = array(
        'node',
        '/usr/local/bin/node',
        '/usr/bin/node',
        getenv('HOME') . '/nodevenv/' . basename($appRoot) . '/20/bin/node',
        getenv('HOME') . '/nodevenv/' . basename($appRoot) . '/18/bin/node',
    );

    $nodeCmd = 'node';
    foreach ($nodeBinaries as $bin) {
        if (@is_executable($bin)) {
            $nodeCmd = $bin;
            break;
        }
    }

    $serverJs = escapeshellarg($appRoot . '/server.js');
    $logPath = escapeshellarg($logFile);
    $cdDir = escapeshellarg($appRoot);

    // Prepare startup command with environment variables
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

// 1. If node is not running, initiate startup
$isUp = isNodeRunning(NODE_HOST, $nodePort);

if (!$isUp) {
    // Check if we already started it very recently (within 10 seconds)
    $lockFile = $appRoot . '/cpanel/.starting.lock';
    $isStarting = file_exists($lockFile) && (time() - filemtime($lockFile) < STARTUP_TIMEOUT_SECONDS);

    if (!$isStarting) {
        @file_put_contents($lockFile, time());
        startNodeServer($appRoot, $logFile, $nodePort);
    }

    // Wait briefly (up to 2 seconds) in case it boots quickly
    for ($i = 0; $i < 10; $i++) {
        usleep(200000); // 200ms
        if (isNodeRunning(NODE_HOST, $nodePort)) {
            $isUp = true;
            @unlink($lockFile);
            break;
        }
    }

    // If still starting, display a polite auto-refreshing loading screen
    if (!$isUp) {
        $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
        // If it's an API call, return JSON retry-after
        if (strpos($requestUri, '/api/') === 0) {
            http_response_code(503);
            header('Content-Type: application/json; charset=utf-8');
            header('Retry-After: 3');
            echo json_encode(array(
                'status' => 'starting',
                'message' => 'Node.js server is booting. Please retry in 3 seconds.'
            ));
            exit;
        }

        // Beautiful, dark-themed responsive loading screen
        http_response_code(503);
        header('Retry-After: 3');
        ?>
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Starting Emporium Capitals...</title>
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
                    padding: 20px;
                }
                .card {
                    background: #0e1026;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 480px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                }
                .logo {
                    font-size: 22px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    margin-bottom: 24px;
                    color: #fff;
                }
                .logo span { color: #ef4d45; }
                .spinner {
                    width: 56px;
                    height: 56px;
                    border: 3px solid rgba(239, 77, 69, 0.15);
                    border-top-color: #ef4d45;
                    border-radius: 50%;
                    animation: spin 0.9s linear infinite;
                    margin: 0 auto 24px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                h1 { font-size: 19px; font-weight: 600; margin-bottom: 10px; }
                p { color: rgba(255, 255, 255, 0.6); font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
                .badge {
                    display: inline-block;
                    background: rgba(239, 77, 69, 0.1);
                    color: #ef4d45;
                    border: 1px solid rgba(239, 77, 69, 0.25);
                    font-size: 12px;
                    padding: 6px 14px;
                    border-radius: 9999px;
                    font-weight: 600;
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
                <div class="spinner"></div>
                <h1>Initializing Application</h1>
                <p>The application server is warming up on cPanel. This page will refresh automatically in a few seconds.</p>
                <div class="badge">Cold Start In Progress</div>
                <div class="hint">Shared hosting optimizes resources by sleeping idle processes.</div>
            </div>
            <script>
                // Continuous background probe for fastest reload.
                // NOTE: must hit a NODE route (/api/prices), NOT /cpanel/health.php
                // (health.php is served by PHP and returns 200 even while Node is down).
                setInterval(function() {
                    fetch('/api/prices', { method: 'HEAD', cache: 'no-cache' })
                        .then(function(r) { if (r.ok) window.location.reload(); })
                        .catch(function() {});
                }, 1500);
            </script>
        </body>
        </html>
        <?php
        exit;
    }
}

// 2. Node.js is active: Reverse-proxy the request
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$targetUrl = 'http://' . NODE_HOST . ':' . $nodePort . $requestUri;

$ch = curl_init($targetUrl);

// Collect and forward incoming headers.
// getallheaders() only exists under Apache mod_php / php-fpm 7.3+ — fall
// back to parsing $_SERVER so plain CGI builds don't fatal-error.
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
foreach ($incomingHeaders as $name => $value) {
    $lower = strtolower($name);
    if ($lower === 'host') {
        $forwardHeaders[] = 'Host: ' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
        $forwardHeaders[] = 'X-Forwarded-Host: ' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
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
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

// Forward request payload if present
if (in_array($_SERVER['REQUEST_METHOD'], array('POST', 'PUT', 'PATCH', 'DELETE'))) {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Bad Gateway: Failed to connect to internal application server.\nError: " . curl_error($ch);
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$rawHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

http_response_code($httpCode);

// Send back response headers
$headerLines = explode("\r\n", $rawHeaders);
foreach ($headerLines as $line) {
    if (empty($line) || stripos($line, 'HTTP/') === 0) continue;
    if (stripos($line, 'Transfer-Encoding:') === 0) continue;
    header($line, false);
}

echo $body;
