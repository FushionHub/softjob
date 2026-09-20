-- ==============================================================================
-- Admin Panel Schema for PostgreSQL (Neon Serverless) - Emporium Capitals
-- Run after schema.sql or standalone for admin-only migration
-- ==============================================================================

-- =============================================
-- 1. ADMIN USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'Admin',
    role VARCHAR(50) DEFAULT 'admin',
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- =============================================
-- 2. ADMIN ACTIVITY LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INTEGER,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_time ON admin_logs(created_at);

-- =============================================
-- 3. WALLET PROVIDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS wallet_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    api_key TEXT DEFAULT NULL,
    api_secret TEXT DEFAULT NULL,
    api_base_url TEXT DEFAULT NULL,
    webhook_secret TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. SITE SETTINGS TABLE (key-value)
-- =============================================
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT DEFAULT NULL,
    setting_type VARCHAR(20) DEFAULT 'text',
    category VARCHAR(50) DEFAULT 'general',
    description TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5. SUPPORT MESSAGES TABLE (chat within tickets)
-- =============================================
CREATE TABLE IF NOT EXISTS support_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    sender_type VARCHAR(20) NOT NULL DEFAULT 'user',
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    file_url TEXT DEFAULT NULL,
    file_name TEXT DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);

-- =============================================
-- 6. EMAIL TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- AUTO-MIGRATION: Add chat columns to support_tickets if missing
-- =============================================
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_to INTEGER DEFAULT NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS last_reply_at TIMESTAMP NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =============================================
-- SEED: Default Admin Users (Password: admin123)
-- =============================================
INSERT INTO admin_users (email, password, name, role, is_active) VALUES
('admin@emporiumcapitals.com', '$2b$10$US.wAuVFcbcp3j.n/9JP7.Z/JIARUoOEzmpW20gqj0DSPiHi9Me8m', 'Super Admin', 'super_admin', true),
('jmauricennadi@gmail.com', '$2b$10$US.wAuVFcbcp3j.n/9JP7.Z/JIARUoOEzmpW20gqj0DSPiHi9Me8m', 'Super Admin', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- SEED: Default Site Settings
-- =============================================
INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description) VALUES
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
('two_factor_required', 'false', 'boolean', 'security', 'Require 2FA for all users')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================
-- SEED: Default Email Templates
-- =============================================
INSERT INTO email_templates (name, subject, html_body) VALUES
('welcome', 'Welcome to Emporium Capitals', '<h1>Welcome {{name}}!</h1><p>Thank you for joining Emporium Capitals.</p>'),
('deposit_confirmed', 'Deposit Confirmed', '<h1>Deposit Confirmed</h1><p>Hello {{name}},</p><p>Your deposit of {{amount}} {{currency}} has been confirmed.</p>'),
('withdrawal_approved', 'Withdrawal Approved', '<h1>Withdrawal Approved</h1><p>Hello {{name}},</p><p>Your withdrawal of {{amount}} has been approved.</p>'),
('kyc_approved', 'KYC Verified', '<h1>KYC Approved</h1><p>Hello {{name}},</p><p>Your identity verification has been approved.</p>'),
('kyc_rejected', 'KYC Update Required', '<h1>KYC Rejected</h1><p>Hello {{name}},</p><p>Reason: {{reason}}</p>')
ON CONFLICT (name) DO NOTHING;
