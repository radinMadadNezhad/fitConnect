import { describe, it, expect } from 'vitest';
import {
    hashPassword,
    verifyPassword,
    signToken,
    verifyToken,
    checkRateLimit,
} from '@/lib/auth';

describe('password hashing', () => {
    it('verifies a correct password and rejects a wrong one', async () => {
        const hash = await hashPassword('correct horse battery staple');

        expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
        expect(await verifyPassword('wrong password', hash)).toBe(false);
    });

    it('never stores the password in the hash', async () => {
        const password = 'plaintext-must-not-appear';
        const hash = await hashPassword(password);

        expect(hash).not.toContain(password);
        expect(hash.startsWith('$2')).toBe(true);
    });

    it('salts, so the same password hashes differently each time', async () => {
        const a = await hashPassword('same-password');
        const b = await hashPassword('same-password');

        expect(a).not.toBe(b);
        expect(await verifyPassword('same-password', a)).toBe(true);
        expect(await verifyPassword('same-password', b)).toBe(true);
    });
});

describe('JWT round trip', () => {
    const payload = { userId: 'u1', email: 'u1@example.com', role: 'CLIENT' as const };

    it('signs and verifies its own token', async () => {
        const decoded = await verifyToken(await signToken(payload));

        expect(decoded?.userId).toBe('u1');
        expect(decoded?.email).toBe('u1@example.com');
        expect(decoded?.role).toBe('CLIENT');
    });

    it('returns null for a malformed token instead of throwing', async () => {
        await expect(verifyToken('not-a-jwt')).resolves.toBeNull();
        await expect(verifyToken('')).resolves.toBeNull();
    });

    // A token signed with a different key must never validate, or anyone could
    // mint sessions for any account.
    it('rejects a token whose signature does not match', async () => {
        const token = await signToken(payload);
        const parts = token.split('.');
        const tampered = `${parts[0]}.${parts[1]}.${'A'.repeat(parts[2].length)}`;

        await expect(verifyToken(tampered)).resolves.toBeNull();
    });

    it('rejects a token with a tampered payload', async () => {
        const token = await signToken(payload);
        const [header, , signature] = token.split('.');
        const forged = Buffer.from(
            JSON.stringify({ userId: 'u_admin', email: 'a@example.com', role: 'ADMIN' })
        ).toString('base64url');

        await expect(verifyToken(`${header}.${forged}.${signature}`)).resolves.toBeNull();
    });
});

describe('checkRateLimit', () => {
    it('allows requests up to the limit then blocks', () => {
        const id = `test-key-${Math.random()}`;
        const allowed: boolean[] = [];

        for (let i = 0; i < 12; i++) {
            allowed.push(checkRateLimit(id).allowed);
        }

        expect(allowed.slice(0, 10).every(Boolean)).toBe(true);
        expect(allowed[10]).toBe(false);
        expect(allowed[11]).toBe(false);
    });

    it('counts each identifier independently', () => {
        const a = `key-a-${Math.random()}`;
        const b = `key-b-${Math.random()}`;

        for (let i = 0; i < 10; i++) checkRateLimit(a);

        expect(checkRateLimit(a).allowed).toBe(false);
        expect(checkRateLimit(b).allowed).toBe(true);
    });

    it('reports a decreasing remaining count and a future reset time', () => {
        const id = `key-c-${Math.random()}`;
        const first = checkRateLimit(id);
        const second = checkRateLimit(id);

        expect(first.remaining).toBeGreaterThan(second.remaining);
        expect(first.resetAt).toBeGreaterThan(Date.now());
    });
});
