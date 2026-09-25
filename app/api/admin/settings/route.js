import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(request) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rows = await query(
            `SELECT id, setting_key, setting_value, setting_type, category, description, updated_at
             FROM site_settings
             ORDER BY category, setting_key`
        );

        const grouped = {};
        for (const row of rows) {
            const cat = row.category || 'general';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(row);
        }

        return NextResponse.json({ settings: grouped, total: rows.length });
    } catch (error) {
        console.error('Settings list error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { settings } = body;

        if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
            return NextResponse.json({ error: 'Settings must be an object of key:value pairs' }, { status: 400 });
        }

        const keys = Object.keys(settings);
        if (keys.length === 0) {
            return NextResponse.json({ error: 'No settings provided' }, { status: 400 });
        }

        const existingRows = await query(
            `SELECT setting_key FROM site_settings WHERE setting_key = ANY($1)`,
            [keys]
        );
        const existingKeys = new Set(existingRows.map(r => r.setting_key));

        const updatedKeys = [];
        const insertedKeys = [];

        for (const [key, value] of Object.entries(settings)) {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

            if (existingKeys.has(key)) {
                await query(
                    `UPDATE site_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2`,
                    [stringValue, key]
                );
                updatedKeys.push(key);
            } else {
                await query(
                    `INSERT INTO site_settings (setting_key, setting_value, category, setting_type, updated_at)
                     VALUES ($1, $2, 'general', 'text', NOW())`,
                    [key, stringValue]
                );
                insertedKeys.push(key);
            }
        }

        await logAdminAction(admin.id, 'settings_update', 'site_settings', null, {
            updated: updatedKeys,
            inserted: insertedKeys,
        });

        return NextResponse.json({
            success: true,
            updated: updatedKeys,
            inserted: insertedKeys,
        });
    } catch (error) {
        console.error('Settings update error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
