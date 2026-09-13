<?php
/**
 * Emporium Capitals — cPanel Mail & SMTP Diagnostic Tester
 *
 * NEW FILE. No existing project code is modified.
 *
 * Use this to verify email sending capabilities on your cPanel shared hosting.
 * Checks whether outbound SMTP ports (587, 465, 25) are blocked by host firewalls
 * and tests both SMTP and PHP mail().
 */

// Token gate: this page pre-fills SMTP/admin addresses from .env and can
// send mail + probe ports, so it must never be public. Set the token, pass
// ?token=... in the URL (carried into the form below), delete when done.
define('MAILTEST_TOKEN', 'change-me-to-a-long-random-string');
$__mailToken = isset($_GET['token']) ? $_GET['token'] : (isset($_POST['token']) ? $_POST['token'] : '');
if (!hash_equals(MAILTEST_TOKEN, $__mailToken) || MAILTEST_TOKEN === 'change-me-to-a-long-random-string') {
    http_response_code(403);
    exit('Forbidden. Set MAILTEST_TOKEN in cpanel/mail-test.php and pass ?token=...');
}

$appRoot = dirname(__DIR__);
$env = array();
if (file_exists($appRoot . '/.env')) {
    $lines = file($appRoot . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            $env[trim($key)] = trim($val, " \t\n\r\0\x0B\"'");
        }
    }
}

$smtpHost = $_POST['smtp_host'] ?? $env['SMTP_HOST'] ?? 'smtp.gmail.com';
$smtpPort = (int)($_POST['smtp_port'] ?? $env['SMTP_PORT'] ?? 587);
$smtpUser = $_POST['smtp_user'] ?? $env['SMTP_USER'] ?? '';
$smtpPass = $_POST['smtp_pass'] ?? $env['SMTP_PASSWORD'] ?? '';
$testRecipient = $_POST['recipient'] ?? $env['ADMIN_EMAIL'] ?? '';

