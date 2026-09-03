import nodemailer from 'nodemailer';

const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
};

const adminEmail = process.env.ADMIN_EMAIL || 'jmauricennadi@gmail.com';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getTransporter() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        throw new Error('SMTP credentials not set. Please configure SMTP_USER and SMTP_PASSWORD in .env');
    }
    return nodemailer.createTransport(smtpConfig);
}

export async function sendEmail({ to, subject, html }) {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || '"Emporium Capitals" <noreply@emporiumcapitals.com>';
    try {
        const info = await transporter.sendMail({ from, to, subject, html });
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

function wrapEmail({ title, subtitle, statusBadge, content, button, footerNote }) {
    const badgeHtml = statusBadge
        ? `<tr><td style="padding:0 0 24px;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${statusBadge.color};color:#fff;font-size:12px;font-weight:700;padding:6px 16px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;">${statusBadge.text}</td></tr></table></td></tr>`
        : '';

    const buttonHtml = button
        ? `<tr><td style="padding:0 0 24px;"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${button.color || '#ef4d45'};border-radius:8px;"><a href="${button.url}" target="_blank" style="display:inline-block;padding:14px 32px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">${button.text}</a></td></tr></table></td></tr>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a1a;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

<!-- Logo -->
<tr><td style="padding:0 0 32px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
<td style="background:linear-gradient(135deg,#ef4d45,#8c0030);width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;">
<span style="color:#fff;font-size:20px;font-weight:900;line-height:44px;">E</span>
</td>
<td style="padding-left:12px;">
<span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Emporium Capitals</span>
</td>
</tr></table>
</td></tr>

<!-- Card -->
<tr><td style="background:#111127;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:40px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">

<!-- Title -->
<tr><td style="padding:0 0 8px;">
<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">${title}</h1>
</td></tr>

${subtitle ? `<tr><td style="padding:0 0 28px;"><p style="margin:0;color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;">${subtitle}</p></td></tr>` : '<tr><td style="padding:0 0 28px;"></td></tr>'}

${badgeHtml}

${content}

${buttonHtml}

</table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:28px 0 0;text-align:center;">
<p style="margin:0;color:rgba(255,255,255,0.25);font-size:12px;line-height:1.6;">
${footerNote || 'Emporium Capitals — Premium Crypto Investment Platform'}
<br><a href="${appUrl}" style="color:rgba(255,255,255,0.35);text-decoration:none;">emporiumcapitals.com</a> &nbsp;·&nbsp;
<a href="mailto:support@emporiumcapitals.com" style="color:rgba(255,255,255,0.35);text-decoration:none;">Support</a>
</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function dataRow(label, value, options = {}) {
    const color = options.color || 'rgba(255,255,255,0.9)';
    const mono = options.mono ? 'font-family:monospace;font-size:13px;word-break:break-all;' : '';
    return `<tr>
<td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);font-size:13px;font-weight:600;width:40%;vertical-align:top;">${label}</td>
<td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:${color};font-size:14px;font-weight:500;${mono}">${value}</td>
</tr>`;
}

function textBlock(text) {
    return `<tr><td style="padding:0 0 16px;"><p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;">${text}</p></td></tr>`;
}

function divider() {
    return `<tr><td style="padding:20px 0 4px;"><div style="border-top:1px solid rgba(255,255,255,0.06);"></div></td></tr>`;
}

// ─── Email Functions ──────────────────────────────────────────

export async function sendVerificationEmail(email, name, token) {
    const url = `${appUrl}/api/auth/verify-email?token=${token}`;
    const html = wrapEmail({
        title: 'Verify your email',
        subtitle: `Hi ${name || 'there'}, thanks for signing up. Confirm your email to get started.`,
        content: `
            ${textBlock('Click the button below to verify your email address. This link expires in 24 hours.')}
        `,
        button: { text: 'Verify Email Address', url, color: '#ef4d45' },
        footerNote: 'If you didn\'t create an account, you can safely ignore this email.'
    });
    return sendEmail({ to: email, subject: 'Verify Your Email — Emporium Capitals', html });
}

export async function sendWelcomeEmail(email, name) {
    const html = wrapEmail({
        title: 'Welcome aboard!',
        subtitle: `Hi ${name}, your account is now active. Start exploring the platform.`,
        statusBadge: { text: 'Account Active', color: '#16a34a' },
        content: textBlock('You can now deposit funds, explore investment plans, and start trading. Your dashboard is ready.'),
        button: { text: 'Go to Dashboard', url: `${appUrl}/dashboard`, color: '#ef4d45' }
    });
    return sendEmail({ to: email, subject: 'Welcome to Emporium Capitals!', html });
}

export async function sendAdminNotification(email, name, username) {
    const html = wrapEmail({
        title: 'New User Registration',
        subtitle: 'A new user has joined the platform.',
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Name', name)}
${dataRow('Username', `@${username}`)}
${dataRow('Email', email)}
${dataRow('Date', new Date().toLocaleString())}
</table>`,
        footerNote: 'Emporium Capitals — Admin Alert System'
    });
    return sendEmail({ to: adminEmail, subject: `New Registration: ${username}`, html });
}

export async function sendAdminAlertEmail(user) {
    const html = wrapEmail({
        title: 'New User Registered',
        subtitle: 'A new account was created on the platform.',
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Name', user.name)}
${dataRow('Email', user.email)}
${dataRow('Username', `@${user.username}`)}
${dataRow('Phone', user.phone || 'N/A')}
${dataRow('Referrer', user.referrer || 'None')}
</table>`,
        footerNote: 'Emporium Capitals — Admin Alert System'
    });
    return sendEmail({ to: adminEmail, subject: `[Alert] New User: ${user.username}`, html });
}

export async function sendPasswordResetEmail(email, name, resetToken) {
    const url = `${appUrl}/reset-password?token=${resetToken}`;
    const html = wrapEmail({
        title: 'Reset your password',
        subtitle: `Hi ${name || 'there'}, we received a password reset request for your account.`,
        content: textBlock('Click the button below to set a new password. This link expires in 1 hour.'),
        button: { text: 'Reset Password', url, color: '#ef4d45' },
        footerNote: 'If you didn\'t request this, ignore this email — your password won\'t change.'
    });
    return sendEmail({ to: email, subject: 'Password Reset — Emporium Capitals', html });
}

export async function sendDepositEmail({ to, name, amount, method, reference, status = 'pending' }) {
    const statusColors = { approved: '#16a34a', pending: '#f59e0b', rejected: '#dc2626', initiated: '#3b82f6' };
    const statusLabels = { approved: 'Confirmed', pending: 'Pending', rejected: 'Rejected', initiated: 'Initiated' };
    const html = wrapEmail({
        title: `Deposit ${statusLabels[status] || status}`,
        subtitle: `Hi ${name || 'there'}, your deposit has been ${statusLabels[status]?.toLowerCase() || status}.`,
        statusBadge: { text: statusLabels[status] || status, color: statusColors[status] || '#6b7280' },
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Amount', `$${Number(amount).toFixed(2)}`, { color: '#ffffff' })}
${dataRow('Method', method)}
${dataRow('Reference', reference, { mono: true })}
${dataRow('Status', (statusLabels[status] || status), { color: statusColors[status] || '#fff' })}
</table>`,
        button: { text: 'View Dashboard', url: `${appUrl}/dashboard`, color: '#ef4d45' },
        footerNote: 'If you did not make this deposit, contact support immediately.'
    });
    const subj = status === 'approved'
        ? `Deposit Confirmed — $${Number(amount).toFixed(2)} credited`
        : `Deposit ${statusLabels[status] || status} — $${Number(amount).toFixed(2)}`;
    return sendEmail({ to, subject: subj, html });
}

export async function sendWithdrawalEmail({ to, name, amount, walletAddress, network, status }) {
    const statusColors = { approved: '#16a34a', pending: '#f59e0b', rejected: '#dc2626' };
    const statusLabels = { approved: 'Approved', pending: 'Pending', rejected: 'Rejected' };
    const html = wrapEmail({
        title: `Withdrawal ${statusLabels[status] || status}`,
        subtitle: `Hi ${name || 'there'}, your withdrawal request has been ${statusLabels[status]?.toLowerCase() || status}.`,
        statusBadge: { text: statusLabels[status] || status, color: statusColors[status] || '#6b7280' },
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Amount', `$${Number(amount).toFixed(2)}`, { color: '#ffffff' })}
${dataRow('Network', network || 'Bitcoin')}
${dataRow('Address', walletAddress, { mono: true })}
</table>`,
        footerNote: status === 'approved' ? 'Funds will arrive within 24–48 hours.' : 'You\'ll receive an email once processed.'
    });
    return sendEmail({ to, subject: `Withdrawal ${statusLabels[status] || status} — $${Number(amount).toFixed(2)}`, html });
}

export async function sendSwapEmail({ to, name, fromAsset, toAsset, fromAmount, toAmount, rate, fee, status }) {
    const html = wrapEmail({
        title: `Swap ${status === 'completed' ? 'Completed' : status}`,
        subtitle: `Hi ${name || 'there'}, your asset swap has been ${status}.`,
        statusBadge: { text: status, color: status === 'completed' ? '#16a34a' : '#f59e0b' },
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('From', `${Number(fromAmount).toFixed(6)} ${fromAsset}`)}
${dataRow('To', `${Number(toAmount).toFixed(6)} ${toAsset}`, { color: '#16a34a' })}
${dataRow('Rate', `1 ${fromAsset} ≈ ${Number(rate).toFixed(6)} ${toAsset}`)}
${dataRow('Fee', `${Number(fee).toFixed(6)} ${fromAsset}`)}
</table>`,
        button: { text: 'View Swap History', url: `${appUrl}/swap`, color: '#ef4d45' }
    });
    return sendEmail({ to, subject: `Swap ${fromAsset} → ${toAsset} — ${status}`, html });
}

export async function sendTradeEmail({ to, name, asset, type, amount, entryPrice, status }) {
    const isWin = status === 'closed' || status === 'won';
    const html = wrapEmail({
        title: `Trade ${status === 'open' ? 'Opened' : status === 'closed' ? 'Closed' : status}`,
        subtitle: `Hi ${name || 'there'}, your ${type.toUpperCase()} position on ${asset} is now ${status}.`,
        statusBadge: {
            text: status === 'open' ? 'Position Open' : status === 'closed' ? 'Position Closed' : status,
            color: status === 'open' ? '#3b82f6' : isWin ? '#16a34a' : '#f59e0b'
        },
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Asset', asset, { color: '#ffffff' })}
${dataRow('Direction', type.toUpperCase())}
${dataRow('Amount', `$${Number(amount).toFixed(2)}`, { color: '#ffffff' })}
${dataRow('Entry Price', `$${Number(entryPrice).toFixed(2)}`)}
</table>`,
        button: { text: 'View Trading', url: `${appUrl}/trading`, color: '#ef4d45' }
    });
    return sendEmail({ to, subject: `Trade ${type.toUpperCase()} ${asset} — $${Number(amount).toFixed(2)}`, html });
}

