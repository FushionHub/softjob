import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

let sql;
let isMigrating = null;

export function getDb() {
    if (!sql) {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        sql = neon(databaseUrl);
    }
    return sql;
}

export async function ensureSchema() {
    if (isMigrating) return isMigrating;
    
    isMigrating = (async () => {
        const db = getDb();
        try {
            const executeStmt = async (stmt) => {
                try {
                    await db(stmt);
                } catch (e) {
                    // Ignore already exists / duplicate errors
                    if (!String(e?.message || '').includes('already exists') &&
                        !String(e?.message || '').includes('duplicate') &&
                        e?.code !== '42710' && e?.code !== '42P07') {
                        // console.warn('Statement warning:', stmt.substring(0, 60), e.message);
                    }
                }
            };

            // Users Table
            await executeStmt(`
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
                    google_id VARCHAR(255) UNIQUE DEFAULT NULL,
                    auth_provider VARCHAR(20) DEFAULT 'local',
                    onboarding_completed BOOLEAN DEFAULT FALSE,
                    onboarding_skipped BOOLEAN DEFAULT FALSE,
                    notifications_enabled BOOLEAN DEFAULT TRUE,
                    is_active BOOLEAN DEFAULT TRUE,
                    deleted_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Users Columns
            const userCols = [
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(15, 2) DEFAULT 0.00`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_profit DECIMAL(15, 2) DEFAULT 0.00`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_bonus DECIMAL(15, 2) DEFAULT 0.00`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_withdrawal DECIMAL(15, 2) DEFAULT 0.00`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS total_deposit DECIMAL(15, 2) DEFAULT 0.00`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'none'`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS id_type VARCHAR(50) DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number VARCHAR(100) DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(100) DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS source_of_funds VARCHAR(100) DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(500) DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE DEFAULT NULL`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local'`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE`,
                `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
            ];
            for (const col of userCols) await executeStmt(col);

            // Admin Users Table
            await executeStmt(`
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
                )
            `);

            // Admin Logs Table & Indexes
            await executeStmt(`
                CREATE TABLE IF NOT EXISTS admin_logs (
                    id SERIAL PRIMARY KEY,
                    admin_id INTEGER NOT NULL,
                    action VARCHAR(100) NOT NULL,
                    target_type VARCHAR(50),
                    target_id INTEGER,
                    details JSONB DEFAULT '{}',
                    ip_address VARCHAR(45),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id)`);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action)`);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_admin_logs_time ON admin_logs(created_at)`);

            // Deposits Table & Columns
            await executeStmt(`
                CREATE TABLE IF NOT EXISTS deposits (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    amount DECIMAL(15, 2) NOT NULL,
                    type VARCHAR(255) NOT NULL DEFAULT 'deposit',
                    payment VARCHAR(255) NOT NULL DEFAULT 'crypto',
                    currency VARCHAR(50) DEFAULT 'USDT',
                    reference VARCHAR(255) UNIQUE NOT NULL,
                    tx_hash VARCHAR(255) DEFAULT NULL,
                    status VARCHAR(255) DEFAULT 'pending',
                    proof_url TEXT DEFAULT NULL,
                    idempotency_key VARCHAR(100) UNIQUE DEFAULT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposits(user_id)`);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_deposits_idempotency ON deposits(idempotency_key)`);
            await executeStmt(`ALTER TABLE deposits ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
            await executeStmt(`ALTER TABLE deposits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
            await executeStmt(`ALTER TABLE deposits ADD COLUMN IF NOT EXISTS currency VARCHAR(50) DEFAULT 'USDT'`);
            await executeStmt(`ALTER TABLE deposits ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(255) DEFAULT NULL`);

            // Withdrawals Table & Columns
            await executeStmt(`
                CREATE TABLE IF NOT EXISTS withdrawals (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    amount DECIMAL(15, 2) NOT NULL,
                    wallet_address VARCHAR(500) NOT NULL,
                    network VARCHAR(100) DEFAULT 'bitcoin',
                    status VARCHAR(255) DEFAULT 'pending',
                    idempotency_key VARCHAR(100) UNIQUE DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed_at TIMESTAMP NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id)`);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_withdrawals_idempotency ON withdrawals(idempotency_key)`);
            await executeStmt(`ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

            // Investment Plans Table
            await executeStmt(`
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await executeStmt(`ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

            // User Investments Table
            await executeStmt(`
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
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (plan_id) REFERENCES investment_plans(id) ON DELETE CASCADE
                )
            `);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_investments_user ON user_investments(user_id)`);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_investments_status ON user_investments(status)`);
            await executeStmt(`ALTER TABLE user_investments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

            // Trades Table
            await executeStmt(`
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    closed_at TIMESTAMP NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id)`);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_trades_idempotency ON trades(idempotency_key)`);
            await executeStmt(`ALTER TABLE trades ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

            // Swaps Table
            await executeStmt(`
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
                )
            `);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_swaps_user ON swaps(user_id)`);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_swaps_idempotency ON swaps(idempotency_key)`);

            // Referrals Table
            await executeStmt(`
                CREATE TABLE IF NOT EXISTS referrals (
                    id SERIAL PRIMARY KEY,
                    referrer_id INTEGER NOT NULL,
                    referred_id INTEGER NOT NULL UNIQUE,
                    bonus_amount DECIMAL(15, 2) DEFAULT 0.00,
                    status VARCHAR(255) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id)`);

            // Notifications Table
            await executeStmt(`
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
                )
            `);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)`);

            // Profit History Table
            await executeStmt(`
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
                )
            `);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_profit_user ON profit_history(user_id)`);

            // Wallet Connections Table
            await executeStmt(`
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
                )
            `);

            // KYC Submissions Table
            await executeStmt(`
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
                )
            `);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_submissions(user_id)`);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_submissions(status)`);

            // Support Tickets Table
            await executeStmt(`
                CREATE TABLE IF NOT EXISTS support_tickets (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    subject VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    category VARCHAR(100) DEFAULT 'general',
                    status VARCHAR(50) DEFAULT 'open',
                    priority VARCHAR(20) DEFAULT 'normal',
                    assigned_to INTEGER DEFAULT NULL,
                    last_reply_at TIMESTAMP NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            await executeStmt(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_to INTEGER DEFAULT NULL`);
            await executeStmt(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS last_reply_at TIMESTAMP NULL`);
            await executeStmt(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

            // Support Messages Table
            await executeStmt(`
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
                )
            `);
            await executeStmt(`CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id)`);

            // Wallet Providers Table
            await executeStmt(`
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
                )
            `);

            // Site Settings Table
            await executeStmt(`
                CREATE TABLE IF NOT EXISTS site_settings (
                    id SERIAL PRIMARY KEY,
                    setting_key VARCHAR(100) UNIQUE NOT NULL,
                    setting_value TEXT DEFAULT NULL,
                    setting_type VARCHAR(20) DEFAULT 'text',
                    category VARCHAR(50) DEFAULT 'general',
                    description TEXT DEFAULT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Email Templates Table
            await executeStmt(`
                CREATE TABLE IF NOT EXISTS email_templates (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    subject VARCHAR(255) NOT NULL,
                    html_body TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Seed Admin Users with valid bcrypt hashes for password "admin123"
            const adminPasswordHash = await bcrypt.hash('admin123', 10);
            
            const defaultAdmins = [
                { email: 'admin@emporiumcapitals.com', name: 'Super Admin', role: 'super_admin' },
                { email: 'jmauricennadi@gmail.com', name: 'Super Admin', role: 'super_admin' },
                { email: 'admin@example.com', name: 'Administrator', role: 'admin' }
            ];

            if (process.env.ADMIN_EMAIL && !defaultAdmins.some(a => a.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase())) {
                defaultAdmins.push({ email: process.env.ADMIN_EMAIL.toLowerCase(), name: 'Admin', role: 'super_admin' });
            }

            for (const admin of defaultAdmins) {
                await db(
                    `INSERT INTO admin_users (email, password, name, role, is_active)
                     VALUES ($1, $2, $3, $4, true)
                     ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, is_active = true`,
                    [admin.email, adminPasswordHash, admin.name, admin.role]
                );
            }

            // Seed Default Investment Plans
            const defaultPlans = [
                { name: 'Starter', percentage: 5.00, duration: '7 days', min: 100.00, max: 999.99, desc: 'Perfect for beginners testing the waters', color: '#3b82f6', featured: false },
                { name: 'Basic', percentage: 10.00, duration: '14 days', min: 1000.00, max: 4999.99, desc: 'Balanced growth for steady investors', color: '#10b981', featured: false },
                { name: 'Premium', percentage: 15.00, duration: '30 days', min: 5000.00, max: 9999.99, desc: 'Most popular - optimal risk/reward', color: '#ef4d45', featured: true },
                { name: 'Gold', percentage: 20.00, duration: '60 days', min: 10000.00, max: 49999.99, desc: 'Advanced traders seeking higher returns', color: '#f59e0b', featured: false },
                { name: 'Platinum', percentage: 25.00, duration: '90 days', min: 50000.00, max: 999999.99, desc: 'Elite tier for maximum compounding', color: '#8b5cf6', featured: false }
            ];

            for (const plan of defaultPlans) {
                await db(
                    `INSERT INTO investment_plans (name, percentage, duration, min_investment, max_investment, description, color, featured)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT (name) DO NOTHING`,
                    [plan.name, plan.percentage, plan.duration, plan.min, plan.max, plan.desc, plan.color, plan.featured]
                );
            }

            // Seed Default Site Settings
            const defaultSettings = [
                ['site_name', 'Emporium Capitals', 'text', 'general', 'Website name'],
                ['site_tagline', 'Premium Crypto Investment Platform', 'text', 'general', 'Website tagline'],
                ['site_logo', '/assets/logo.png', 'text', 'general', 'Logo URL'],
                ['primary_color', '#ef4d45', 'color', 'branding', 'Primary brand color'],
                ['support_email', 'support@emporiumcapitals.com', 'text', 'general', 'Support email'],
                ['min_deposit', '100', 'number', 'finance', 'Minimum deposit amount'],
                ['max_deposit', '100000', 'number', 'finance', 'Maximum deposit amount'],
                ['min_withdrawal', '50', 'number', 'finance', 'Minimum withdrawal amount'],
                ['max_withdrawal', '50000', 'number', 'finance', 'Maximum withdrawal amount'],
                ['withdrawal_fee', '2', 'number', 'finance', 'Withdrawal fee percentage'],
                ['swap_fee', '0.5', 'number', 'finance', 'Swap fee percentage'],
                ['referral_bonus', '5', 'number', 'referral', 'Referral bonus percentage'],
                ['kyc_required', 'false', 'boolean', 'kyc', 'Require KYC for withdrawals'],
                ['maintenance_mode', 'false', 'boolean', 'general', 'Enable maintenance mode'],
                ['registration_enabled', 'true', 'boolean', 'general', 'Allow new registrations'],
                ['two_factor_required', 'false', 'boolean', 'security', 'Require 2FA for all users']
            ];

            for (const [key, val, type, cat, desc] of defaultSettings) {
                await db(
                    `INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (setting_key) DO NOTHING`,
                    [key, val, type, cat, desc]
                );
            }

            // Seed Default Email Templates
            const defaultTemplates = [
                ['welcome', 'Welcome to Emporium Capitals', '<h1>Welcome {{name}}!</h1><p>Thank you for joining Emporium Capitals.</p>'],
                ['deposit_confirmed', 'Deposit Confirmed', '<h1>Deposit Confirmed</h1><p>Hello {{name}},</p><p>Your deposit of {{amount}} {{currency}} has been confirmed.</p>'],
                ['withdrawal_approved', 'Withdrawal Approved', '<h1>Withdrawal Approved</h1><p>Hello {{name}},</p><p>Your withdrawal of {{amount}} has been approved.</p>'],
                ['kyc_approved', 'KYC Verified', '<h1>KYC Approved</h1><p>Hello {{name}},</p><p>Your identity verification has been approved.</p>'],
                ['kyc_rejected', 'KYC Update Required', '<h1>KYC Rejected</h1><p>Hello {{name}},</p><p>Reason: {{reason}}</p>']
            ];

            for (const [name, subject, body] of defaultTemplates) {
                await db(
                    `INSERT INTO email_templates (name, subject, html_body)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (name) DO NOTHING`,
                    [name, subject, body]
                );
            }

            return true;
        } catch (err) {
            console.error('Schema auto-ensure error:', err);
            return false;
        } finally {
            isMigrating = null;
        }
    })();

    return isMigrating;
}

export async function query(sqlQuery, params = []) {
    const database = getDb();
    try {
        const result = await database(sqlQuery, params);
        return result;
    } catch (error) {
        // Auto-migrate if relation or column does not exist (Postgres codes: 42P01, 42703)
        const isMissingRelationOrCol =
            error?.code === '42P01' ||
            error?.code === '42703' ||
            String(error?.message || '').includes('does not exist');

        if (isMissingRelationOrCol) {
            try {
                await ensureSchema();
                // Retry query once after auto-migration
                const retryResult = await database(sqlQuery, params);
                return retryResult;
            } catch (retryError) {
                console.error('Database query retry failed:', retryError);
                throw retryError;
            }
        }

        console.error('Database query error:', error);
        console.error('SQL:', sqlQuery);
        console.error('Params:', params);
        throw error;
    }
}

