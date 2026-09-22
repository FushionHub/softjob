import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { invalidateSettingsCache } from '@/lib/settings';
import fs from 'fs/promises';
import path from 'path';

const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const uploadType = formData.get('type') || 'logo'; // 'logo' | 'favicon' | 'og_image'

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file format. Allowed: PNG, JPEG, WebP, SVG, ICO' },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: 'File size exceeds maximum limit of 5MB' },
                { status: 400 }
            );
        }

        // Determine extension
        let ext = 'png';
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') ext = 'jpg';
        else if (file.type === 'image/webp') ext = 'webp';
        else if (file.type === 'image/svg+xml') ext = 'svg';
        else if (file.type.includes('icon')) ext = 'ico';

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });

        const fileName = `${uploadType}-${Date.now()}.${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await fs.writeFile(filePath, buffer);

        const publicUrl = `/uploads/${fileName}`;

        // Map to setting_key
        let settingKey = 'site_logo';
        if (uploadType === 'favicon') settingKey = 'site_favicon';
        else if (uploadType === 'og_image') settingKey = 'og_image';

        // Update database
        const existing = await query(`SELECT id FROM site_settings WHERE setting_key = $1`, [settingKey]);
        if (existing && existing.length > 0) {
            await query(
                `UPDATE site_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2`,
                [publicUrl, settingKey]
            );
        } else {
            await query(
                `INSERT INTO site_settings (setting_key, setting_value, category, setting_type, updated_at)
                 VALUES ($1, $2, 'general', 'text', NOW())`,
                [settingKey, publicUrl]
            );
        }

        // Invalidate settings cache immediately
        invalidateSettingsCache();

        await logAdminAction(admin.id, 'media_upload', 'site_settings', null, {
            type: uploadType,
            key: settingKey,
            url: publicUrl,
            size: file.size,
        });

        return NextResponse.json({
            success: true,
            url: publicUrl,
            key: settingKey,
            setting_key: settingKey,
            type: uploadType,
        });
    } catch (error) {
        console.error('Logo upload failed:', error);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }
}
