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

import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '@/lib/email';
import { invalidateSettingsCache } from '@/lib/settings';

describe('lib/email', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        invalidateSettingsCache();
        process.env.SMTP_USER = 'test@example.com';
        process.env.SMTP_PASSWORD = 'password123';
        delete process.env.SMTP_FROM;
    });

    it('sends verification email with correct subject and branded from address', async () => {
        mockSendMail.mockResolvedValueOnce({ messageId: 'msg-123' });

        const result = await sendVerificationEmail('investor@example.com', 'Jane Doe', 'test-token-xyz');
        expect(result).toBeDefined();
        expect(mockSendMail).toHaveBeenCalledTimes(1);

        const callArgs = mockSendMail.mock.calls[0][0];
        expect(callArgs.to).toBe('investor@example.com');
        expect(callArgs.subject).toContain('Verify Your Email');
        expect(callArgs.subject).toContain('Emporium Capitals');
        expect(callArgs.from).toContain('Emporium Capitals');

        const html = callArgs.html;
        expect(html).toContain('/api/auth/verify-email?token=test-token-xyz');
        expect(html).toContain('Emporium Capitals');
        expect(html).toContain('Verify Email Address');
    });

    it('sends welcome email with correct subject', async () => {
        mockSendMail.mockResolvedValueOnce({ messageId: 'msg-456' });

        const result = await sendWelcomeEmail('investor@example.com', 'Jane Doe');
        expect(result).toBeDefined();
        expect(mockSendMail).toHaveBeenCalledTimes(1);

        const callArgs = mockSendMail.mock.calls[0][0];
        expect(callArgs.to).toBe('investor@example.com');
        expect(callArgs.subject).toContain('Welcome to Emporium Capitals');
        expect(callArgs.from).toContain('Emporium Capitals');

        const html = callArgs.html;
        expect(html).toContain('Emporium Capitals');
        expect(html).toContain('Go to Dashboard');
    });

    it('sends password reset email with correct link', async () => {
        mockSendMail.mockResolvedValueOnce({ messageId: 'msg-789' });

        const result = await sendPasswordResetEmail('investor@example.com', 'Jane Doe', 'reset-token-abc');
        expect(result).toBeDefined();
        expect(mockSendMail).toHaveBeenCalledTimes(1);

        const callArgs = mockSendMail.mock.calls[0][0];
        expect(callArgs.to).toBe('investor@example.com');
        expect(callArgs.subject).toContain('Password Reset');
        expect(callArgs.from).toContain('Emporium Capitals');

        const html = callArgs.html;
        expect(html).toContain('reset-token-abc');
        expect(html).toContain('Emporium Capitals');
    });
});
