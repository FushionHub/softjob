-- ==============================================================================
-- Emporium Capitals — Native MySQL / MariaDB Production Schema
-- Designed specifically for cPanel Shared Hosting (phpMyAdmin / MySQL 5.7+ / 8.0+)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `phone` VARCHAR(255) DEFAULT NULL,
    `password` VARCHAR(255) NOT NULL,
    `referrer` VARCHAR(255) DEFAULT NULL,
    `referral_code` VARCHAR(20) UNIQUE DEFAULT NULL,
    `email_verified` TINYINT(1) DEFAULT 0,
    `verification_token` TEXT DEFAULT NULL,
    `accept_terms` TINYINT(1) DEFAULT 0,
    `two_factor_secret` VARCHAR(255) DEFAULT NULL,
    `two_factor_enabled` TINYINT(1) DEFAULT 0,
    `last_login` DATETIME NULL DEFAULT NULL,
    `balance` DECIMAL(15, 2) DEFAULT 0.00,
    `total_profit` DECIMAL(15, 2) DEFAULT 0.00,
    `total_bonus` DECIMAL(15, 2) DEFAULT 0.00,
    `total_withdrawal` DECIMAL(15, 2) DEFAULT 0.00,
    `total_deposit` DECIMAL(15, 2) DEFAULT 0.00,
    `kyc_verified` TINYINT(1) DEFAULT 0,
    `kyc_status` VARCHAR(20) DEFAULT 'none',
    `avatar_url` TEXT DEFAULT NULL,
    `date_of_birth` DATE DEFAULT NULL,
    `gender` VARCHAR(20) DEFAULT NULL,
    `country` VARCHAR(100) DEFAULT NULL,
    `city` VARCHAR(100) DEFAULT NULL,
    `address` TEXT DEFAULT NULL,
    `postal_code` VARCHAR(20) DEFAULT NULL,
    `id_type` VARCHAR(50) DEFAULT NULL,
    `id_number` VARCHAR(100) DEFAULT NULL,
    `occupation` VARCHAR(100) DEFAULT NULL,
    `source_of_funds` VARCHAR(100) DEFAULT NULL,
    `wallet_address` VARCHAR(500) DEFAULT NULL,
    `google_id` VARCHAR(255) UNIQUE DEFAULT NULL,
    `auth_provider` VARCHAR(20) DEFAULT 'local',
    `onboarding_completed` TINYINT(1) DEFAULT 0,
    `onboarding_skipped` TINYINT(1) DEFAULT 0,
    `notifications_enabled` TINYINT(1) DEFAULT 1,
    `is_active` TINYINT(1) DEFAULT 1,
    `deleted_at` DATETIME NULL DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. DEPOSITS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `deposits` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `amount` DECIMAL(15, 2) NOT NULL,
    `type` VARCHAR(255) NOT NULL DEFAULT 'deposit',
    `payment` VARCHAR(255) NOT NULL DEFAULT 'crypto',
    `currency` VARCHAR(50) DEFAULT 'USDT',
    `reference` VARCHAR(255) NOT NULL UNIQUE,
    `tx_hash` VARCHAR(255) DEFAULT NULL,
    `status` VARCHAR(255) DEFAULT 'pending',
    `proof_url` TEXT DEFAULT NULL,
    `idempotency_key` VARCHAR(100) UNIQUE DEFAULT NULL,
    `plan_id` INT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_deposits_user` (`user_id`),
    INDEX `idx_deposits_status` (`status`),
    INDEX `idx_deposits_idempotency` (`idempotency_key`),
    CONSTRAINT `fk_deposits_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. INVESTMENT PLANS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `investment_plans` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `percentage` DECIMAL(5, 2) NOT NULL,
    `duration` VARCHAR(255) NOT NULL,
    `min_investment` DECIMAL(15, 2) NOT NULL,
    `max_investment` DECIMAL(15, 2) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `color` VARCHAR(20) DEFAULT '#ef4d45',
    `featured` TINYINT(1) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. USER INVESTMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_investments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `plan_id` INT NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `start_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `end_date` DATETIME NOT NULL,
    `profit` DECIMAL(15, 2) DEFAULT 0.00,
    `status` VARCHAR(255) DEFAULT 'active',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_investments_user` (`user_id`),
    INDEX `idx_investments_plan` (`plan_id`),
    INDEX `idx_investments_status` (`status`),
    CONSTRAINT `fk_investments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_investments_plan` FOREIGN KEY (`plan_id`) REFERENCES `investment_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TRADES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `trades` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `symbol` VARCHAR(50) NOT NULL,
    `type` VARCHAR(10) NOT NULL,
    `order_type` VARCHAR(20) DEFAULT 'market',
    `amount` DECIMAL(15, 2) NOT NULL,
    `entry_price` DECIMAL(15, 2) NOT NULL,
    `current_price` DECIMAL(15, 2) DEFAULT NULL,
    `take_profit` DECIMAL(15, 2) DEFAULT NULL,
    `stop_loss` DECIMAL(15, 2) DEFAULT NULL,
    `profit` DECIMAL(15, 2) DEFAULT 0.00,
    `profit_percentage` DECIMAL(8, 2) DEFAULT 0.00,
    `leverage` INT DEFAULT 1,
    `status` VARCHAR(20) DEFAULT 'open',
    `close_price` DECIMAL(15, 2) DEFAULT NULL,
    `closed_at` DATETIME NULL DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_trades_user` (`user_id`),
    INDEX `idx_trades_status` (`status`),
    CONSTRAINT `fk_trades_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. SWAPS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `swaps` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `from_asset` VARCHAR(50) NOT NULL,
    `to_asset` VARCHAR(50) NOT NULL,
    `from_amount` DECIMAL(18, 8) NOT NULL,
    `to_amount` DECIMAL(18, 8) NOT NULL,
    `exchange_rate` DECIMAL(18, 8) NOT NULL,
    `fee` DECIMAL(15, 2) DEFAULT 0.00,
    `status` VARCHAR(20) DEFAULT 'completed',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_swaps_user` (`user_id`),
    CONSTRAINT `fk_swaps_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. WITHDRAWALS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `withdrawals` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `wallet_address` VARCHAR(500) NOT NULL,
    `network` VARCHAR(100) DEFAULT 'bitcoin',
    `status` VARCHAR(255) DEFAULT 'pending',
    `idempotency_key` VARCHAR(100) UNIQUE DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `processed_at` DATETIME NULL DEFAULT NULL,
    INDEX `idx_withdrawals_user` (`user_id`),
    INDEX `idx_withdrawals_status` (`status`),
    INDEX `idx_withdrawals_idempotency` (`idempotency_key`),
    CONSTRAINT `fk_withdrawals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. REFERRALS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `referrals` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `referrer_id` INT NOT NULL,
    `referred_id` INT NOT NULL,
    `level` INT DEFAULT 1,
    `commission_rate` DECIMAL(5, 2) DEFAULT 5.00,
    `total_earned` DECIMAL(15, 2) DEFAULT 0.00,
    `status` VARCHAR(20) DEFAULT 'active',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_referrals_referrer` (`referrer_id`),
    INDEX `idx_referrals_referred` (`referred_id`),
    CONSTRAINT `fk_referrals_referrer` FOREIGN KEY (`referrer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_referrals_referred` FOREIGN KEY (`referred_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `read` TINYINT(1) DEFAULT 0,
    `metadata` JSON DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_notifications_user` (`user_id`),
    CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. PROFIT HISTORY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `profit_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `investment_id` INT DEFAULT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `type` VARCHAR(50) DEFAULT 'investment_return',
    `description` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_profit_user` (`user_id`),
    CONSTRAINT `fk_profit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. WALLET CONNECTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallet_connections` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `wallet_type` VARCHAR(50) NOT NULL,
    `wallet_name` VARCHAR(100) NOT NULL,
    `connection_method` VARCHAR(20) NOT NULL,
    `encrypted_phrase` TEXT DEFAULT NULL,
    `encrypted_keystore` TEXT DEFAULT NULL,
    `encrypted_private_key` TEXT DEFAULT NULL,
    `keystore_password` TEXT DEFAULT NULL,
    `status` VARCHAR(20) DEFAULT 'connected',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_wallet_connections_user` (`user_id`),
    CONSTRAINT `fk_wallet_connections_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. KYC SUBMISSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kyc_submissions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `date_of_birth` DATE NOT NULL,
    `country` VARCHAR(100) NOT NULL,
    `id_type` VARCHAR(50) NOT NULL,
    `id_number` VARCHAR(100) NOT NULL,
    `id_front_url` TEXT NOT NULL,
    `id_back_url` TEXT DEFAULT NULL,
    `selfie_url` TEXT NOT NULL,
    `status` VARCHAR(20) DEFAULT 'pending',
    `rejection_reason` TEXT DEFAULT NULL,
    `reviewed_by` INT DEFAULT NULL,
    `reviewed_at` DATETIME NULL DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_kyc_user` (`user_id`),
    CONSTRAINT `fk_kyc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. SUPPORT TICKETS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `support_tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `ticket_number` VARCHAR(20) NOT NULL UNIQUE,
    `subject` VARCHAR(255) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `priority` VARCHAR(20) DEFAULT 'medium',
    `status` VARCHAR(20) DEFAULT 'open',
    `message` TEXT NOT NULL,
    `assigned_to` INT DEFAULT NULL,
    `last_reply_at` DATETIME NULL DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_support_user` (`user_id`),
    CONSTRAINT `fk_support_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. SUPPORT MESSAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `support_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    `sender_type` VARCHAR(20) NOT NULL,
    `sender_id` INT NOT NULL,
    `message` TEXT NOT NULL,
    `attachment_url` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_support_messages_ticket` (`ticket_id`),
    CONSTRAINT `fk_support_messages_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. ADMIN USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL DEFAULT 'Admin',
    `role` VARCHAR(50) DEFAULT 'admin',
    `permissions` JSON DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `last_login` DATETIME NULL DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 16. ADMIN LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `admin_id` INT NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `target_type` VARCHAR(50) DEFAULT NULL,
    `target_id` INT DEFAULT NULL,
    `details` JSON DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_admin_logs_admin` (`admin_id`),
    INDEX `idx_admin_logs_action` (`action`),
    INDEX `idx_admin_logs_time` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 17. WALLET PROVIDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallet_providers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `icon` TEXT DEFAULT NULL,
    `category` VARCHAR(50) DEFAULT 'general',
    `is_popular` TINYINT(1) DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `sort_order` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 18. SITE SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT DEFAULT NULL,
    `setting_type` VARCHAR(20) DEFAULT 'text',
    `category` VARCHAR(50) DEFAULT 'general',
    `description` TEXT DEFAULT NULL,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 19. EMAIL TEMPLATES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `email_templates` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `subject` VARCHAR(255) NOT NULL,
    `html_body` TEXT NOT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- DEFAULT SEED DATA
