import nodemailer from 'nodemailer';
import { logger } from './logger';
import { getSiteSettings, getPublicSiteUrl } from './settings';

const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
};

const adminEmail = process.env.ADMIN_EMAIL || 'jmauricennadi@gmail.com';

export { getPublicSiteUrl };

export function getAppBaseUrl() {
    const candidate = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    if (candidate && !candidate.includes('localhost') && !candidate.includes('127.0.0.1')) {
        return candidate.replace(/\/+$/, '');
    }
    return 'https://emporiumcapitals.com';
}

function getTransporter() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        throw new Error('SMTP credentials not set. Please configure SMTP_USER and SMTP_PASSWORD in .env');
    }
    return nodemailer.createTransport(smtpConfig);
}

export async function sendEmail({ to, subject, html, fromName }) {
    const transporter = getTransporter();
    const settings = await getSiteSettings();
    const siteName = fromName || settings.site_name || 'Emporium Capitals';
    const siteUrl = await getPublicSiteUrl();
    let domain = 'emporiumcapitals.com';
    try { domain = new URL(siteUrl).hostname; } catch (e) {}

    const from = process.env.SMTP_FROM || `"${siteName}" <noreply@${domain}>`;
    try {
        const info = await transporter.sendMail({ from, to, subject, html });
        return info;
    } catch (error) {
        logger.error('email send failed', { to, subject, code: error?.code });
        throw error;
    }
}

