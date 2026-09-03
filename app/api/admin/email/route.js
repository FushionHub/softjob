import { NextResponse } from 'next/server';
import { getAdminSession, logAdminAction } from '@/lib/admin-auth';
import { query } from '@/lib/db';
import { safeSend, sendEmail } from '@/lib/email';

export async function GET(request) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const templates = await query(
            `SELECT id, name, subject, html_body, is_active, created_at, updated_at
             FROM email_templates
             ORDER BY name`
        );

        return NextResponse.json({ templates });
    } catch (error) {
        console.error('Email templates list error:', error);
        return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const admin = await getAdminSession();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { user_id, template_name, subject, body: emailBody, custom } = body;

        if (!user_id) {
            return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
        }

        const userRows = await query(
            'SELECT id, name, email FROM users WHERE id = $1',
            [user_id]
        );

        if (!userRows[0]) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userRows[0];
        let finalSubject = subject;
        let finalBody = emailBody;

        if (!custom && template_name) {
            const templateRows = await query(
                'SELECT subject, html_body FROM email_templates WHERE name = $1',
                [template_name]
            );

            if (!templateRows[0]) {
                return NextResponse.json({ error: 'Template not found' }, { status: 404 });
            }

            finalSubject = templateRows[0].subject;
            finalBody = templateRows[0].html_body;

            const variables = {
                '{{name}}': user.name || 'there',
                '{{email}}': user.email,
                '{{user_id}}': String(user.id),
                '{{date}}': new Date().toLocaleDateString(),
                '{{datetime}}': new Date().toLocaleString(),
                '{{year}}': String(new Date().getFullYear()),
            };

            for (const [placeholder, value] of Object.entries(variables)) {
                finalSubject = finalSubject.replaceAll(placeholder, value);
                finalBody = finalBody.replaceAll(placeholder, value);
            }
        }

        if (!finalSubject || !finalBody) {
            return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
        }

        safeSend(sendEmail({ to: user.email, subject: finalSubject, html: finalBody }));

        await logAdminAction(admin.id, 'email_send', 'user', user_id, {
            template_name: template_name || null,
            custom: !!custom,
            subject: finalSubject,
        });

        return NextResponse.json({ success: true, sent_to: user.email });
    } catch (error) {
        console.error('Email send error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
