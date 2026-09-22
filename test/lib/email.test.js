import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSendMail = vi.fn();

vi.mock('nodemailer', () => ({
    default: {
        createTransport: vi.fn(() => ({
            sendMail: mockSendMail,
        })),
    },
}));

vi.mock('@/lib/db', () => ({
    query: vi.fn(),
    getDb: vi.fn(),
}));

import { query } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import { invalidateSettingsCache } from '@/lib/settings';

describe('lib/email', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        invalidateSettingsCache();
        process.env.SMTP_USER = 'test@example.com';
        process.env.SMTP_PASSWORD = 'password123';
        delete process.env.SMTP_FROM;
    });

    it('sends verification email with dynamic site URL, site name, and disclaimer without localhost', async () => {
        query.mockResolvedValueOnce([
            { setting_key: 'site_name', setting_value: 'Quantum Capital' },
            { setting_key: 'site_url', setting_value: 'https://quantumcapital.io' },
            { setting_key: 'disclaimer_email', setting_value: 'Custom regulatory and risk notice for investors.' },
        ]);

        mockSendMail.mockResolvedValueOnce({ messageId: 'msg-123' });

        const req = {
            headers: new Headers({
                'x-forwarded-host': 'quantumcapital.io',
                'x-forwarded-proto': 'https',
            }),
            url: 'https://quantumcapital.io/api/auth/register',
        };

        const result = await sendVerificationEmail('investor@example.com', 'Jane Doe', 'test-token-xyz', req);
        expect(result).toBeDefined();
        expect(mockSendMail).toHaveBeenCalledTimes(1);

        const callArgs = mockSendMail.mock.calls[0][0];
        expect(callArgs.to).toBe('investor@example.com');
        expect(callArgs.subject).toContain('Verify Your Email');
        expect(callArgs.from).toContain('Quantum Capital');

        // Check HTML content
        const html = callArgs.html;
        expect(html).not.toContain('localhost:3000');
        expect(html).toContain('https://quantumcapital.io/api/auth/verify-email?token=test-token-xyz');
        expect(html).toContain('Quantum Capital');
        expect(html).toContain('Custom regulatory and risk notice for investors.');
        expect(html).toContain('Risk & Compliance Disclaimer');
    });
});
