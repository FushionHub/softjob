<?php
/**
 * Emporium Capitals — Universal Browser Database Installer
 *
 * Supports BOTH:
 * 1. Native cPanel MySQL / MariaDB (via pdo_mysql or mysqli) — Recommended for cPanel
 * 2. Neon / External PostgreSQL (via pdo_pgsql)
 *
 * Usage:
 *   1. Set CPANEL_SETUP_TOKEN (or CPANEL_MANAGER_TOKEN) in your .env file or use default.
 *   2. Visit https://yourdomain.com/cpanelsetup/db-install.php?token=YOUR_TOKEN
 *   3. Choose your database type (MySQL or PostgreSQL), enter credentials, and click Install.
 *   4. Delete this script or lock it after deployment.
 */

session_start();
$appRoot = dirname(__DIR__);

define('DEFAULT_SETUP_TOKEN', 'b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5');
$setupToken = DEFAULT_SETUP_TOKEN;
$envDbUrl = 'postgresql://neondb_owner:npg_STow8V2WksGl@ep-orange-star-zatn5jjs-pooler.c-2.eu-west-2.aws.neon.tech/softsjob?sslmode=require';

// Load token and existing DATABASE_URL from .env if present
if (file_exists($appRoot . '/.env')) {
    $envContent = file_get_contents($appRoot . '/.env');
    if (preg_match('/^CPANEL_SETUP_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $m)) {
        $setupToken = trim($m[1]);
    } elseif (preg_match('/^CPANEL_MANAGER_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $m)) {
        $setupToken = trim($m[1]);
    }
    if (preg_match('/^DATABASE_URL\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $m)) {
        $envDbUrl = trim($m[1]);
    }
}

// Check authentication
$token = $_GET['token'] ?? $_POST['token'] ?? $_SESSION['db_install_token'] ?? $_SESSION['cpanelsetup_token'] ?? '';
$isAuth = ($token !== '' && hash_equals($setupToken, $token));

if ($isAuth) {
    $_SESSION['db_install_token'] = $token;
} else {
    http_response_code(403);
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Installer Access Forbidden</title>
        <style>
            body { background: #060714; color: #fff; font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: #0e1026; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px; max-width: 520px; text-align: center; }
            h2 { font-size: 20px; margin-bottom: 12px; color: #ef4d45; }
            p { color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
            code { background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 6px; color: #f97316; font-size: 13px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>403 &mdash; Database Installer Protected</h2>
            <p>To access the installer, configure <code>CPANEL_SETUP_TOKEN</code> in your <code>.env</code> file, then open this page with <code>?token=YOUR_TOKEN</code>.</p>
        </div>
    </body>
    </html>
    <?php
    exit;
}

require_once __DIR__ . '/sql-splitter.php';

// Detect PHP PDO extensions
$hasPdoMysql = extension_loaded('pdo_mysql');
$hasPdoPgsql = extension_loaded('pdo_pgsql');
$hasMysqli   = extension_loaded('mysqli');

$actionResult = null;
$actionError  = null;

// Handle Form Submissions (Test Connection or Run Installation)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $dbType = $_POST['db_type'] ?? 'mysql';
    $action = $_POST['action'] ?? 'install';

    try {
        if ($dbType === 'mysql') {
            // Build MySQL connection parameters
            $myHost = trim($_POST['mysql_host'] ?? '127.0.0.1');
            $myPort = (int)($_POST['mysql_port'] ?? 3306);
            $myDb   = trim($_POST['mysql_database'] ?? '');
            $myUser = trim($_POST['mysql_username'] ?? '');
            $myPass = $_POST['mysql_password'] ?? '';

            if (empty($myDb) || empty($myUser)) {
                throw new Exception('Database name and username are required.');
            }

            if (!$hasPdoMysql && !$hasMysqli) {
                throw new Exception('Neither pdo_mysql nor mysqli extensions are enabled in PHP.');
            }

            $pdo = new PDO("mysql:host={$myHost};port={$myPort};dbname={$myDb};charset=utf8mb4", $myUser, $myPass, array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 15,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ));

            if ($action === 'test') {
                $actionResult = array(
                    'type' => 'test_success',
                    'message' => "Successfully connected to MySQL database '{$myDb}' on {$myHost}!"
                );
            } elseif ($action === 'install') {
                $sqlFile = $appRoot . '/schema-mysql.sql';
                if (!file_exists($sqlFile)) {
                    throw new Exception('schema-mysql.sql was not found in the application root.');
                }

                $content = file_get_contents($sqlFile);
                $statements = splitStatements($content);
                $executed = 0;
                $skipped = 0;
                $errors = array();

                foreach ($statements as $stmt) {
                    try {
                        $pdo->exec($stmt);
                        $executed++;
                    } catch (Exception $e) {
                        $msg = $e->getMessage();
                        if (stripos($msg, 'already exists') !== false || stripos($msg, 'Duplicate') !== false) {
                            $skipped++;
                        } else {
                            $errors[] = substr($stmt, 0, 80) . '... -> ' . $msg;
                        }
                    }
                }

                // Construct DATABASE_URL for MySQL
                $encodedPass = rawurlencode($myPass);
                $generatedUrl = "mysql://{$myUser}:{$encodedPass}@{$myHost}:{$myPort}/{$myDb}";

                // Optionally update .env
                $envUpdated = false;
                if (!empty($_POST['save_to_env']) && file_exists($appRoot . '/.env')) {
                    $envCurrent = file_get_contents($appRoot . '/.env');
                    if (preg_match('/^DATABASE_URL\s*=/m', $envCurrent)) {
                        $envNew = preg_replace('/^DATABASE_URL\s*=.*$/m', "DATABASE_URL=\"{$generatedUrl}\"", $envCurrent);
                    } else {
                        $envNew = $envCurrent . "\nDATABASE_URL=\"{$generatedUrl}\"\n";
                    }
                    @file_put_contents($appRoot . '/.env', $envNew);
                    $envUpdated = true;
                }

                $actionResult = array(
                    'type' => 'install_success',
                    'db_type' => 'MySQL / MariaDB',
                    'executed' => $executed,
                    'skipped' => $skipped,
                    'errors' => $errors,
                    'database_url' => $generatedUrl,
                    'env_updated' => $envUpdated,
                );
            }
        } elseif ($dbType === 'pgsql') {
            // PostgreSQL path (Neon)
            $pgUrl = trim($_POST['pgsql_url'] ?? '');
            if (empty($pgUrl)) {
                throw new Exception('PostgreSQL connection URL is required.');
            }

            if (!$hasPdoPgsql) {
                throw new Exception('PHP extension pdo_pgsql is not enabled on this server.');
            }

            // Normalise scheme
            $normUrl = preg_replace('/^postgresql:\/\//', 'postgres://', $pgUrl);
            $p = parse_url($normUrl);
            if (!isset($p['host'])) {
                throw new Exception('Invalid PostgreSQL DATABASE_URL format.');
            }
            $query = array();
            if (isset($p['query'])) { parse_str($p['query'], $query); }
            $pgDsn = 'pgsql:host=' . $p['host']
                . ';port=' . ($p['port'] ?? 5432)
                . ';dbname=' . ltrim($p['path'] ?? '/neondb', '/')
                . ';sslmode=' . ($query['sslmode'] ?? 'require');

            $pgUser = isset($p['user']) ? rawurldecode($p['user']) : '';
            $pgPass = isset($p['pass']) ? rawurldecode($p['pass']) : '';

            $pdo = new PDO($pgDsn, $pgUser, $pgPass, array(
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 20
            ));

            if ($action === 'test') {
                $actionResult = array(
                    'type' => 'test_success',
                    'message' => "Successfully connected to PostgreSQL (Neon) database on {$p['host']}!"
                );
            } elseif ($action === 'install') {
                $schemaFiles = array();
                if (!empty($_POST['run_schema'])) $schemaFiles[] = 'schema.sql';
                if (!empty($_POST['run_admin']))  $schemaFiles[] = 'admin-schema.sql';

                $executed = 0;
                $skipped = 0;
                $errors = array();

                foreach ($schemaFiles as $file) {
                    $path = $appRoot . '/' . $file;
                    if (!file_exists($path)) {
                        $errors[] = "File {$file} not found.";
                        continue;
                    }
                    foreach (splitStatements(file_get_contents($path)) as $stmt) {
                        try {
                            $pdo->exec($stmt);
                            $executed++;
                        } catch (Exception $e) {
                            $msg = $e->getMessage();
                            if (stripos($msg, 'already exists') !== false || stripos($msg, 'duplicate') !== false) {
                                $skipped++;
                            } else {
                                $errors[] = substr($stmt, 0, 80) . '... -> ' . $msg;
                            }
                        }
                    }
                }

                $envUpdated = false;
                if (!empty($_POST['save_to_env']) && file_exists($appRoot . '/.env')) {
                    $envCurrent = file_get_contents($appRoot . '/.env');
                    if (preg_match('/^DATABASE_URL\s*=/m', $envCurrent)) {
                        $envNew = preg_replace('/^DATABASE_URL\s*=.*$/m', "DATABASE_URL=\"{$pgUrl}\"", $envCurrent);
                    } else {
                        $envNew = $envCurrent . "\nDATABASE_URL=\"{$pgUrl}\"\n";
                    }
                    @file_put_contents($appRoot . '/.env', $envNew);
                    $envUpdated = true;
                }

                $actionResult = array(
                    'type' => 'install_success',
                    'db_type' => 'PostgreSQL (Neon)',
                    'executed' => $executed,
                    'skipped' => $skipped,
                    'errors' => $errors,
                    'database_url' => $pgUrl,
                    'env_updated' => $envUpdated,
                );
            }
        }
    } catch (Exception $e) {
        $actionError = $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Emporium Capitals — cPanel Database Installer</title>
    <style>
        :root {
            --bg: #060714;
            --card-bg: #0e1026;
            --border: rgba(255, 255, 255, 0.08);
            --accent: #ef4d45;
            --accent-glow: rgba(239, 77, 69, 0.2);
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
        .container { max-width: 760px; margin: 0 auto; }
        .header {
            text-align: center;
            margin-bottom: 32px;
        }
        .logo { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
        .logo span { color: var(--accent); }
        .subtitle { color: var(--text-dim); font-size: 14px; }
        .card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 28px;
            margin-bottom: 24px;
            box-shadow: 0 16px 32px rgba(0,0,0,0.3);
        }
        .badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
            text-transform: uppercase;
        }
        .badge.green { background: rgba(16,185,129,0.15); color: var(--success); border: 1px solid var(--success); }
        .badge.red   { background: rgba(239,77,69,0.15); color: var(--accent); border: 1px solid var(--accent); }
        .tabs {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }
        .tab-btn {
            flex: 1;
            padding: 12px;
            background: rgba(255,255,255,0.03);
            border: 1px solid var(--border);
            border-radius: 10px;
            color: var(--text);
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s;
        }
        .tab-btn.active {
            background: var(--accent-glow);
            border-color: var(--accent);
            color: #fff;
        }
        .field { margin-bottom: 16px; }
        label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-dim); }
        input[type="text"], input[type="password"], input[type="number"], select {
            width: 100%;
            padding: 10px 14px;
            background: #060714;
            border: 1px solid var(--border);
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
        }
        input:focus { outline: none; border-color: var(--accent); }
        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: var(--text);
            cursor: pointer;
            margin-bottom: 10px;
        }
        .btn-group { display: flex; gap: 12px; margin-top: 24px; }
        .btn {
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
        }
        .btn-primary { background: var(--accent); color: #fff; }
        .btn-primary:hover { background: #d93d35; }
        .btn-secondary { background: rgba(255,255,255,0.08); color: var(--text); }
        .btn-secondary:hover { background: rgba(255,255,255,0.12); }
        .alert {
            padding: 16px;
            border-radius: 10px;
            margin-bottom: 24px;
            font-size: 14px;
            line-height: 1.5;
        }
        .alert-success { background: rgba(16,185,129,0.1); border: 1px solid var(--success); color: #6ee7b7; }
        .alert-error   { background: rgba(239,77,69,0.1); border: 1px solid var(--accent); color: #fca5a5; }
        .info-box {
            background: rgba(255,255,255,0.02);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 13px;
            color: var(--text-dim);
            margin-bottom: 16px;
        }
    </style>
    <script>
        function selectDbTab(type) {
            document.getElementById('db_type_input').value = type;
            document.getElementById('tab_mysql').classList.toggle('active', type === 'mysql');
            document.getElementById('tab_pgsql').classList.toggle('active', type === 'pgsql');
            document.getElementById('section_mysql').style.display = type === 'mysql' ? 'block' : 'none';
            document.getElementById('section_pgsql').style.display = type === 'pgsql' ? 'block' : 'none';
        }
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Emporium<span>Capitals</span></div>
            <div class="subtitle">Universal cPanel Database Installation & Migration Manager</div>
        </div>

        <?php if ($actionError): ?>
            <div class="alert alert-error">
                <strong>Installation Error:</strong> <?= htmlspecialchars($actionError) ?>
            </div>
        <?php elseif ($actionResult): ?>
            <div class="alert alert-success">
                <?php if ($actionResult['type'] === 'test_success'): ?>
                    <strong>✓ Connection Confirmed:</strong> <?= htmlspecialchars($actionResult['message']) ?>
                <?php elseif ($actionResult['type'] === 'install_success'): ?>
                    <strong>✓ Database Installed Successfully!</strong><br>
                    Engine: <strong><?= htmlspecialchars($actionResult['db_type']) ?></strong><br>
                    Executed Statements: <strong><?= $actionResult['executed'] ?></strong> (<?= $actionResult['skipped'] ?> already existed)<br>
                    <?php if ($actionResult['env_updated']): ?>
                        ✓ <strong>.env</strong> file automatically updated with <code>DATABASE_URL</code>.<br>
                    <?php else: ?>
                        Configure this connection string in your <code>.env</code> file:<br>
                        <code><?= htmlspecialchars($actionResult['database_url']) ?></code><br>
                    <?php endif; ?>
                    <em>Default admin user created: <code>admin@emporiumcapitals.com</code> / password: <code>admin123</code></em>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="font-size: 16px;">Host Database Capabilities</h3>
                <div style="display: flex; gap: 8px;">
                    <span>MySQL / MariaDB: <span class="badge <?= $hasPdoMysql ? 'green' : 'red' ?>"><?= $hasPdoMysql ? 'Available' : 'Missing' ?></span></span>
                    <span>PostgreSQL: <span class="badge <?= $hasPdoPgsql ? 'green' : 'red' ?>"><?= $hasPdoPgsql ? 'Available' : 'Missing' ?></span></span>
                </div>
            </div>

            <form method="POST">
                <input type="hidden" name="token" value="<?= htmlspecialchars($token) ?>">
                <input type="hidden" id="db_type_input" name="db_type" value="mysql">

                <div class="tabs">
                    <div id="tab_mysql" class="tab-btn active" onclick="selectDbTab('mysql')">
                        cPanel Native MySQL / MariaDB (Recommended)
                    </div>
                    <div id="tab_pgsql" class="tab-btn" onclick="selectDbTab('pgsql')">
                        Neon Cloud PostgreSQL
                    </div>
                </div>

                <!-- MySQL Section -->
                <div id="section_mysql">
                    <div class="info-box">
                        Uses standard cPanel MySQL / MariaDB database. Create a database in <strong>cPanel &rarr; MySQL Database Wizard</strong> and enter the credentials below.
                    </div>
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                        <div class="field">
                            <label>MySQL Host</label>
                            <input type="text" name="mysql_host" value="127.0.0.1" required>
                        </div>
                        <div class="field">
                            <label>Port</label>
                            <input type="number" name="mysql_port" value="3306" required>
                        </div>
                    </div>
                    <div class="field">
                        <label>Database Name (e.g. cpaneluser_emporium)</label>
                        <input type="text" name="mysql_database" placeholder="cpaneluser_dbname" required>
                    </div>
                    <div class="field">
                        <label>Database Username</label>
                        <input type="text" name="mysql_username" placeholder="cpaneluser_dbuser" required>
                    </div>
                    <div class="field">
                        <label>Database Password</label>
                        <input type="password" name="mysql_password" placeholder="••••••••••••" required>
                    </div>
                </div>

                <!-- PostgreSQL Section -->
                <div id="section_pgsql" style="display: none;">
                    <div class="info-box">
                        Uses remote Neon PostgreSQL instance. Paste your full Neon connection string below.
                    </div>
                    <div class="field">
                        <label>Neon DATABASE_URL</label>
                        <input type="text" name="pgsql_url" value="<?= htmlspecialchars($envDbUrl) ?>" placeholder="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require">
                    </div>
                    <label class="checkbox-label">
                        <input type="checkbox" name="run_schema" value="1" checked>
                        Run core schema (schema.sql)
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="run_admin" value="1" checked>
                        Run admin schema (admin-schema.sql)
                    </label>
                </div>

                <div style="margin-top: 16px;">
                    <label class="checkbox-label">
                        <input type="checkbox" name="save_to_env" value="1" checked>
                        Automatically save DATABASE_URL to root <code>.env</code> file
                    </label>
                </div>

                <div class="btn-group">
                    <button type="submit" name="action" value="test" class="btn btn-secondary">
                        Test Connection
                    </button>
                    <button type="submit" name="action" value="install" class="btn btn-primary">
                        Run Installation & Migrations
                    </button>
                </div>
            </form>
        </div>

        <div style="text-align: center; color: var(--text-dim); font-size: 12px;">
            Security Notice: Please delete or disable <code>cpanelsetup/db-install.php</code> after initial database configuration.
        </div>
    </div>
</body>
</html>