function wrapEmail({ title, subtitle, statusBadge, content, button, footerNote, settings = {}, siteUrl = 'https://emporiumcapitals.com' }) {
    const siteName = settings.site_name || 'Emporium Capitals';
    const supportEmail = settings.support_email || 'support@' + (siteUrl.replace(/^https?:\/\//, '').split('/')[0] || 'emporiumcapitals.com');
    const tagline = settings.site_tagline || 'Premium Crypto Investment Platform';
    const emailDisclaimer = settings.disclaimer_email || 'Trading digital assets involves substantial risk. Never invest capital you cannot afford to lose.';
    const logoUrl = settings.site_logo ? (settings.site_logo.startsWith('http') ? settings.site_logo : `${siteUrl}${settings.site_logo}`) : `${siteUrl}/assets/logo.png`;

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

<!-- Logo & Header -->
<tr><td style="padding:0 0 32px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
<td style="vertical-align:middle;text-align:center;">
<a href="${siteUrl}" target="_blank" style="text-decoration:none;color:#ffffff;display:inline-flex;align-items:center;gap:12px;">
<img src="${logoUrl}" alt="${siteName}" height="42" style="max-height:42px;width:auto;vertical-align:middle;border:0;display:inline-block;" onerror="this.style.display='none'" />
<span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;vertical-align:middle;margin-left:8px;">${siteName}</span>
</a>
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

<!-- Security & Anti-Impersonation Advisory -->
<tr><td style="padding:28px 0 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(239,77,69,0.06);border:1px solid rgba(239,77,69,0.25);border-radius:12px;padding:16px;">
<tr><td>
<p style="margin:0 0 8px;color:#ef4d45;font-size:12px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">
🛡️ Official Security & Anti-Impersonation Warning
</p>
<p style="margin:0 0 12px;color:rgba(255,255,255,0.8);font-size:11px;line-height:1.6;">
Official communications from <strong>${siteName}</strong> are sent solely through our verified portal at <a href="${siteUrl}" style="color:#ef4d45;text-decoration:underline;">${siteUrl.replace(/^https?:\/\//, '')}</a>. Our staff or account managers will <strong>NEVER</strong> contact you via social media or messaging apps requesting passwords, 2FA codes, or private wallet phrases.
</p>
<div style="border-top:1px solid rgba(255,255,255,0.08);margin:10px 0;"></div>
<p style="margin:0 0 6px;color:#f59e0b;font-size:12px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">
⚠️ Risk & Compliance Disclaimer
</p>
<p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;line-height:1.6;">
${emailDisclaimer}
</p>
</td></tr>
</table>
</td></tr>

</table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:28px 0 0;text-align:center;">
<p style="margin:0;color:rgba(255,255,255,0.35);font-size:12px;line-height:1.6;">
${footerNote || `${siteName} — ${tagline}`}
<br>Official Portal: <a href="${siteUrl}" style="color:#ef4d45;text-decoration:none;">${siteUrl}</a> &nbsp;·&nbsp;
<a href="mailto:${supportEmail}" style="color:rgba(255,255,255,0.5);text-decoration:none;">${supportEmail}</a>
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

export async function sendVerificationEmail(email, name, token, reqOrUrl = null) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';
    const url = `${siteUrl}/api/auth/verify-email?token=${token}`;

    const html = wrapEmail({
        title: 'Verify your email address',
        subtitle: `Hi ${name || 'there'}, thank you for joining ${siteName}. Please confirm your email address to activate your account.`,
        content: `
            ${textBlock('Click the button below to verify your email address. For your security, this verification link will expire in 24 hours.')}
        `,
        button: { text: 'Activate Account', url, color: '#ef4d45' },
        footerNote: 'If you did not sign up for this account, you can safely disregard this email.',
        settings,
        siteUrl
    });

    return sendEmail({
        to: email,
        subject: `Verify Your Email — ${siteName}`,
        html,
        fromName: siteName
    });
}

export async function sendWelcomeEmail(email, name, reqOrUrl = null) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

    const html = wrapEmail({
        title: 'Welcome aboard!',
        subtitle: `Hi ${name}, your account is now fully active.`,
        statusBadge: { text: 'Account Active', color: '#16a34a' },
        content: textBlock(`Your ${siteName} account has been activated. You can now deposit funds, explore investment packages, and start crypto trading from your personal dashboard.`),
        button: { text: 'Go to Dashboard', url: `${siteUrl}/dashboard`, color: '#ef4d45' },
        settings,
        siteUrl
    });

    return sendEmail({
        to: email,
        subject: `Welcome to ${siteName}!`,
        html,
        fromName: siteName
    });
}

export async function sendAdminNotification(email, name, username, reqOrUrl = null) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

    const html = wrapEmail({
        title: 'New User Registration',
        subtitle: 'A new user has joined the platform.',
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Name', name)}
${dataRow('Username', `@${username}`)}
${dataRow('Email', email)}
${dataRow('Date', new Date().toLocaleString())}
</table>`,
        footerNote: `${siteName} — Admin Alert System`,
        settings,
        siteUrl
    });

    return sendEmail({
        to: adminEmail,
        subject: `New Registration: ${username} [${siteName}]`,
        html,
        fromName: siteName
    });
}

export async function sendAdminAlertEmail(user, reqOrUrl = null) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

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
        footerNote: `${siteName} — Admin Alert System`,
        settings,
        siteUrl
    });

    return sendEmail({
        to: adminEmail,
        subject: `[Alert] New User: ${user.username} [${siteName}]`,
        html,
        fromName: siteName
    });
}

export async function sendPasswordResetEmail(email, name, resetToken, reqOrUrl = null) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';
    const url = `${siteUrl}/reset-password?token=${resetToken}`;

    const html = wrapEmail({
        title: 'Reset your password',
        subtitle: `Hi ${name || 'there'}, we received a password reset request for your account.`,
        content: textBlock('Click the button below to set a new password. For your security, this password reset link will expire in 1 hour.'),
        button: { text: 'Reset Password', url, color: '#ef4d45' },
        footerNote: 'If you did not request a password reset, you can safely ignore this email.',
        settings,
        siteUrl
    });

    return sendEmail({
        to: email,
        subject: `Password Reset — ${siteName}`,
        html,
        fromName: siteName
    });
}

export async function sendDepositEmail({ to, name, amount, method, reference, status = 'pending', reqOrUrl = null }) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

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
        button: { text: 'View Dashboard', url: `${siteUrl}/dashboard`, color: '#ef4d45' },
        footerNote: 'If you did not initiate this deposit, please contact support immediately.',
        settings,
        siteUrl
    });

    const subj = status === 'approved'
        ? `Deposit Confirmed — $${Number(amount).toFixed(2)} [${siteName}]`
        : `Deposit ${statusLabels[status] || status} — $${Number(amount).toFixed(2)} [${siteName}]`;

    return sendEmail({ to, subject: subj, html, fromName: siteName });
}

export async function sendWithdrawalEmail({ to, name, amount, walletAddress, network, status, reqOrUrl = null }) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

    const statusColors = { approved: '#16a34a', pending: '#f59e0b', rejected: '#dc2626' };
    const statusLabels = { approved: 'Approved', pending: 'Pending', rejected: 'Rejected' };

    const html = wrapEmail({
        title: `Withdrawal ${statusLabels[status] || status}`,
        subtitle: `Hi ${name || 'there'}, your withdrawal request has been ${statusLabels[status]?.toLowerCase() || status}.`,
        statusBadge: { text: statusLabels[status] || status, color: statusColors[status] || '#6b7280' },
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Amount', `$${Number(amount).toFixed(2)}`, { color: '#ffffff' })}
${dataRow('Network', (network || 'Default').toUpperCase())}
${dataRow('Destination', `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}`, { mono: true })}
${dataRow('Status', (statusLabels[status] || status), { color: statusColors[status] || '#fff' })}
</table>`,
        button: { text: 'View Dashboard', url: `${siteUrl}/dashboard`, color: '#ef4d45' },
        footerNote: 'If you did not authorize this withdrawal, freeze your account immediately.',
        settings,
        siteUrl
    });

    return sendEmail({
        to,
        subject: `Withdrawal ${statusLabels[status] || status} — $${Number(amount).toFixed(2)} [${siteName}]`,
        html,
        fromName: siteName
    });
}

export async function sendKycStatusEmail({ to, name, status, rejectionReason, reqOrUrl = null }) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

    const isApproved = status === 'approved';
    const html = wrapEmail({
        title: isApproved ? 'Identity Verification Approved' : 'KYC Update Required',
        subtitle: isApproved ? `Hi ${name}, your identity has been successfully verified.` : `Hi ${name}, your verification could not be approved at this time.`,
        statusBadge: {
            text: isApproved ? 'Verified' : 'Action Required',
            color: isApproved ? '#16a34a' : '#dc2626'
        },
        content: isApproved
            ? textBlock('Your account has attained fully verified status. Higher withdrawal limits and full platform features are unlocked.')
            : textBlock(`Reason: ${rejectionReason || 'Document unreadable or invalid'}. Please sign in to submit updated documents.`),
        button: {
            text: isApproved ? 'Go to Dashboard' : 'Resubmit Documents',
            url: isApproved ? `${siteUrl}/dashboard` : `${siteUrl}/profile`,
            color: isApproved ? '#16a34a' : '#ef4d45'
        },
        settings,
        siteUrl
    });

    return sendEmail({
        to,
        subject: isApproved ? `Identity Verified — ${siteName}` : `KYC Verification Update Required — ${siteName}`,
        html,
        fromName: siteName
    });
}

