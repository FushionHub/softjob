import { getSessionUser } from '@/lib/auth';
import { sendWelcomeEmail, sendAdminNotification } from '@/lib/email';

export async function POST(request) {
    try {
        const session = await getSessionUser();
        if (!session) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email, name, username } = await request.json();

        if (!email || !name || !username) {
            return Response.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await sendWelcomeEmail(email, name);
        await sendAdminNotification(email, name, username);

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
