<?php
/**
 * Emporium Capitals — Hosting & Environment Diagnostics
 *
 * NEW FILE. No existing project code is modified.
 *
 * Usage:
 *   Visit https://yourdomain.com/cpanel/health.php
 *   Or via CLI: php cpanel/health.php
 *
 * Returns clean JSON diagnostics (booleans and status checks — never reveals secrets).
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
    // [ \t] only (NOT \s): \s would span the newline and match the next line.
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

$requiredExtensions = array('curl', 'mbstring', 'openssl', 'json');
$extensions = array();
foreach ($requiredExtensions as $ext) {
    $extensions[$ext] = extension_loaded($ext);
}
$extensions['pdo_pgsql'] = extension_loaded('pdo_pgsql'); // needed for db-install.php

// Read node port from .env or default to 3000
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

echo json_encode(array(
    'app'          => 'emporium-capitals',
    'status'       => 'ok',
    'timestamp'    => gmdate('c'),
    'php' => array(
        'version'      => PHP_VERSION,
        'sapi'         => php_sapi_name(),
        'memory_limit' => ini_get('memory_limit'),
        'extensions'   => $extensions,
    ),
    'node_server' => array(
        'listening'    => $isNodeAlive,
        'target_port'  => $nodePort,
        'pid_tracked'  => $pidInfo ? $pidInfo['pid'] : null,
    ),
    'files' => array(
        'server.js'        => fileOk($root . '/server.js'),
        'index.php'        => fileOk($root . '/index.php'),
        'package.json'     => fileOk($root . '/package.json'),
        'schema.sql'       => fileOk($root . '/schema.sql'),
        'admin-schema.sql' => fileOk($root . '/admin-schema.sql'),
        'next_build'       => is_file($root . '/.next/BUILD_ID'),
        'node_modules'     => is_dir($root . '/node_modules'),
    ),
    'env_present' => array(
        // Booleans only — secret values are never printed.
        // getenv() misses vars set for other SAPIs, so the root .env file
        // is checked too (presence only, values never read out).
        'DATABASE_URL'     => envPresent('DATABASE_URL', $root),
        'JWT_SECRET'       => envPresent('JWT_SECRET', $root),
        'SMTP_HOST'        => envPresent('SMTP_HOST', $root),
        'SMTP_USER'        => envPresent('SMTP_USER', $root),
        'ADMIN_EMAIL'      => envPresent('ADMIN_EMAIL', $root),
        'NEXT_PUBLIC_APP'  => envPresent('NEXT_PUBLIC_APP_URL', $root),
        'BACHS_API_KEY'    => envPresent('BACHS_API_KEY', $root),
        'GOOGLE_CLIENT_ID' => envPresent('GOOGLE_CLIENT_ID', $root),
    ),
), JSON_PRETTY_PRINT);