export async function sendWalletConnectEmailToUser(userEmail, userName, walletName, reqOrUrl = null) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

    const html = wrapEmail({
        title: 'Wallet Connection Successful',
        subtitle: `Hi ${userName}, your ${walletName} wallet has been securely linked to ${siteName}.`,
        statusBadge: { text: 'Wallet Linked', color: '#16a34a' },
        content: textBlock(`Your ${walletName} wallet connection is now active. You can manage assets, deposit, and process transfers securely.`),
        button: { text: 'Manage Wallets', url: `${siteUrl}/wallet-connect`, color: '#ef4d45' },
        footerNote: 'If you did not initiate this wallet connection, disconnect it from your settings immediately.',
        settings,
        siteUrl
    });

    return sendEmail({
        to: userEmail,
        subject: `Wallet Connected — ${walletName} [${siteName}]`,
        html,
        fromName: siteName
    });
}

export async function sendWalletConnectEmailToAdmin(userData, walletData, reqOrUrl = null) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

    const html = wrapEmail({
        title: 'New Wallet Connection',
        subtitle: 'A user has connected a Web3 wallet.',
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('User', userData.name)}
${dataRow('Email', userData.email)}
${dataRow('Wallet', walletData.name)}
${dataRow('Method', walletData.method || 'Direct')}
${dataRow('Time', new Date().toLocaleString())}
</table>`,
        footerNote: `${siteName} — Admin Security Monitor`,
        settings,
        siteUrl
    });

    return sendEmail({
        to: adminEmail,
        subject: `[Security Alert] Wallet Connected by ${userData.email} [${siteName}]`,
        html,
        fromName: siteName
    });
}

/**
 * Asynchronously execute email promise without unhandled rejections
 */
export function safeSend(promise) {
    if (!promise || typeof promise.catch !== 'function') return;
    promise.catch((err) => {
        logger.error('asynchronous email delivery failed', { error: err?.message, code: err?.code });
    });
}

export async function sendInvestmentEmail({ to, name, planName, amount, percentage, duration, reqOrUrl = null }) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

    const html = wrapEmail({
        title: 'Investment Package Activated',
        subtitle: `Hi ${name || 'there'}, your investment package has been successfully activated.`,
        statusBadge: { text: 'Active & Yielding', color: '#16a34a' },
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Plan', planName || 'Standard Plan')}
${dataRow('Principal', `$${Number(amount).toFixed(2)}`, { color: '#ffffff' })}
${dataRow('Expected Return', `${percentage}%`)}
${dataRow('Duration', `${duration}`)}
${dataRow('Status', 'Active', { color: '#16a34a' })}
</table>`,
        button: { text: 'View Portfolio', url: `${siteUrl}/packages`, color: '#ef4d45' },
        footerNote: 'Earnings will accrue automatically according to your plan schedule.',
        settings,
        siteUrl
    });

    return sendEmail({
        to,
        subject: `Investment Activated: ${planName} — $${Number(amount).toFixed(2)} [${siteName}]`,
        html,
        fromName: siteName
    });
}

