import { describe, it, expect } from 'vitest';
import { calculateFees, PLATFORM_FEE_PERCENT } from '@/lib/stripe';

/**
 * These assertions guard the revenue split. A regression here silently
 * overcharges coaches or underpays the platform on every booking, so the
 * invariants matter more than the specific numbers.
 */
describe('calculateFees', () => {
    it('uses the configured platform fee percentage', () => {
        expect(PLATFORM_FEE_PERCENT).toBe(10);
    });

    it('splits a $75 session into a 10% fee and the remainder', () => {
        const { amountCents, platformFeeCents, payoutCents } = calculateFees(7500);

        expect(amountCents).toBe(7500);
        expect(platformFeeCents).toBe(750);
        expect(payoutCents).toBe(6750);
    });

    it('splits a $750 package the same way', () => {
        const { platformFeeCents, payoutCents } = calculateFees(75000);

        expect(platformFeeCents).toBe(7500);
        expect(payoutCents).toBe(67500);
    });

    // The invariant that actually protects the business: nothing may be
    // created or destroyed by the split, at any amount.
    it.each([0, 1, 7, 99, 100, 2500, 7500, 19999, 75000, 1234567])(
        'fee + payout always reconstitutes the total (%i cents)',
        (amount) => {
            const { platformFeeCents, payoutCents } = calculateFees(amount);

            expect(platformFeeCents + payoutCents).toBe(amount);
        }
    );

    it('never returns fractional cents', () => {
        for (const amount of [333, 777, 1001, 6667]) {
            const { platformFeeCents, payoutCents } = calculateFees(amount);

            expect(Number.isInteger(platformFeeCents)).toBe(true);
            expect(Number.isInteger(payoutCents)).toBe(true);
        }
    });

    it('never takes a fee larger than the amount, and never pays out negative', () => {
        for (const amount of [0, 1, 5, 50, 100, 99999]) {
            const { platformFeeCents, payoutCents } = calculateFees(amount);

            expect(platformFeeCents).toBeLessThanOrEqual(amount);
            expect(platformFeeCents).toBeGreaterThanOrEqual(0);
            expect(payoutCents).toBeGreaterThanOrEqual(0);
        }
    });

    it('rounds a half-cent fee to the nearest cent rather than truncating', () => {
        // 10% of 75 cents is 7.5 -> rounds to 8, payout takes the remainder.
        const { platformFeeCents, payoutCents } = calculateFees(75);

        expect(platformFeeCents).toBe(8);
        expect(payoutCents).toBe(67);
    });
});
