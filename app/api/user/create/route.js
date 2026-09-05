import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getAdminSession } from '@/lib/admin-auth';

export async function POST(request) {
    try {
        // Admin-only: open registration lives at /api/auth/register.
        // This endpoint exists for admin-created accounts (dashboard / scripts).
        const admin = await getAdminSession();
        if (!admin) {
            return Response.json({ error: 'Unauthorized — admin only' }, { status: 401 });
        }
        const { name, email, username, phone, password, referrer } = await request.json();

        if (!name || !email || !username || !password) {
            return Response.json(
                { error: 'Missing required fields: name, email, username, password' },
                { status: 400 }
            );
        }

        // Check if user already exists by email or username
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.length > 0) {
            return Response.json(
                { message: 'User with this email or username already exists' },
                { status: 200 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert new user into database
        await query(
            `INSERT INTO users (name, email, username, phone, password, referrer, email_verified, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP)`,
            [name, email, username, phone || null, hashedPassword, referrer || null]
        );

        return Response.json(
            { message: 'User created successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating user:', error);
        return Response.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
