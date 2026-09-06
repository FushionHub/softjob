import { z } from 'zod';

export const withdrawSchema = z.object({
    amount: z.coerce
        .number({ invalid_type_error: 'Amount must be a number' })
        .positive('Amount must be greater than 0')
        .max(10000000, 'Amount exceeds maximum'),
    walletAddress: z
        .string({ required_error: 'Wallet address is required' })
        .trim()
        .min(10, 'Wallet address looks too short')
        .max(500, 'Wallet address looks too long'),
    network: z.string().trim().min(1).max(50).default('bitcoin'),
    idempotencyKey: z.string().max(200).optional(),
    idempotency_key: z.string().max(200).optional(),
});

export function parseWithdraw(body) {
    return withdrawSchema.safeParse(body ?? {});
}
