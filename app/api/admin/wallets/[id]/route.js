import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';

export async function GET(request, { params }) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const rows = await query(
            `SELECT id, name, slug, api_key, api_secret, api_base_url, webhook_secret,
                    config, is_active, created_at, updated_at
             FROM wallet_providers
             WHERE id = $1`,
            [id]
        );

        if (!rows[0]) {
            return NextResponse.json({ error: 'Wallet provider not found' }, { status: 404 });
        }

        const provider = rows[0];
        provider.api_key = decrypt(provider.api_key);
        provider.api_secret = decrypt(provider.api_secret);
        provider.webhook_secret = decrypt(provider.webhook_secret);

        return NextResponse.json({ provider });
    } catch (error) {
        console.error('Wallet provider get error:', error);
        return NextResponse.json({ error: 'Failed to fetch wallet provider' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, slug, api_key, api_secret, api_base_url, webhook_secret, config, is_active } = body;

        const existing = await query('SELECT id, slug FROM wallet_providers WHERE id = $1', [id]);
        if (!existing[0]) {
            return NextResponse.json({ error: 'Wallet provider not found' }, { status: 404 });
        }

        if (slug && slug !== existing[0].slug) {
            const slugCheck = await query('SELECT id FROM wallet_providers WHERE slug = $1 AND id != $2', [slug, id]);
            if (slugCheck[0]) {
                return NextResponse.json({ error: 'Slug already in use' }, { status: 409 });
            }
        }

        const encryptedApiKey = api_key !== undefined ? encrypt(api_key) : undefined;
        const encryptedApiSecret = api_secret !== undefined ? encrypt(api_secret) : undefined;
        const encryptedWebhookSecret = webhook_secret !== undefined ? encrypt(webhook_secret) : undefined;

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) { updates.push(`name = $${paramIndex}`); values.push(name); paramIndex++; }
        if (slug !== undefined) { updates.push(`slug = $${paramIndex}`); values.push(slug); paramIndex++; }
        if (api_key !== undefined) { updates.push(`api_key = $${paramIndex}`); values.push(encryptedApiKey); paramIndex++; }
        if (api_secret !== undefined) { updates.push(`api_secret = $${paramIndex}`); values.push(encryptedApiSecret); paramIndex++; }
        if (api_base_url !== undefined) { updates.push(`api_base_url = $${paramIndex}`); values.push(api_base_url); paramIndex++; }
        if (webhook_secret !== undefined) { updates.push(`webhook_secret = $${paramIndex}`); values.push(encryptedWebhookSecret); paramIndex++; }
        if (config !== undefined) { updates.push(`config = $${paramIndex}`); values.push(JSON.stringify(config)); paramIndex++; }
        if (is_active !== undefined) { updates.push(`is_active = $${paramIndex}`); values.push(is_active); paramIndex++; }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        updates.push('updated_at = NOW()');
        values.push(id);

        await query(
            `UPDATE wallet_providers SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            values
        );

        const updated = await query(
            `SELECT id, name, slug, api_base_url, is_active, config, created_at, updated_at
             FROM wallet_providers WHERE id = $1`,
            [id]
        );

        await logAdminAction(admin.id, 'wallet_provider_update', 'wallet_provider', id, {
            fields_updated: Object.keys(body),
        });

        return NextResponse.json({ provider: updated[0] });
    } catch (error) {
        console.error('Wallet provider update error:', error);
        return NextResponse.json({ error: 'Failed to update wallet provider' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const existing = await query(
            'SELECT id, name, slug FROM wallet_providers WHERE id = $1',
            [id]
        );

        if (!existing[0]) {
            return NextResponse.json({ error: 'Wallet provider not found' }, { status: 404 });
        }

        await query('DELETE FROM wallet_providers WHERE id = $1', [id]);

        await logAdminAction(admin.id, 'wallet_provider_delete', 'wallet_provider', id, {
            name: existing[0].name,
            slug: existing[0].slug,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Wallet provider delete error:', error);
        return NextResponse.json({ error: 'Failed to delete wallet provider' }, { status: 500 });
    }
}
