// Re-export all email functions from the unified email module
// This file is kept for backward compatibility
export {
    sendEmail,
    sendVerificationEmail,
    sendWelcomeEmail,
    sendAdminNotification,
    sendAdminAlertEmail,
    sendPasswordResetEmail,
    sendWalletConnectEmailToUser,
    sendWalletConnectEmailToAdmin
} from './email.js';
