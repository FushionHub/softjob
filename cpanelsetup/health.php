<?php
/**
 * Emporium Capitals — cPanel Hosting & Environment Diagnostics API
 *
 * Returns structured JSON diagnostics for uptime monitoring, deployment validation,
 * and environment verification. Never exposes secrets or passwords.
 *
 * Usage:
 *   Visit https://yourdomain.com/cpanelsetup/health.php
 *   Or via CLI: php cpanelsetup/health.php
 */

header('Content-Type: application/json; charset=utf-8');

$root = dirname(__DIR__);

function fileOk($path) {
    return is_file($path) && is_readable($path);
}

function envPresent($key, $root) {
    if (getenv($key)) return true;
    $envFile = $root . '/.env';
    if (!is_file($envFile)) return false;
    return (bool) preg_match('/^' . preg_quote($key, '/') . '[ \t]*=[ \t]*\S/m', file_get_contents($envFile));
}

function checkLocalPort($port = 3000) {
    $fp = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.2);
    if ($fp) {
        fclose($fp);
        return true;
    }
    return false;
}

function resolveNodeBinary($appRoot) {
    $candidates = array(
        'node',
        '/usr/local/bin/node',
        '/usr/bin/node',
        '/opt/cpanel/ea-nodejs20/bin/node',
        '/opt/cpanel/ea-nodejs18/bin/node',
        '/opt/cpanel/ea-nodejs22/bin/node',
        getenv('HOME') . '/nodevenv/' . basename($appRoot) . '/20/bin/node',
        getenv('HOME') . '/nodevenv/' . basename($appRoot) . '/18/bin/node',
    );
    foreach ($candidates as $bin) {
        if (@is_executable($bin)) return $bin;
    }
    return 'node';
}

$requiredExtensions = array('curl', 'mbstring', 'openssl', 'json', 'pdo_mysql', 'mysqli', 'pdo_pgsql');
$extensions = array();
foreach ($requiredExtensions as $ext) {
    $extensions[$ext] = extension_loaded($ext);
}

// Read port
$nodePort = 3000;
if (file_exists($root . '/.env')) {
    $envRaw = file_get_contents($root . '/.env');
    if (preg_match('/^PORT\s*=\s*(\d+)/m', $envRaw, $m)) {
        $nodePort = (int)$m[1];
    }
}

$pidFile = $root . '/.cpanel_node.pid';
$pidInfo = file_exists($pidFile) ? @json_decode(file_get_contents($pidFile), true) : null;
$isNodeAlive = checkLocalPort($nodePort);

$diskFree = function_exists('disk_free_space') ? @disk_free_space($root) : false;

echo json_encode(array(
    'app'          => 'emporium-capitals',
    'status'       => 'ok',
    'timestamp'    => gmdate('c'),
    'php' => array(
        'version'              => PHP_VERSION,
        'sapi'                 => php_sapi_name(),
        'memory_limit'         => ini_get('memory_limit'),
        'max_execution_time'   => ini_get('max_execution_time'),
        'upload_max_filesize'  => ini_get('upload_max_filesize'),
        'post_max_size'        => ini_get('post_max_size'),
        'extensions'           => $extensions,
    ),
    'node_server' => array(
        'detected_binary' => resolveNodeBinary($root),
        'listening'       => $isNodeAlive,
        'target_port'     => $nodePort,
        'pid_tracked'     => $pidInfo ? $pidInfo['pid'] : null,
        'started_at'      => $pidInfo ? ($pidInfo['startedAt'] ?? null) : null,
    ),
    'files' => array(
        'server.js'            => fileOk($root . '/server.js'),
        'ecosystem.config.js'  => fileOk($root . '/ecosystem.config.js'),
        'package.json'         => fileOk($root . '/package.json'),
        'next_build'       => is_file($root . '/.next/BUILD_ID'),
        'node_modules'     => is_dir($root . '/node_modules'),
        'schema_mysql'     => fileOk($root . '/schema-mysql.sql'),
        'schema_pgsql'     => fileOk($root . '/schema.sql'),
        'admin_schema'     => fileOk($root . '/admin-schema.sql'),
        'htaccess'         => fileOk($root . '/.htaccess'),
        'cpanel_yml'       => fileOk($root . '/.cpanel.yml'),
        'user_ini'         => fileOk($root . '/.user.ini'),
        'php_ini'          => fileOk($root . '/php.ini'),
    ),
    'env_present' => array(
        'DATABASE_URL'     => envPresent('DATABASE_URL', $root),
        'JWT_SECRET'       => envPresent('JWT_SECRET', $root),
        'SMTP_HOST'        => envPresent('SMTP_HOST', $root),
        'SMTP_USER'        => envPresent('SMTP_USER', $root),
        'ADMIN_EMAIL'      => envPresent('ADMIN_EMAIL', $root),
        'NEXT_PUBLIC_APP'  => envPresent('NEXT_PUBLIC_APP_URL', $root),
        'BACHS_API_KEY'    => envPresent('BACHS_API_KEY', $root),
        'GOOGLE_CLIENT_ID' => envPresent('GOOGLE_CLIENT_ID', $root),
    ),
    'system' => array(
        'disk_free_mb'     => $diskFree !== false ? round($diskFree / 1024 / 1024) : null,
        'writable_root'    => is_writable($root),
        'writable_cpanel'  => is_writable(__DIR__),
    ),
), JSON_PRETTY_PRINT);
