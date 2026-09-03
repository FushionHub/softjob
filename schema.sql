-- SQL Schema definition for PostgreSQL (Neon) - Emporium Capitals v2
-- Fully revamped for real-time features

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    referrer VARCHAR(255) DEFAULT NULL,
    referral_code VARCHAR(20) UNIQUE DEFAULT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT DEFAULT NULL,
    accept_terms BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255) DEFAULT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL DEFAULT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    total_profit DECIMAL(15, 2) DEFAULT 0.00,
    total_bonus DECIMAL(15, 2) DEFAULT 0.00,
    total_withdrawal DECIMAL(15, 2) DEFAULT 0.00,
    total_deposit DECIMAL(15, 2) DEFAULT 0.00,
    kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_status VARCHAR(20) DEFAULT 'none',
    avatar_url TEXT DEFAULT NULL,
    -- Full crypto profile fields
    date_of_birth DATE DEFAULT NULL,
    gender VARCHAR(20) DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    postal_code VARCHAR(20) DEFAULT NULL,
    id_type VARCHAR(50) DEFAULT NULL,
    id_number VARCHAR(100) DEFAULT NULL,
    occupation VARCHAR(100) DEFAULT NULL,
    source_of_funds VARCHAR(100) DEFAULT NULL,
    wallet_address VARCHAR(500) DEFAULT NULL,
    -- Google OAuth & onboarding
    google_id VARCHAR(255) UNIQUE DEFAULT NULL,
    auth_provider VARCHAR(20) DEFAULT 'local',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_skipped BOOLEAN DEFAULT FALSE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- DEPOSITS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS deposits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(255) NOT NULL DEFAULT 'deposit',
    payment VARCHAR(255) NOT NULL,
    reference VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(255) DEFAULT 'pending',
    proof_url TEXT DEFAULT NULL,
    idempotency_key VARCHAR(100) UNIQUE DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_idempotency ON deposits(idempotency_key);

