import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { query } from './db';

const ADMIN_COOKIE = 'admin_token';

// Self-healing: creates admin tables + seeds the default admin if the
// deployed database never had admin-schema.sql run against it.
let _adminSchemaReady = false;
export async function ensureAdminSchema() {
    if (_adminSchemaReady) return;
    try {
        await query(`CREATE TABLE IF NOT EXISTS admin_users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL DEFAULT 'Admin',
            role VARCHAR(50) DEFAULT 'admin',
            permissions TEXT[] DEFAULT '{}',
            is_active BOOLEAN DEFAULT TRUE,
            last_login TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await query(`CREATE TABLE IF NOT EXISTS admin_logs (
            id SERIAL PRIMARY KEY,
            admin_id INTEGER NOT NULL,
            action VARCHAR(100) NOT NULL,
            target_type VARCHAR(50),
            target_id INTEGER,
            details JSONB DEFAULT '{}',
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        const adminEmail = (process.env.ADMIN_EMAIL || 'jmauricennadi@gmail.com').trim().toLowerCase();
        const existing = await query('SELECT id FROM admin_users WHERE LOWER(email)=$1 LIMIT 1', [adminEmail]);
        if (!existing.length) {
            const hash = await bcrypt.hash('admin123', 12);
            await query(
                "INSERT INTO admin_users (email, password, name, role) VALUES ($1, $2, 'Super Admin', 'super_admin') ON CONFLICT (email) DO NOTHING",
                [adminEmail, hash]
            );
        }
        _adminSchemaReady = true;
    } catch (e) {
        console.error('ensureAdminSchema failed:', e.message);
    }
}

function getSecretKey() {
    const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error('ADMIN_JWT_SECRET or JWT_SECRET required');
    return new TextEncoder().encode(secret);
}

export async function signAdminToken(payload, expiresIn = '24h') {
    return new SignJWT({ ...payload, isAdmin: true })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(getSecretKey());
}

export async function verifyAdminToken(token) {
    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        return payload?.isAdmin ? payload : null;
    } catch { return null; }
}

export async function setAdminSessionCookie(adminId) {
    const token = await signAdminToken({ adminId });
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24
    });
}

export async function getAdminSession(req = null) {
    try {
        let token = null;

        // 1. Try from request object if passed
        if (req) {
            if (typeof req.cookies?.get === 'function') {
                const c = req.cookies.get(ADMIN_COOKIE);
                token = c?.value || c;
            }
            if (!token && typeof req.headers?.get === 'function') {
                const authHeader = req.headers.get('authorization');
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.slice(7).trim();
                }
            }
        }

        // 2. Try from Next.js cookieStore
        if (!token) {
            try {
                const cookieStore = await cookies();
                token = cookieStore.get(ADMIN_COOKIE)?.value;
            } catch {}
        }

        if (!token) return null;

        const payload = await verifyAdminToken(token);
        if (!payload || !payload.adminId) return null;

        await ensureAdminSchema();
        const rows = await query('SELECT id, email, name, role, is_active FROM admin_users WHERE id=$1 AND is_active=true', [payload.adminId]);
        return rows[0] || null;
    } catch (err) {
        console.error('getAdminSession error:', err);
        return null;
    }
}

export async function clearAdminSession() {
    const cookieStore = await cookies();
    cookieStore.delete({
        name: ADMIN_COOKIE,
        path: '/'
    });
}

export async function authenticateAdmin(email, password) {
    if (!email || !password) return null;
    await ensureAdminSchema();
    const normalizedEmail = email.trim().toLowerCase();

    let rows = await query('SELECT * FROM admin_users WHERE LOWER(email)=$1 AND is_active=true', [normalizedEmail]);
    if (!rows || !rows[0]) return null;
    
    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return null;
    
    try {
        await query('UPDATE admin_users SET last_login=NOW() WHERE id=$1', [rows[0].id]);
    } catch {}

    return { id: rows[0].id, email: rows[0].email, name: rows[0].name, role: rows[0].role };
}

export async function logAdminAction(adminId, action, targetType, targetId, details = {}, ipAddress = null) {
    try {
        await ensureAdminSchema();
        await query(
            'INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, ip_address) VALUES ($1,$2,$3,$4,$5,$6)',
            [adminId, action, targetType, targetId, JSON.stringify(details), ipAddress]
        );
    } catch (e) {
        console.error('logAdminAction failed (non-blocking):', e.message);
    }
}
