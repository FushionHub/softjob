import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

export async function GET(request) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const providers = await query(
            `SELECT id, name, slug, api_base_url, is_active, config, created_at, updated_at
             FROM wallet_providers
             ORDER BY name ASC`
        );

        return NextResponse.json({ providers });
    } catch (error) {
        console.error('Wallet providers list error:', error);
        return NextResponse.json({ error: 'Failed to fetch wallet providers' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, slug, api_key, api_secret, api_base_url, webhook_secret, config } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
        }

        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
            return NextResponse.json({ error: 'Slug must be lowercase alphanumeric with hyphens only' }, { status: 400 });
        }

        const existing = await query('SELECT id FROM wallet_providers WHERE slug = $1', [slug]);
        if (existing[0]) {
            return NextResponse.json({ error: 'A provider with this slug already exists' }, { status: 409 });
        }

        const encryptedApiKey = api_key ? encrypt(api_key) : null;
        const encryptedApiSecret = api_secret ? encrypt(api_secret) : null;
        const encryptedWebhookSecret = webhook_secret ? encrypt(webhook_secret) : null;

        const result = await query(
            `INSERT INTO wallet_providers (name, slug, api_key, api_secret, api_base_url, webhook_secret, config, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
             RETURNING id, name, slug, api_base_url, is_active, config, created_at`,
            [name, slug, encryptedApiKey, encryptedApiSecret, api_base_url, encryptedWebhookSecret, JSON.stringify(config || {})]
        );

        await logAdminAction(admin.id, 'wallet_provider_create', 'wallet_provider', result[0].id, {
            name, slug, api_base_url,
        });

        return NextResponse.json({ provider: result[0] }, { status: 201 });
    } catch (error) {
        console.error('Wallet provider create error:', error);
        return NextResponse.json({ error: 'Failed to create wallet provider' }, { status: 500 });
    }
}