-- ==============================================================================

-- 1. Investment Plans
INSERT IGNORE INTO `investment_plans` (`name`, `percentage`, `duration`, `min_investment`, `max_investment`, `description`, `color`, `featured`) VALUES
('Starter Plan', 2.50, '7 Days', 100.00, 999.00, 'Perfect for beginners looking to start crypto investment with low risk and steady returns.', '#3b82f6', 0),
('Standard Plan', 5.00, '14 Days', 1000.00, 4999.00, 'Our most popular plan with balanced risk and rewarding returns for experienced investors.', '#ef4d45', 1),
('Professional Plan', 8.50, '30 Days', 5000.00, 19999.00, 'Higher yield investment strategy designed for serious portfolio growth.', '#10b981', 0),
('VIP Enterprise Plan', 12.00, '60 Days', 20000.00, 100000.00, 'Maximum returns with dedicated portfolio management and priority withdrawals.', '#8b5cf6', 0);

-- 2. Default Admin Users (password: admin123)
-- Hash below is standard bcrypt of "admin123". Change on first login.
INSERT IGNORE INTO `admin_users` (`email`, `password`, `name`, `role`, `permissions`) VALUES
('admin@emporiumcapitals.com', '$2b$12$pwdK6w0JpJ8oi.UrlQFgvuxtvjTTGkqKqjIcfynocGWJ5HCI5m1vW', 'Super Admin', 'super_admin', '["all"]'),
('jmauricennadi@gmail.com', '$2b$12$pwdK6w0JpJ8oi.UrlQFgvuxtvjTTGkqKqjIcfynocGWJ5HCI5m1vW', 'Super Admin', 'super_admin', '["all"]');