export async function sendInvestmentEmail({ to, name, planName, amount, percentage, duration }) {
    const expectedProfit = (Number(amount) * Number(percentage) / 100).toFixed(2);
    const html = wrapEmail({
        title: 'Investment Started',
        subtitle: `Hi ${name || 'there'}, your investment is now active and generating returns.`,
        statusBadge: { text: 'Active', color: '#16a34a' },
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Plan', `${planName} — ${percentage}%`)}
${dataRow('Amount', `$${Number(amount).toFixed(2)}`, { color: '#ffffff' })}
${dataRow('Duration', duration)}
${dataRow('Expected Profit', `$${expectedProfit}`, { color: '#16a34a' })}
</table>`,
        button: { text: 'View Investments', url: `${appUrl}/investment-history`, color: '#ef4d45' }
    });
    return sendEmail({ to, subject: `Investment Active — ${planName} $${Number(amount).toFixed(2)}`, html });
}

export async function sendNotificationEmail({ to, name, title, message }) {
    const html = wrapEmail({
        title,
        subtitle: `Hi ${name || 'there'}, here's an update from your account.`,
        content: textBlock(message),
        button: { text: 'View Dashboard', url: `${appUrl}/dashboard`, color: '#ef4d45' },
        footerNote: 'You can manage notification preferences in Settings.'
    });
    return sendEmail({ to, subject: title, html });
}

