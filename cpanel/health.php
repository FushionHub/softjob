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
        // Booleans only — secret values are never printed
        'DATABASE_URL'     => (bool) getenv('DATABASE_URL'),
        'JWT_SECRET'       => (bool) getenv('JWT_SECRET'),
        'SMTP_HOST'        => (bool) getenv('SMTP_HOST'),
        'SMTP_USER'        => (bool) getenv('SMTP_USER'),
        'ADMIN_EMAIL'      => (bool) getenv('ADMIN_EMAIL'),
        'NEXT_PUBLIC_APP'  => (bool) getenv('NEXT_PUBLIC_APP_URL'),
    ),
), JSON_PRETTY_PRINT);
