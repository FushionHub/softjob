import { z } from 'zod';

export const depositSchema = z.object({
    amount: z.coerce
        .number({ invalid_type_error: 'Amount must be a number' })
        .positive('Amount must be greater than 0')
        .max(10000000, 'Amount exceeds maximum'),
    paymentMethod: z
        .string({ required_error: 'Payment method is required' })
        .trim()
        .min(1, 'Payment method is required')
        .max(50),
    planId: z.union([z.coerce.number().int().positive(), z.string(), z.null()]).optional(),
    idempotencyKey: z.string().max(200).optional(),
    idempotency_key: z.string().max(200).optional(),
    currency: z.string().trim().max(10).optional(),
    coin: z.string().trim().max(20).optional(),
});

export function parseDeposit(body) {
    return depositSchema.safeParse(body ?? {});
}
