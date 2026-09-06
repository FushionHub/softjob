import { describe, it, expect } from 'vitest';
import { parseWithdraw } from '@/lib/validation/withdraw.js';
import { parseDeposit } from '@/lib/validation/deposit.js';
import { parseKyc } from '@/lib/validation/kyc.js';

const kycValid = {
    full_name: 'Jane Doe',
    date_of_birth: '1990-04-01',
    gender: 'female',
    country: 'Nigeria',
    city: 'Lagos',
    address: '12 Marina Street',
    id_type: 'passport',
    id_number: 'A1234567',
    id_front_url: 'https://cdn.example/id-front.jpg',
    selfie_url: 'data:image/jpeg;base64,AAA',
};

describe('parseWithdraw', () => {
    it('accepts a valid body and applies the network default', () => {
        const r = parseWithdraw({ amount: '100.5', walletAddress: 'bc1qxyz1234567890abcdef' });
        expect(r.success).toBe(true);
        expect(r.data.amount).toBe(100.5);
        expect(r.data.network).toBe('bitcoin');
    });

    it('rejects missing wallet and non-positive amounts', () => {
        expect(parseWithdraw({ amount: 100 }).success).toBe(false);
        expect(parseWithdraw({ amount: 0, walletAddress: 'bc1qxyz1234567890' }).success).toBe(false);
        expect(parseWithdraw({ amount: -3, walletAddress: 'bc1qxyz1234567890' }).success).toBe(false);
        expect(parseWithdraw({ amount: 'abc', walletAddress: 'bc1qxyz1234567890' }).success).toBe(false);
    });
});

describe('parseDeposit', () => {
    it('accepts a valid body', () => {
        const r = parseDeposit({ amount: 250, paymentMethod: 'card' });
        expect(r.success).toBe(true);
        expect(r.data.amount).toBe(250);
    });

    it('rejects missing/invalid fields', () => {
        expect(parseDeposit({ amount: 250 }).success).toBe(false);
        expect(parseDeposit({ paymentMethod: 'card' }).success).toBe(false);
        expect(parseDeposit({ amount: 0, paymentMethod: 'card' }).success).toBe(false);
        expect(parseDeposit(null).success).toBe(false);
    });
});

describe('parseKyc', () => {
    it('accepts a complete submission', () => {
        expect(parseKyc(kycValid).success).toBe(true);
    });

    it('rejects missing documents and bad dates', () => {
        const { selfie_url, ...noSelfie } = kycValid;
        expect(parseKyc(noSelfie).success).toBe(false);
        expect(parseKyc({ ...kycValid, date_of_birth: 'not-a-date' }).success).toBe(false);
        expect(parseKyc({ ...kycValid, date_of_birth: '2999-01-01' }).success).toBe(false);
        expect(parseKyc({ ...kycValid, id_front_url: 'not a url' }).success).toBe(false);
        expect(parseKyc({}).success).toBe(false);
    });
});