export async function sendKycSubmittedToUser({ to, name }) {
    const html = wrapEmail({
        title: 'KYC Submitted',
        subtitle: `Hi ${name || 'there'}, your identity verification is now under review.`,
        statusBadge: { text: 'Under Review', color: '#f59e0b' },
        content: `${textBlock('Our team will review your documents within 24 hours. You\'ll receive an email once verified.')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Submitted', new Date().toLocaleString())}
${dataRow('Estimated Review', 'Within 24 hours')}
</table>`,
        footerNote: 'You can track your verification status on your profile page.'
    });
    return sendEmail({ to, subject: 'KYC Submitted — Under Review', html });
}

export async function sendKycSubmittedToAdmin(user, kyc) {
    const html = wrapEmail({
        title: 'New KYC Submission',
        subtitle: 'A user has submitted identity documents for verification.',
        statusBadge: { text: 'Action Required', color: '#ef4d45' },
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('User', `${user.name} (@${user.username})`)}
${dataRow('Email', user.email)}
${dataRow('ID Type', `${kyc.id_type} — ${kyc.id_number}`)}
${dataRow('Location', `${kyc.country} / ${kyc.city}`)}
${dataRow('Date of Birth', kyc.date_of_birth)}
${dataRow('Submitted', new Date().toLocaleString())}
</table>`,
        button: { text: 'Review KYC', url: `${appUrl}/admin/kyc`, color: '#ef4d45' },
        footerNote: 'Review and approve/reject from the admin panel.'
    });
    return sendEmail({ to: adminEmail, subject: `[KYC] ${user.username} — New Submission`, html });
}

export async function sendKycApprovedToUser({ to, name }) {
    const html = wrapEmail({
        title: 'KYC Verified',
        subtitle: `Hi ${name || 'there'}, your identity has been verified. Your account is now fully verified.`,
        statusBadge: { text: 'Verified', color: '#16a34a' },
        content: `${textBlock('You now have full access to all platform features:')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Withdrawal Limits', 'Unlocked')}
${dataRow('Trading Access', 'Full')}
${dataRow('Profile Status', 'Locked (security)')}
</table>`,
        button: { text: 'Go to Dashboard', url: `${appUrl}/dashboard`, color: '#16a34a' },
        footerNote: 'Your profile details are now locked for security. Contact support to make changes.'
    });
    return sendEmail({ to, subject: 'KYC Verified — Emporium Capitals', html });
}

export async function sendKycRejectedToUser({ to, name, reason }) {
    const html = wrapEmail({
        title: 'KYC Requires Update',
        subtitle: `Hi ${name || 'there'}, your identity verification needs attention.`,
        statusBadge: { text: 'Rejected', color: '#dc2626' },
        content: `${textBlock(`<strong style="color:#dc2626;">Reason:</strong> ${reason || 'Documents unclear or mismatched. Please resubmit with clear photos.'}`)}
${textBlock('Please correct the issue and resubmit from your profile page.')}`,
        button: { text: 'Resubmit KYC', url: `${appUrl}/profile`, color: '#ef4d45' },
        footerNote: 'If you believe this is an error, contact our support team.'
    });
    return sendEmail({ to, subject: 'KYC Requires Update — Emporium Capitals', html });
}

export async function sendKycPendingReminder({ to, name }) {
    const html = wrapEmail({
        title: 'Complete Your KYC',
        subtitle: `Hi ${name || 'there'}, your identity verification is still pending.`,
        statusBadge: { text: 'Pending', color: '#f59e0b' },
        content: textBlock('Completing KYC unlocks higher withdrawal limits and full platform access. It only takes a few minutes.'),
        button: { text: 'Complete KYC', url: `${appUrl}/profile`, color: '#f59e0b' }
    });
    return sendEmail({ to, subject: 'Complete Your KYC — Emporium Capitals', html });
}

export async function sendWalletConnectEmailToUser(email, username, walletType, connectionMethod) {
    const html = wrapEmail({
        title: 'Wallet Connection Submitted',
        subtitle: `Hi ${username}, your wallet connection request is being reviewed.`,
        statusBadge: { text: 'Pending Verification', color: '#f59e0b' },
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Wallet Type', walletType)}
${dataRow('Connection Method', connectionMethod)}
${dataRow('Status', 'Pending Verification', { color: '#f59e0b' })}
</table>`,
        button: { text: 'View Dashboard', url: `${appUrl}/dashboard`, color: '#ef4d45' },
        footerNote: 'You\'ll receive an email once verification is complete.'
    });
    return sendEmail({ to: email, subject: 'Wallet Connection — Emporium Capitals', html });
}

export async function sendWalletConnectEmailToAdmin(userEmail, username, walletType, connectionMethod) {
    const html = wrapEmail({
        title: 'New Wallet Connection',
        subtitle: 'A user has submitted a wallet for verification.',
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('User', `@${username}`)}
${dataRow('Email', userEmail)}
${dataRow('Wallet Type', walletType)}
${dataRow('Method', connectionMethod)}
</table>`,
        footerNote: 'Emporium Capitals — Admin Alert System'
    });
    return sendEmail({ to: adminEmail, subject: `[Wallet] ${username} — Connection Request`, html });
}

export function safeSend(promise) {
    promise.catch(e => console.error('Email send failed (non-blocking):', e.message));
}
