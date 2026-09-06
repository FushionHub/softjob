import { z } from 'zod';

const docUrl = z
    .string()
    .trim()
    .min(1, 'Document is required')
    .refine(
        (v) => v.startsWith('http://') || v.startsWith('https://') || v.startsWith('data:') || v.startsWith('/'),
        'Document must be a URL, path, or data URL'
    );

export const kycSchema = z.object({
    full_name: z.string().trim().min(2, 'Full name is required').max(255),
    date_of_birth: z
        .string()
        .refine((v) => !Number.isNaN(Date.parse(v)), 'Valid date of birth is required')
        .refine((v) => new Date(v) < new Date(), 'Date of birth must be in the past'),
    gender: z.string().trim().min(1, 'Gender is required').max(20),
    country: z.string().trim().min(1, 'Country is required').max(100),
    city: z.string().trim().min(1, 'City is required').max(100),
    address: z.string().trim().min(1, 'Address is required'),
    postal_code: z.string().trim().max(20).optional().nullable(),
    id_type: z.string().trim().min(1, 'ID type is required').max(50),
    id_number: z.string().trim().min(1, 'ID number is required').max(100),
    id_front_url: docUrl,
    id_back_url: docUrl.optional().nullable(),
    selfie_url: docUrl,
    proof_of_address_url: docUrl.optional().nullable(),
    occupation: z.string().trim().max(100).optional().nullable(),
    source_of_funds: z.string().trim().max(100).optional().nullable(),
});

export function parseKyc(body) {
    return kycSchema.safeParse(body ?? {});
}