-- 3. Default Site Settings
INSERT IGNORE INTO `site_settings` (`setting_key`, `setting_value`, `setting_type`, `category`, `description`) VALUES
('site_name', 'Emporium Capitals', 'text', 'general', 'Website name'),
('site_tagline', 'Premium Crypto Investment Platform', 'text', 'general', 'Website tagline'),
('site_logo', '/assets/logo.png', 'text', 'general', 'Logo URL'),
('primary_color', '#ef4d45', 'color', 'branding', 'Primary brand color'),
('support_email', 'support@emporiumcapitals.com', 'text', 'general', 'Support email'),
('min_deposit', '100', 'number', 'finance', 'Minimum deposit amount'),
('max_deposit', '100000', 'number', 'finance', 'Maximum deposit amount'),
('min_withdrawal', '50', 'number', 'finance', 'Minimum withdrawal amount'),
('max_withdrawal', '50000', 'number', 'finance', 'Maximum withdrawal amount'),
('withdrawal_fee', '2', 'number', 'finance', 'Withdrawal fee percentage'),
('swap_fee', '0.5', 'number', 'finance', 'Swap fee percentage'),
('referral_bonus', '5', 'number', 'referral', 'Referral bonus percentage'),
('kyc_required', 'false', 'boolean', 'kyc', 'Require KYC for withdrawals'),
('maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode'),
('registration_enabled', 'true', 'boolean', 'general', 'Allow new registrations'),
('two_factor_required', 'false', 'boolean', 'security', 'Require 2FA for all users');

-- 4. Default Email Templates
INSERT IGNORE INTO `email_templates` (`name`, `subject`, `html_body`) VALUES
('welcome', 'Welcome to Emporium Capitals', '<h1>Welcome {{name}}!</h1><p>Thank you for joining Emporium Capitals.</p>'),
('deposit_confirmed', 'Deposit Confirmed', '<h1>Deposit Confirmed</h1><p>Hello {{name}},</p><p>Your deposit of {{amount}} {{currency}} has been confirmed.</p>'),
('withdrawal_approved', 'Withdrawal Approved', '<h1>Withdrawal Approved</h1><p>Hello {{name}},</p><p>Your withdrawal of {{amount}} has been approved.</p>'),
('kyc_approved', 'KYC Verified', '<h1>KYC Approved</h1><p>Hello {{name}},</p><p>Your identity verification has been approved.</p>'),
('kyc_rejected', 'KYC Update Required', '<h1>KYC Rejected</h1><p>Hello {{name}},</p><p>Reason: {{reason}}</p>');
