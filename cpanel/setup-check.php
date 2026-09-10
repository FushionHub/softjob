<?php
/**
 * Emporium Capitals — Pre-Flight cPanel Deployment Checklist
 *
 * Visual diagnostic validator to verify all shared hosting prerequisites before launching.
 */

$root = dirname(__DIR__);

// Helper checks
function checkFile($path) {
    return file_exists($path) && is_readable($path);
}

function checkEnvVar($key, $root) {
    if (getenv($key)) return true;
    $envPath = $root . '/.env';
    if (!file_exists($envPath)) return false;
    return (bool)preg_match('/^' . preg_quote($key, '/') . '[ \t]*=[ \t]*\S/m', file_get_contents($envPath));
}

function detectNode($appRoot) {
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
    return null;
}

$phpOk = version_compare(PHP_VERSION, '7.4.0', '>=');
$extCurl = extension_loaded('curl');
$extMysql = extension_loaded('pdo_mysql') || extension_loaded('mysqli');
$extPgsql = extension_loaded('pdo_pgsql');
$extMbstring = extension_loaded('mbstring');
$extOpenssl = extension_loaded('openssl');
$extJson = extension_loaded('json');

$nodeBin = detectNode($root);
$buildOk = checkFile($root . '/.next/BUILD_ID');
$modulesOk = is_dir($root . '/node_modules');
$envExists = file_exists($root . '/.env');
$htaccessOk = checkFile($root . '/.htaccess');

$token = $_GET['token'] ?? '';

$checks = array(
    array(
        'category' => 'PHP Environment',
        'items' => array(
            array('name' => 'PHP Version &ge; 7.4', 'status' => $phpOk, 'detail' => 'Current: ' . PHP_VERSION, 'required' => true),
            array('name' => 'cURL Extension', 'status' => $extCurl, 'detail' => 'Needed for reverse proxy and external APIs', 'required' => true),
            array('name' => 'MySQL Extension (pdo_mysql/mysqli)', 'status' => $extMysql, 'detail' => 'For native cPanel database', 'required' => true),
            array('name' => 'OpenSSL & Mbstring', 'status' => $extOpenssl && $extMbstring, 'detail' => 'Security and unicode support', 'required' => true),
            array('name' => 'Memory Limit &ge; 256M', 'status' => ((int)ini_get('memory_limit') >= 256 || ini_get('memory_limit') === '-1'), 'detail' => 'Current: ' . ini_get('memory_limit'), 'required' => false),
        )
    ),
    array(
        'category' => 'Node.js & Application Build',
        'items' => array(
            array('name' => 'Node.js Binary Reachable', 'status' => (bool)$nodeBin, 'detail' => $nodeBin ? "Found: {$nodeBin}" : 'Missing! Run in cPanel Terminal: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && source ~/.bashrc && nvm install 20', 'required' => true),
            array('name' => 'Next.js Production Build (.next)', 'status' => $buildOk, 'detail' => $buildOk ? 'Compiled build present' : 'Missing! Run `npm run build` or upload .next/ directory.', 'required' => true),
            array('name' => 'Server Dependencies (node_modules)', 'status' => $modulesOk, 'detail' => $modulesOk ? 'Installed' : 'Missing! Run `npm install` on server.', 'required' => true),
            array('name' => 'PM2 Configuration (ecosystem.config.js)', 'status' => checkFile($root . '/ecosystem.config.js'), 'detail' => 'Configured for PM2 process manager (rico-investimentos)', 'required' => true),
            array('name' => 'Apache Configuration (.htaccess)', 'status' => $htaccessOk, 'detail' => $htaccessOk ? 'Active' : 'Missing .htaccess file', 'required' => true),
        )
    ),
    array(
        'category' => 'Environment & Database Configuration',
        'items' => array(
            array('name' => 'Environment File (.env)', 'status' => $envExists, 'detail' => $envExists ? 'Found' : 'Missing .env (copy from env.example)', 'required' => true),
            array('name' => 'DATABASE_URL Configured', 'status' => checkEnvVar('DATABASE_URL', $root), 'detail' => 'MySQL or PostgreSQL connection string', 'required' => true),
            array('name' => 'JWT_SECRET Configured', 'status' => checkEnvVar('JWT_SECRET', $root), 'detail' => 'Authentication encryption key', 'required' => true),
            array('name' => 'NEXT_PUBLIC_APP_URL Configured', 'status' => checkEnvVar('NEXT_PUBLIC_APP_URL', $root), 'detail' => 'Your domain URL', 'required' => true),
        )
    )
);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Emporium Capitals — Pre-Flight Deployment Checklist</title>
    <style>
        :root {
            --bg: #060714;
            --card-bg: #0e1026;
            --border: rgba(255, 255, 255, 0.08);
            --accent: #ef4d45;
            --success: #10b981;
            --warning: #f59e0b;
            --text: #f0f2ff;
            --text-dim: #8a92b2;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background: var(--bg);
            color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 36px 16px;
            min-height: 100vh;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
        .logo span { color: var(--accent); }
        .subtitle { color: var(--text-dim); font-size: 14px; }
        .card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 24px;
            margin-bottom: 20px;
        }
        .card-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
        .item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .item:last-child { border-bottom: none; }
        .item-name { font-size: 14px; font-weight: 600; }
        .item-detail { font-size: 12px; color: var(--text-dim); margin-top: 2px; }
        .badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 9999px;
            text-transform: uppercase;
        }
        .badge.pass { background: rgba(16,185,129,0.15); color: var(--success); border: 1px solid var(--success); }
        .badge.fail { background: rgba(239,77,69,0.15); color: var(--accent); border: 1px solid var(--accent); }
        .badge.warn { background: rgba(245,158,11,0.15); color: var(--warning); border: 1px solid var(--warning); }
        .nav-links { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }
        .nav-links a {
            padding: 10px 18px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            color: #fff;
            background: rgba(255,255,255,0.06);
            border: 1px solid var(--border);
            transition: all 0.2s;
        }
        .nav-links a:hover { background: rgba(255,255,255,0.12); }
        .nav-links a.primary { background: var(--accent); border-color: var(--accent); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Emporium<span>Capitals</span></div>
            <div class="subtitle">Pre-Flight cPanel Deployment Checklist</div>
        </div>

        <?php foreach ($checks as $cat): ?>
            <div class="card">
                <div class="card-title"><?= htmlspecialchars($cat['category']) ?></div>
                <?php foreach ($cat['items'] as $item): ?>
                    <div class="item">
                        <div>
                            <div class="item-name"><?= $item['name'] ?></div>
                            <div class="item-detail"><?= htmlspecialchars($item['detail']) ?></div>
                        </div>
                        <div>
                            <?php if ($item['status']): ?>
                                <span class="badge pass">Pass</span>
                            <?php elseif ($item['required']): ?>
                                <span class="badge fail">Action Needed</span>
                            <?php else: ?>
                                <span class="badge warn">Notice</span>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endforeach; ?>

        <div class="nav-links">
            <a href="manager.php?token=<?= htmlspecialchars($token) ?>" class="primary">Open Server Manager</a>
            <a href="db-install.php?token=<?= htmlspecialchars($token) ?>">Database Installer</a>
            <a href="health.php" target="_blank">View Health JSON</a>
        </div>
    </div>
</body>
</html>
