<?php
/**
 * Emporium Capitals — Browser Database Installer for Neon PostgreSQL
 *
 * NEW FILE. No existing project code is modified.
 *
 * cPanel shared hosting rarely offers SSH/psql, so this script runs
 * schema.sql + admin-schema.sql from the browser via PDO (pgsql driver).
 *
 * Usage:
 *   1. Set SETUP_TOKEN below or set CPANEL_SETUP_TOKEN in .env.
 *   2. Visit https://yourdomain.com/cpanel/db-install.php?token=YOUR_TOKEN
 *   3. Confirm your Neon DATABASE_URL, tick both schema files, click Install.
 *   4. DELETE THIS FILE when finished.
 */

$appRoot = dirname(__DIR__);

define('DEFAULT_SETUP_TOKEN', 'change-me-to-a-long-random-string');
$setupToken = DEFAULT_SETUP_TOKEN;

// Attempt to read from .env if present
$envDbUrl = '';
if (file_exists($appRoot . '/.env')) {
    $envContent = file_get_contents($appRoot . '/.env');
    if (preg_match('/^CPANEL_SETUP_TOKEN\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $m)) {
        $setupToken = trim($m[1]);
    }
    if (preg_match('/^DATABASE_URL\s*=\s*["\']?([^"\'\r\n]+)/m', $envContent, $m)) {
        $envDbUrl = trim($m[1]);
    }
}

$token = isset($_GET['token']) ? $_GET['token'] : (isset($_POST['token']) ? $_POST['token'] : '');
if (empty($token) || $setupToken === DEFAULT_SETUP_TOKEN || !hash_equals($setupToken, $token)) {
    http_response_code(403);
    ?>
    <!DOCTYPE html>
    <html>
    <head><title>Access Forbidden</title><style>body{background:#0a0a1a;color:#fff;font-family:sans-serif;padding:50px;text-align:center;}</style></head>
    <body>
        <h2>403 &mdash; Installer Access Forbidden</h2>
        <p>Set a secure <code>CPANEL_SETUP_TOKEN</code> in your <code>.env</code> file or edit <code>cpanel/db-install.php</code>, then pass <code>?token=YOUR_TOKEN</code> in the URL.</p>
    </body>
    </html>
    <?php
    exit;
}

require_once __DIR__ . '/sql-splitter.php';

/** Parse a postgresql:// or postgres:// URL into a PDO DSN */
function pdoDsn($url) {
    // Normalise scheme
    $url = preg_replace('/^postgresql:\/\//', 'postgres://', $url);
    $p = parse_url($url);
    if (!isset($p['host'])) { return null; }
    $query = array();
    if (isset($p['query'])) { parse_str($p['query'], $query); }
    $dsn = 'pgsql:host=' . $p['host']
        . ';port=' . (isset($p['port']) ? $p['port'] : 5432)
        . ';dbname=' . ltrim(isset($p['path']) ? $p['path'] : '/neondb', '/');
    $dsn .= ';sslmode=' . (isset($query['sslmode']) ? $query['sslmode'] : 'require');
    return array($dsn, isset($p['user']) ? rawurldecode($p['user']) : '', isset($p['pass']) ? rawurldecode($p['pass']) : '');
}

$report = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $dbUrl = trim(isset($_POST['database_url']) ? $_POST['database_url'] : '');
    $files = array();
    if (!empty($_POST['run_schema'])) { $files[] = 'schema.sql'; }
    if (!empty($_POST['run_admin'])) { $files[] = 'admin-schema.sql'; }

    $report = array('ok' => 0, 'failed' => 0, 'errors' => array(), 'files' => $files);
    try {
        if (!extension_loaded('pdo_pgsql')) {
            throw new Exception('PHP extension pdo_pgsql is not enabled on this server. Please enable it in cPanel > "Select PHP Version" > Extensions, or run your SQL files via Neon web console.');
        }
        $parsed = pdoDsn($dbUrl);
        if ($parsed === null) { throw new Exception('DATABASE_URL is not a valid postgresql:// or postgres:// connection string.'); }
        list($dsn, $user, $pass) = $parsed;
        $pdo = new PDO($dsn, $user, $pass, array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 20
        ));

        foreach ($files as $file) {
            $path = $appRoot . '/' . $file;
            if (!is_file($path)) {
                $report['failed']++;
                $report['errors'][] = $file . ': file not found on server.';
                continue;
            }
            foreach (splitStatements(file_get_contents($path)) as $n => $stmt) {
                try {
                    $pdo->exec($stmt);
                    $report['ok']++;
                } catch (Exception $e) {
                    // Ignore benign "already exists" errors
                    if (strpos($e->getMessage(), 'already exists') === false) {
                        $report['failed']++;
                        $report['errors'][] = $file . ' #' . ($n + 1) . ': ' . $e->getMessage();
                    } else {
                        $report['ok']++;
                    }
                }
            }
        }
        $tables = $pdo->query(
            "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1"
        )->fetchAll(PDO::FETCH_COLUMN);
        $report['tables'] = $tables;
    } catch (Exception $e) {
        $report['failed']++;
        $report['errors'][] = 'Connection Error: ' . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Emporium Capitals — Database Installer</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;background:#080a18;color:#fff;margin:0;padding:32px 16px}
.card{max-width:640px;margin:0 auto;background:#0e1026;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.5)}
h1{font-size:22px;margin:0 0 8px}h1 span{color:#ef4d45}
p{color:rgba(255,255,255,.65);font-size:14px;line-height:1.6}
label{display:block;font-size:13px;font-weight:600;margin:18px 0 6px}
input[type=text],input[type=password]{width:100%;box-sizing:border-box;padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#04050e;color:#fff;font-size:14px}
.check{margin:12px 0;font-size:14px}
button{background:#ef4d45;color:#fff;border:0;border-radius:8px;padding:14px 28px;font-size:14px;font-weight:700;cursor:pointer;margin-top:16px;transition:opacity .2s}
button:hover{opacity:.9}
.ok{color:#34d399;font-weight:bold}.err{color:#f87171;font-size:13px}
pre{background:#04050e;border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:12px;font-size:12px;overflow:auto;max-height:260px;color:#cbd5e1}
.warn{background:rgba(239,77,69,.12);border:1px solid rgba(239,77,69,.4);border-radius:8px;padding:12px;font-size:13px;margin-top:20px;line-height:1.5}
.badge-tbl{display:inline-block;background:rgba(255,255,255,.06);padding:3px 8px;border-radius:4px;margin:2px;font-size:12px;font-family:monospace}
</style>
</head>
<body>
<div class="card">
<h1>Emporium<span>Capitals</span> &mdash; Database Setup</h1>
<p>Executes <code>schema.sql</code> and <code>admin-schema.sql</code> directly onto your Neon PostgreSQL database over secure SSL.</p>

<?php if ($report !== null): ?>
  <p class="<?php echo $report['failed'] ? 'err' : 'ok'; ?>" style="font-size: 16px; margin: 16px 0;">
    <?php echo $report['failed'] === 0 ? '&#10003; Installation Complete!' : '&#9888; Completed with notices'; ?> &mdash;
    <?php echo (int) $report['ok']; ?> statements applied, <?php echo (int) $report['failed']; ?> failed.
  </p>
  <?php if (!empty($report['tables'])): ?>
    <div style="margin: 16px 0;">
        <strong>Verified tables in database:</strong><br>
        <div style="margin-top: 8px;">
            <?php foreach ($report['tables'] as $tbl): ?>
                <span class="badge-tbl"><?php echo htmlspecialchars($tbl); ?></span>
            <?php endforeach; ?>
        </div>
    </div>
  <?php endif; ?>
  <?php if (!empty($report['errors'])): ?><pre><?php echo htmlspecialchars(implode("\n", $report['errors'])); ?></pre><?php endif; ?>
  <div class="warn">
    <strong>Security Recommendation:</strong> If all tables were created successfully, <strong>delete <code>cpanel/db-install.php</code></strong> from your server now.
  </div>
  <div style="margin-top: 20px;">
    <a href="manager.php" style="color: #ef4d45; text-decoration: none; font-weight: 600;">&larr; Return to Server Manager</a>
  </div>
<?php else: ?>
  <form method="post">
    <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
    <label>Neon PostgreSQL DATABASE_URL</label>
    <input type="text" name="database_url" value="<?php echo htmlspecialchars($envDbUrl); ?>" placeholder="postgresql://neondb_owner:...@ep-....neon.tech/neondb?sslmode=require" required>
    <div class="check"><label><input type="checkbox" name="run_schema" checked> schema.sql (users, trades, transactions, KYC, etc.)</label></div>
    <div class="check"><label><input type="checkbox" name="run_admin" checked> admin-schema.sql (admin users, logs, settings, wallets, etc.)</label></div>
    <button type="submit">Run Database Migration</button>
  </form>
  <div class="warn">
    All statements are idempotent (safe to run multiple times). Delete this file after database tables are initialized.
  </div>
<?php endif; ?>
</div>
</body>
</html>
