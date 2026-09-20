-- ==============================================================================
-- Emporium Capitals — Native MySQL / MariaDB Production Schema
-- Designed specifically for cPanel Shared Hosting (phpMyAdmin / MySQL 5.7+ / 8.0+)
-- 100% synchronized with PostgreSQL schema.sql, lib/db.js, and all Next.js API routes
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
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_referral_code` (`referral_code`)
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
-- 3. WITHDRAWALS TABLE
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
-- 4. INVESTMENT PLANS TABLE
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
-- 5. USER INVESTMENTS TABLE
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
    INDEX `idx_investments_status` (`status`),
    CONSTRAINT `fk_investments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_investments_plan` FOREIGN KEY (`plan_id`) REFERENCES `investment_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. TRADES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `trades` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `asset` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `entry_price` DECIMAL(15, 2) NOT NULL,
    `exit_price` DECIMAL(15, 2) DEFAULT NULL,
    `profit` DECIMAL(15, 2) DEFAULT NULL,
    `status` VARCHAR(255) DEFAULT 'open',
    `duration` VARCHAR(20) DEFAULT '1m',
    `idempotency_key` VARCHAR(100) UNIQUE DEFAULT NULL,
    `datetime` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `closed_at` DATETIME NULL DEFAULT NULL,
    INDEX `idx_trades_user` (`user_id`),
    INDEX `idx_trades_status` (`status`),
    INDEX `idx_trades_idempotency` (`idempotency_key`),
    CONSTRAINT `fk_trades_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. SWAPS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `swaps` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `from_asset` VARCHAR(50) NOT NULL,
    `to_asset` VARCHAR(50) NOT NULL,
    `from_amount` DECIMAL(15, 6) NOT NULL,
    `to_amount` DECIMAL(15, 6) NOT NULL,
    `rate` DECIMAL(15, 6) NOT NULL,
    `fee` DECIMAL(15, 6) DEFAULT 0,
    `status` VARCHAR(50) DEFAULT 'completed',
    `idempotency_key` VARCHAR(100) UNIQUE DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_swaps_user` (`user_id`),
    INDEX `idx_swaps_idempotency` (`idempotency_key`),
    INDEX `idx_swaps_user_time` (`user_id`, `created_at`),
    CONSTRAINT `fk_swaps_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. REFERRALS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `referrals` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `referrer_id` INT NOT NULL,
    `referred_id` INT NOT NULL UNIQUE,
    `bonus_amount` DECIMAL(15, 2) DEFAULT 0.00,
    `status` VARCHAR(255) DEFAULT 'pending',
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
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) DEFAULT 'info',
    `is_read` TINYINT(1) DEFAULT 0,
    `link` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_notifications_user` (`user_id`),
    INDEX `idx_notifications_read` (`is_read`),
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
    `type` VARCHAR(50) DEFAULT 'investment',
    `description` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_profit_user` (`user_id`),
    CONSTRAINT `fk_profit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_profit_investment` FOREIGN KEY (`investment_id`) REFERENCES `user_investments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. WALLET CONNECTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallet_connections` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `wallet_type` VARCHAR(255) NOT NULL,
    `connection_method` VARCHAR(255) NOT NULL,
    `wallet_address` VARCHAR(500) DEFAULT NULL,
    `keystore_json MEDIUMTEXT DEFAULT NULL,
    `private_key_phrase MEDIUMTEXT DEFAULT NULL,
    `key_json MEDIUMTEXT DEFAULT NULL,
    `status` VARCHAR(255) DEFAULT 'pending',
    `verification_status` VARCHAR(255) DEFAULT 'pending',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_wallet_connections_user` (`user_id`),
    CONSTRAINT `fk_wallet_connections_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. KYC SUBMISSIONS TABLE (Full multi-document inspection support)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kyc_submissions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `full_name` VARCHAR(255) NOT NULL,
    `date_of_birth` DATE NOT NULL,
    `gender` VARCHAR(20) NOT NULL,
    `country` VARCHAR(100) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `address` TEXT NOT NULL,
    `postal_code` VARCHAR(20) DEFAULT NULL,
    `id_type` VARCHAR(50) NOT NULL,
    `id_number` VARCHAR(100) NOT NULL,
    `id_front_url` MEDIUMTEXT NOT NULL,
    `id_back_url` MEDIUMTEXT DEFAULT NULL,
    `selfie_url` MEDIUMTEXT NOT NULL,
    `proof_of_address_url` MEDIUMTEXT DEFAULT NULL,
    `occupation` VARCHAR(100) DEFAULT NULL,
    `source_of_funds` VARCHAR(100) DEFAULT NULL,
    `status` VARCHAR(20) DEFAULT 'pending',
    `rejection_reason` TEXT DEFAULT NULL,
    `submitted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `reviewed_at` DATETIME NULL DEFAULT NULL,
    `reviewed_by` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_kyc_user` (`user_id`),
    INDEX `idx_kyc_status` (`status`),
    CONSTRAINT `fk_kyc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. SUPPORT TICKETS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `support_tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `category` VARCHAR(100) DEFAULT 'general',
    `status` VARCHAR(50) DEFAULT 'open',
    `priority` VARCHAR(20) DEFAULT 'normal',
    `assigned_to` INT DEFAULT NULL,
    `last_reply_at` DATETIME NULL DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_support_tickets_user` (`user_id`),
    INDEX `idx_support_tickets_status` (`status`),
    CONSTRAINT `fk_support_tickets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. SUPPORT MESSAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `support_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    `sender_id` INT NOT NULL,
    `sender_type` VARCHAR(20) NOT NULL DEFAULT 'user',
    `message` TEXT NOT NULL,
    `message_type` VARCHAR(20) DEFAULT 'text',
    `file_url TEXT DEFAULT NULL,
    `file_name` TEXT DEFAULT NULL,
    `is_read` TINYINT(1) DEFAULT 0,
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
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_admin_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 16. ADMIN ACTIVITY LOGS TABLE
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
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `api_key` TEXT DEFAULT NULL,
    `api_secret` TEXT DEFAULT NULL,
    `api_base_url` TEXT DEFAULT NULL,
    `webhook_secret` TEXT DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `config` JSON DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 18. SITE SETTINGS TABLE (Key-Value)
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
('Starter', 5.00, '7 days', 100.00, 999.99, 'Perfect for beginners testing the waters', '#3b82f6', 0),
('Basic', 10.00, '14 days', 1000.00, 4999.99, 'Balanced growth for steady investors', '#10b981', 0),
('Premium', 15.00, '30 days', 5000.00, 9999.99, 'Most popular - optimal risk/reward', '#ef4d45', 1),
('Gold', 20.00, '60 days', 10000.00, 49999.99, 'Advanced traders seeking higher returns', '#f59e0b', 0),
('Platinum', 25.00, '90 days', 50000.00, 999999.99, 'Elite tier for maximum compounding', '#8b5cf6', 0);

-- 2. Default Admin Users (password: admin123)
-- Standard bcrypt hash of "admin123". Change on first login.
INSERT IGNORE INTO `admin_users` (`email`, `password`, `name`, `role`, `is_active`) VALUES
('admin@emporiumcapitals.com', '$2b$10$US.wAuVFcbcp3j.n/9JP7.Z/JIARUoOEzmpW20gqj0DSPiHi9Me8m', 'Super Admin', 'super_admin', 1),
('jmauricennadi@gmail.com', '$2b$10$US.wAuVFcbcp3j.n/9JP7.Z/JIARUoOEzmpW20gqj0DSPiHi9Me8m', 'Super Admin', 'super_admin', 1);

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
