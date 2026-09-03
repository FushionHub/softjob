import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const rows = await query(
            `SELECT id, name, subject, html_body, is_active, created_at, updated_at
             FROM email_templates
             WHERE id = $1`,
            [id]
        );

        if (!rows[0]) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({ template: rows[0] });
    } catch (error) {
        console.error('Email template get error:', error);
        return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
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
        const { name, subject, body: emailBody, is_active } = body;

        const existing = await query('SELECT id FROM email_templates WHERE id = $1', [id]);
        if (!existing[0]) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        if (name) {
            const nameCheck = await query(
                'SELECT id FROM email_templates WHERE name = $1 AND id != $2',
                [name, id]
            );
            if (nameCheck[0]) {
                return NextResponse.json({ error: 'A template with this name already exists' }, { status: 409 });
            }
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) { updates.push(`name = $${paramIndex}`); values.push(name); paramIndex++; }
        if (subject !== undefined) { updates.push(`subject = $${paramIndex}`); values.push(subject); paramIndex++; }
        if (emailBody !== undefined) { updates.push(`html_body = $${paramIndex}`); values.push(emailBody); paramIndex++; }
        if (is_active !== undefined) { updates.push(`is_active = $${paramIndex}`); values.push(is_active); paramIndex++; }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        updates.push('updated_at = NOW()');
        values.push(id);

        await query(
            `UPDATE email_templates SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            values
        );

        const updated = await query(
            `SELECT id, name, subject, html_body, is_active, created_at, updated_at
             FROM email_templates WHERE id = $1`,
            [id]
        );

        await logAdminAction(admin.id, 'email_template_update', 'email_template', id, {
            fields_updated: Object.keys(body),
        });

        return NextResponse.json({ template: updated[0] });
    } catch (error) {
        console.error('Email template update error:', error);
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
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
            'SELECT id, name FROM email_templates WHERE id = $1',
            [id]
        );

        if (!existing[0]) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        await query('DELETE FROM email_templates WHERE id = $1', [id]);

        await logAdminAction(admin.id, 'email_template_delete', 'email_template', id, {
            name: existing[0].name,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Email template delete error:', error);
        return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
}