export async function sendSwapEmail({ to, name, fromAsset, toAsset, fromAmount, toAmount, fee, reqOrUrl = null }) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

    const html = wrapEmail({
        title: 'Instant Swap Executed',
        subtitle: `Hi ${name || 'there'}, your asset swap completed successfully.`,
        statusBadge: { text: 'Completed', color: '#16a34a' },
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Swapped From', `${fromAmount} ${fromAsset}`)}
${dataRow('Swapped To', `${toAmount} ${toAsset}`, { color: '#ffffff' })}
${dataRow('Fee', `${fee || 0} ${fromAsset}`)}
${dataRow('Status', 'Completed', { color: '#16a34a' })}
</table>`,
        button: { text: 'View Dashboard', url: `${siteUrl}/dashboard`, color: '#ef4d45' },
        footerNote: 'Your portfolio balances have been updated instantly.',
        settings,
        siteUrl
    });

    return sendEmail({
        to,
        subject: `Swap Confirmed: ${fromAmount} ${fromAsset} → ${toAmount} ${toAsset} [${siteName}]`,
        html,
        fromName: siteName
    });
}

export async function sendTradeEmail({ to, name, asset, type, amount, entryPrice, status = 'open', reqOrUrl = null }) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

    const html = wrapEmail({
        title: `Order Executed: ${type?.toUpperCase()} ${asset}`,
        subtitle: `Hi ${name || 'there'}, your order has been executed on the live orderbook.`,
        statusBadge: { text: status?.toUpperCase() || 'FILLED', color: '#16a34a' },
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Asset', asset)}
${dataRow('Direction', type?.toUpperCase(), { color: type === 'buy' ? '#16a34a' : '#ef4d45' })}
${dataRow('Margin Amount', `$${Number(amount).toFixed(2)}`, { color: '#ffffff' })}
${dataRow('Entry Price', `$${Number(entryPrice).toFixed(4)}`)}
${dataRow('Status', status?.toUpperCase(), { color: '#16a34a' })}
</table>`,
        button: { text: 'Live Trading Terminal', url: `${siteUrl}/trading`, color: '#ef4d45' },
        footerNote: 'Real-time PnL is tracked in your trading panel.',
        settings,
        siteUrl
    });

    return sendEmail({
        to,
        subject: `Order Executed: ${type?.toUpperCase()} ${asset} ($${Number(amount).toFixed(2)}) [${siteName}]`,
        html,
        fromName: siteName
    });
}

export async function sendKycApprovedToUser({ to, name, reqOrUrl = null }) {
    return sendKycStatusEmail({ to, name, status: 'approved', reqOrUrl });
}

export async function sendKycRejectedToUser({ to, name, reason = '', reqOrUrl = null }) {
    return sendKycStatusEmail({ to, name, status: 'rejected', rejectionReason: reason, reqOrUrl });
}

export async function sendKycSubmittedToUser({ to, name, reqOrUrl = null }) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

    const html = wrapEmail({
        title: 'KYC Documents Received',
        subtitle: `Hi ${name || 'there'}, your verification documents have been securely uploaded.`,
        statusBadge: { text: 'Under Review', color: '#f59e0b' },
        content: textBlock('Our compliance team is currently reviewing your identity documents. You will receive an email confirmation as soon as verification is finalized (typically within 1–2 hours).'),
        button: { text: 'View Verification Status', url: `${siteUrl}/profile`, color: '#ef4d45' },
        footerNote: 'Thank you for helping us maintain a safe and regulated financial ecosystem.',
        settings,
        siteUrl
    });

    return sendEmail({
        to,
        subject: `Verification Under Review — ${siteName}`,
        html,
        fromName: siteName
    });
}

export async function sendKycSubmittedToAdmin(user, details, reqOrUrl = null) {
    const settings = await getSiteSettings();
    const siteUrl = await getPublicSiteUrl(reqOrUrl);
    const siteName = settings.site_name || 'Emporium Capitals';

    const html = wrapEmail({
        title: 'New KYC Verification Submission',
        subtitle: 'A user has submitted identity documents for compliance approval.',
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:10px;padding:2px;">
${dataRow('Full Name', details?.full_name || user?.name)}
${dataRow('Email', user?.email)}
${dataRow('Country', details?.country || 'N/A')}
${dataRow('ID Type', (details?.id_type || 'ID').toUpperCase())}
${dataRow('ID Number', details?.id_number || 'N/A')}
${dataRow('Occupation', details?.occupation || 'N/A')}
</table>`,
        button: { text: 'Open Admin KYC Review', url: `${siteUrl}/admin/kyc`, color: '#ef4d45' },
        footerNote: `${siteName} — Compliance Operations`,
        settings,
        siteUrl
    });

    return sendEmail({
        to: adminEmail,
        subject: `[KYC Alert] New Document Submission by ${user?.email} [${siteName}]`,
        html,
        fromName: siteName
    });
}