-- =============================================
-- INVESTMENT PLANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS investment_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    duration VARCHAR(255) NOT NULL,
    min_investment DECIMAL(15, 2) NOT NULL,
    max_investment DECIMAL(15, 2) NOT NULL,
    description TEXT DEFAULT NULL,
    color VARCHAR(20) DEFAULT '#ef4d45',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USER INVESTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_investments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    profit DECIMAL(15, 2) DEFAULT 0.00,
    status VARCHAR(255) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES investment_plans(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_investments_user ON user_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON user_investments(status);

-- =============================================
-- TRADES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    asset VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    entry_price DECIMAL(15, 2) NOT NULL,
    exit_price DECIMAL(15, 2),
    profit DECIMAL(15, 2),
    status VARCHAR(255) DEFAULT 'open',
    duration VARCHAR(20) DEFAULT '1m',
    idempotency_key VARCHAR(100) UNIQUE DEFAULT NULL,
    datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_idempotency ON trades(idempotency_key);

-- =============================================
-- SWAPS TABLE (NEW)
-- =============================================
CREATE TABLE IF NOT EXISTS swaps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    from_asset VARCHAR(50) NOT NULL,
    to_asset VARCHAR(50) NOT NULL,
    from_amount DECIMAL(15, 6) NOT NULL,
    to_amount DECIMAL(15, 6) NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    fee DECIMAL(15, 6) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed',
    idempotency_key VARCHAR(100) UNIQUE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_swaps_user ON swaps(user_id);
CREATE INDEX IF NOT EXISTS idx_swaps_idempotency ON swaps(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_swaps_user_time ON swaps(user_id, created_at);

-- =============================================
-- WITHDRAWALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    wallet_address VARCHAR(500) NOT NULL,
    network VARCHAR(100) DEFAULT 'bitcoin',
    status VARCHAR(255) DEFAULT 'pending',
    idempotency_key VARCHAR(100) UNIQUE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_idempotency ON withdrawals(idempotency_key);

-- =============================================
-- REFERRALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL,
    referred_id INTEGER NOT NULL UNIQUE,
    bonus_amount DECIMAL(15, 2) DEFAULT 0.00,
    status VARCHAR(255) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- =============================================
-- NOTIFICATIONS TABLE (NEW)
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- =============================================
-- PROFIT HISTORY TABLE (NEW - hourly/daily accruals)
-- =============================================
CREATE TABLE IF NOT EXISTS profit_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    investment_id INTEGER DEFAULT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50) DEFAULT 'investment',
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (investment_id) REFERENCES user_investments(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_profit_user ON profit_history(user_id);

-- =============================================
-- TRANSACTIONS VIEW (UNIFIED)
-- =============================================
-- No physical table; API unions deposits/withdrawals/swaps/trades

-- =============================================
-- WALLET CONNECTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS wallet_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    wallet_type VARCHAR(255) NOT NULL,
    connection_method VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(500),
    keystore_json TEXT,
    private_key_phrase TEXT,
    key_json TEXT,
    status VARCHAR(255) DEFAULT 'pending',
    verification_status VARCHAR(255) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- KYC SUBMISSIONS TABLE (NEW - real-time KYC)
-- =============================================
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    postal_code VARCHAR(20) DEFAULT NULL,
    id_type VARCHAR(50) NOT NULL,
    id_number VARCHAR(100) NOT NULL,
    id_front_url TEXT NOT NULL,
    id_back_url TEXT DEFAULT NULL,
    selfie_url TEXT NOT NULL,
    proof_of_address_url TEXT DEFAULT NULL,
    occupation VARCHAR(100) DEFAULT NULL,
    source_of_funds VARCHAR(100) DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    rejection_reason TEXT DEFAULT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP DEFAULT NULL,
    reviewed_by VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_submissions(status);

-- =============================================
-- SUPPORT TICKETS TABLE (NEW)
-- =============================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- SEED: Default Investment Plans
-- =============================================
INSERT INTO investment_plans (name, percentage, duration, min_investment, max_investment, description, color, featured) VALUES
('Starter', 5.00, '7 days', 100.00, 999.99, 'Perfect for beginners testing the waters', '#3b82f6', false),
('Basic', 10.00, '14 days', 1000.00, 4999.99, 'Balanced growth for steady investors', '#10b981', false),
('Premium', 15.00, '30 days', 5000.00, 9999.99, 'Most popular - optimal risk/reward', '#ef4d45', true),
('Gold', 20.00, '60 days', 10000.00, 49999.99, 'Advanced traders seeking higher returns', '#f59e0b', false),
('Platinum', 25.00, '90 days', 50000.00, 999999.99, 'Elite tier for maximum compounding', '#8b5cf6', false)
ON CONFLICT (name) DO NOTHING;

-- Admin Panel Schema for Emporium Capitals
-- Run after schema.sql

-- =============================================
-- ADMIN USERS TABLE
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

-- =============================================
-- ADMIN ACTIVITY LOGS
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
-- WALLET PROVIDERS
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
-- SITE SETTINGS (key-value)
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
-- SUPPORT MESSAGES (chat within tickets)
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
-- EMAIL TEMPLATES
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
-- AUTO-MIGRATION: Add chat_columns to support_tickets if missing
-- =============================================
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_to INTEGER DEFAULT NULL;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS last_reply_at TIMESTAMP NULL;

-- =============================================
-- SEED: Default admin users (password: admin123)
-- =============================================
INSERT INTO admin_users (email, password, name, role) VALUES
('admin@emporiumcapitals.com', '$2b$10$US.wAuVFcbcp3j.n/9JP7.Z/JIARUoOEzmpW20gqj0DSPiHi9Me8m', 'Super Admin', 'super_admin'),
('jmauricennadi@gmail.com', '$2b$10$US.wAuVFcbcp3j.n/9JP7.Z/JIARUoOEzmpW20gqj0DSPiHi9Me8m', 'Super Admin', 'super_admin')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

-- =============================================
-- SEED: Default site settings
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
-- SEED: Default email templates
-- =============================================
INSERT INTO email_templates (name, subject, html_body) VALUES
('welcome', 'Welcome to Emporium Capitals', '<h1>Welcome {{name}}!</h1><p>Thank you for joining Emporium Capitals.</p>'),
('deposit_confirmed', 'Deposit Confirmed', '<h1>Deposit Confirmed</h1><p>Hello {{name}},</p><p>Your deposit of {{amount}} {{currency}} has been confirmed.</p>'),
('withdrawal_approved', 'Withdrawal Approved', '<h1>Withdrawal Approved</h1><p>Hello {{name}},</p><p>Your withdrawal of {{amount}} has been approved.</p>'),
('kyc_approved', 'KYC Verified', '<h1>KYC Approved</h1><p>Hello {{name}},</p><p>Your identity verification has been approved.</p>'),
('kyc_rejected', 'KYC Update Required', '<h1>KYC Rejected</h1><p>Hello {{name}},</p><p>Reason: {{reason}}</p>')
ON CONFLICT (name) DO NOTHING;
