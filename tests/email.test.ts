import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
    sendEmail,
    sendBookingConfirmed,
    sendBookingCancelled,
    formatMoney,
    formatSessionTime,
} from '@/lib/email';

const message = {
    to: 'someone@example.com',
    subject: 'Subject',
    html: '<p>Body</p>',
    text: 'Body',
};

const bookingCtx = {
    bookingId: 'bk1',
    clientEmail: 'client@example.com',
    clientName: 'Alex Rivera',
    coachEmail: 'coach@example.com',
    coachName: 'Sarah Mitchell',
    packageTitle: 'Single Session',
    startTime: new Date('2026-12-15T17:00:00Z'),
    amountCents: 7500,
    currency: 'usd',
};

let originalProvider: string | undefined;

beforeEach(() => {
    originalProvider = process.env.EMAIL_PROVIDER;
});

afterEach(() => {
    process.env.EMAIL_PROVIDER = originalProvider;
    delete process.env.RESEND_API_KEY;
    vi.restoreAllMocks();
});

describe('formatting', () => {
    it('renders cents as currency', () => {
        expect(formatMoney(7500)).toBe('$75.00');
        expect(formatMoney(0)).toBe('$0.00');
        expect(formatMoney(75000)).toBe('$750.00');
    });

    it('renders the session time in UTC so server output is deterministic', () => {
        const formatted = formatSessionTime(new Date('2026-12-15T17:00:00Z'));

        expect(formatted).toContain('December 15, 2026');
        expect(formatted).toContain('(UTC)');
    });
});

describe('transport selection', () => {
    it('logs instead of sending when set to console', async () => {
        process.env.EMAIL_PROVIDER = 'console';
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});

        const result = await sendEmail(message);

        expect(result).toEqual({ ok: true, transport: 'console' });
        expect(log).toHaveBeenCalled();
    });

    it('is a no-op when explicitly disabled', async () => {
        process.env.EMAIL_PROVIDER = 'none';

        const result = await sendEmail(message);

        expect(result.ok).toBe(false);
        expect(result.transport).toBe('none');
    });

    it('reports a clear error when resend is selected without a key', async () => {
        process.env.EMAIL_PROVIDER = 'resend';
        delete process.env.RESEND_API_KEY;
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await sendEmail(message);

        expect(result.ok).toBe(false);
        expect(result).toMatchObject({ transport: 'resend', error: 'RESEND_API_KEY missing' });
    });

    it('posts to the resend API when configured', async () => {
        process.env.EMAIL_PROVIDER = 'resend';
        process.env.RESEND_API_KEY = 're_test_key';
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ id: 'email_123' }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await sendEmail(message);

        expect(result).toMatchObject({ ok: true, transport: 'resend', id: 'email_123' });
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://api.resend.com/emails');
        expect(init.headers.Authorization).toBe('Bearer re_test_key');
        expect(JSON.parse(init.body).to).toEqual(['someone@example.com']);
    });
});

/**
 * The critical guarantee: a booking must never fail because mail failed.
 */
describe('failure isolation', () => {
    it('does not throw when the provider returns an error status', async () => {
        process.env.EMAIL_PROVIDER = 'resend';
        process.env.RESEND_API_KEY = 're_test_key';
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => 'bad domain' })
        );

        const result = await sendEmail(message);

        expect(result.ok).toBe(false);
        // Narrow the discriminated union before reading the failure detail.
        if (result.ok) throw new Error('expected send to fail');
        expect(result.error).toBe('HTTP 422');
    });

    it('does not throw when the network call rejects', async () => {
        process.env.EMAIL_PROVIDER = 'resend';
        process.env.RESEND_API_KEY = 're_test_key';
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

        const result = await sendEmail(message);

        expect(result.ok).toBe(false);
        if (result.ok) throw new Error('expected send to fail');
        expect(result.error).toBe('ECONNREFUSED');
    });
});

describe('booking templates', () => {
    it('notifies both the client and the coach on confirmation', async () => {
        process.env.EMAIL_PROVIDER = 'console';
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});

        const results = await sendBookingConfirmed(bookingCtx);

        expect(results).toHaveLength(2);
        expect(results.every((r) => r.ok)).toBe(true);

        const output = log.mock.calls.map((c) => String(c[0])).join('\n');
        expect(output).toContain('client@example.com');
        expect(output).toContain('coach@example.com');
        expect(output).toContain('$75.00');
        expect(output).toContain('Single Session');
    });

    it('states the refund outcome on cancellation', async () => {
        process.env.EMAIL_PROVIDER = 'console';
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});

        await sendBookingCancelled({ ...bookingCtx, refunded: true, cancelledByRole: 'coach' });

        const output = log.mock.calls.map((c) => String(c[0])).join('\n');
        expect(output).toContain('refund');
        expect(output).toContain('Cancelled by the coach');
    });

    it('says there is nothing to refund when no payment was captured', async () => {
        process.env.EMAIL_PROVIDER = 'console';
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});

        await sendBookingCancelled({ ...bookingCtx, refunded: false, cancelledByRole: 'client' });

        const output = log.mock.calls.map((c) => String(c[0])).join('\n');
        expect(output).toContain('nothing to refund');
    });
});
