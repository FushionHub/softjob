import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files
const envLocal = path.join(__dirname, '..', '.env.local');
const envDefault = path.join(__dirname, '..', '.env');
if (fs.existsSync(envLocal)) {
    process.loadEnvFile?.(envLocal);
} else if (fs.existsSync(envDefault)) {
    process.loadEnvFile?.(envDefault);
}

import { query, getDb, ensureSchema } from '../lib/db.js';

async function initDatabase() {
    try {
        console.log('🚀 Initializing PostgreSQL (Neon) database for Emporium Capitals...');
        
        const success = await ensureSchema();
        if (!success) {
            console.error('❌ Schema initialization encountered errors.');
        } else {
            console.log('✅ Schema and tables created & validated successfully.');
        }

        // Verify all public tables
        const tables = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log('\n📊 Tables present in database (' + tables.length + '):');
        console.log(tables.map(t => '  • ' + t.table_name).join('\n'));

        // Verify admin users
        const admins = await query('SELECT id, email, name, role, is_active FROM admin_users');
        console.log('\n👑 Active Admin Accounts:');
        admins.forEach(a => console.log(`  • [${a.role}] ${a.email} (${a.name}) - Active: ${a.is_active}`));

        // Verify investment plans
        const plans = await query('SELECT id, name, percentage, duration, min_investment, max_investment FROM investment_plans');
        console.log('\n💼 Investment Plans (' + plans.length + '):');
        plans.forEach(p => console.log(`  • ${p.name}: ${p.percentage}% / ${p.duration} (Min: $${p.min_investment} - Max: $${p.max_investment})`));

        console.log('\n✨ All systems ready! Default admin password: admin123\n');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
}

initDatabase();