$results = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $results = array();

    // 1. Test port socket connections
    $ports = array(587 => 'SMTP/TLS', 465 => 'SMTPS/SSL', 25 => 'Standard SMTP');
    $results['ports'] = array();

    foreach ($ports as $p => $label) {
        $prefix = ($p === 465) ? 'ssl://' : '';
        $fp = @fsockopen($prefix . $smtpHost, $p, $errno, $errstr, 5);
        if ($fp) {
            $response = fgets($fp, 512);
            fclose($fp);
            $results['ports'][$p] = array('status' => 'OPEN', 'response' => trim($response));
        } else {
            $results['ports'][$p] = array('status' => 'BLOCKED / CLOSED', 'error' => "$errstr (errno: $errno)");
        }
    }

    // 2. Test sending a message if requested
    if (!empty($_POST['send_test']) && !empty($testRecipient)) {
        // Test via PHP mail()
        $subject = 'Emporium Capitals cPanel Test Mail: ' . date('Y-m-d H:i:s');
        $message = "This is a diagnostic email sent from your Emporium Capitals deployment on cPanel shared hosting.\r\n\r\nIf you received this, mail delivery on your server is operational!";
        $headers = 'From: ' . ($smtpUser ? $smtpUser : 'noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost')) . "\r\n" .
                   'X-Mailer: PHP/' . phpversion();

        $phpMailSent = @mail($testRecipient, $subject, $message, $headers);
        $results['php_mail'] = array(
            'sent' => $phpMailSent,
            'recipient' => $testRecipient,
        );
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Emporium Capitals — Mail Diagnostics</title>
    <style>
        :root {
            --bg: #070913;
            --card-bg: #0d1024;
            --border: rgba(255, 255, 255, 0.08);
            --text: #f0f2ff;
            --text-dim: #8a92b2;
            --accent: #ef4d45;
            --success: #10b981;
            --warning: #f59e0b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background: var(--bg);
            color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 32px 16px;
            min-height: 100vh;
        }
        .container { max-width: 680px; margin: 0 auto; }
        .card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 24px;
        }
        h1 { font-size: 20px; margin-bottom: 8px; }
        h1 span { color: var(--accent); }
        p { color: var(--text-dim); font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
        label { display: block; font-size: 13px; font-weight: 600; margin: 16px 0 6px; }
        input[type="text"], input[type="password"] {
            width: 100%;
            background: #04050d;
            border: 1px solid var(--border);
            padding: 12px;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
        }
        .btn {
            background: var(--accent);
            color: #fff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 20px;
        }
        .btn:hover { opacity: 0.9; }
        .result-box {
            background: #04050d;
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 16px;
            margin-top: 20px;
        }
        .port-status {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 14px;
        }
        .status-open { color: var(--success); font-weight: bold; }
        .status-blocked { color: var(--accent); font-weight: bold; }
        .hint {
            background: rgba(239, 77, 69, 0.1);
            border: 1px solid rgba(239, 77, 69, 0.3);
            border-radius: 8px;
            padding: 14px;
            margin-top: 20px;
            font-size: 13px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="card">
        <h1>Emporium<span>Capitals</span> &mdash; Mail Diagnostics</h1>
        <p>Test outbound SMTP socket connectivity and email delivery on your cPanel server.</p>

        <form method="post">
            <input type="hidden" name="token" value="<?php echo htmlspecialchars($__mailToken); ?>">
            <label>SMTP Host</label>
            <input type="text" name="smtp_host" value="<?php echo htmlspecialchars($smtpHost); ?>" required>

            <div style="display: flex; gap: 16px;">
                <div style="flex: 1;">
                    <label>Default Port</label>
                    <input type="text" name="smtp_port" value="<?php echo htmlspecialchars($smtpPort); ?>" required>
                </div>
                <div style="flex: 2;">
                    <label>Test Recipient Email</label>
                    <input type="text" name="recipient" value="<?php echo htmlspecialchars($testRecipient); ?>" placeholder="you@example.com">
                </div>
            </div>

            <div style="margin-top: 16px;">
                <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" name="send_test" value="1" checked> Send a test email via PHP mail()
                </label>
            </div>

            <button type="submit" class="btn">Run Diagnostic Check</button>
        </form>

        <?php if ($results): ?>
            <div class="result-box">
                <h3 style="font-size: 15px; margin-bottom: 12px;">Port Connectivity Test Results:</h3>
                <?php foreach ($results['ports'] as $p => $info): ?>
                    <div class="port-status">
                        <span>Port <?php echo $p; ?> (<?php echo htmlspecialchars($smtpHost); ?>):</span>
                        <span class="<?php echo $info['status'] === 'OPEN' ? 'status-open' : 'status-blocked'; ?>">
                            <?php echo htmlspecialchars($info['status']); ?>
                        </span>
                    </div>
                <?php endforeach; ?>

                <?php if (isset($results['php_mail'])): ?>
                    <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border);">
                        <h4 style="font-size: 14px; margin-bottom: 6px;">PHP mail() Dispatch:</h4>
                        <?php if ($results['php_mail']['sent']): ?>
                            <div style="color: var(--success); font-size: 13px;">
                                &#10003; Message accepted by local mail agent for delivery to <?php echo htmlspecialchars($results['php_mail']['recipient']); ?>. (Check inbox / spam).
                            </div>
                        <?php else: ?>
                            <div style="color: var(--accent); font-size: 13px;">
                                &#10007; PHP mail() returned false. Check cPanel Email Deliverability / sendmail path.
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
            </div>

            <div class="hint">
                <strong>Important note for cPanel shared hosting:</strong>
                If port 587 or 465 is reported as <code>BLOCKED</code>, your shared host firewall prevents outgoing connections. You may need to ask your host to whitelist outbound SMTP or use your cPanel webmail account (e.g. <code>mail.yourdomain.com</code> on port 465 SSL).
            </div>
        <?php endif; ?>
    </div>
</div>
</body>
</html>
