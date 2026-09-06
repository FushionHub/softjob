import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { sendWelcomeEmail, sendAdminNotification } from '@/lib/email';

export async function POST(request) {
    try {
        const session = await getSessionUser();
        if (!session) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await query('SELECT email, name, username FROM users WHERE id = $1', [session.userId]);
        if (!users || users.length === 0) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const user = users[0];
        await sendWelcomeEmail(user.email, user.name);
        await sendAdminNotification(user.email, user.name, user.username);

        return Response.json(
            { message: 'Emails sent successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error sending emails:', error);
        return Response.json(
            { error: 'Failed to send emails' },
            { status: 500 }
        );
    }
}
