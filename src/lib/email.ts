/**
 * Transactional email.
 *
 * Provider-agnostic on purpose: `sendEmail` resolves a transport at call time
 * from the environment, so adding a provider means adding a case here and
 * nothing else changes.
 *
 * Two rules this module always honours:
 *  1. Sending never throws. A booking must not fail because a mail provider is
 *     down, so every failure is logged and swallowed (the result says what
 *     happened if a caller wants to react).
 *  2. With no provider configured it logs instead of silently dropping mail,
 *     so local development shows exactly what would have been sent.
 */

export type EmailResult =
    | { ok: true; transport: 'resend' | 'console'; id?: string }
    | { ok: false; transport: string; error: string };

export interface EmailMessage {
    to: string;
    subject: string;
    html: string;
    text: string;
}

type Transport = 'resend' | 'console' | 'none';

function resolveTransport(): Transport {
    const explicit = process.env.EMAIL_PROVIDER?.toLowerCase();

    if (explicit === 'none') return 'none';
    if (explicit === 'console') return 'console';
    if (explicit === 'resend' || process.env.RESEND_API_KEY) return 'resend';

    // Unconfigured: log in development, stay quiet in production rather than
    // filling logs with mail bodies.
    return process.env.NODE_ENV === 'production' ? 'none' : 'console';
}

function fromAddress(): string {
    return process.env.EMAIL_FROM || 'FitConnect <onboarding@resend.dev>';
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
    const transport = resolveTransport();

    if (transport === 'none') {
        return { ok: false, transport: 'none', error: 'No email provider configured' };
    }

    if (transport === 'console') {
        console.log(
            `[email] would send to=${message.to} subject="${message.subject}"\n${message.text}`
        );
        return { ok: true, transport: 'console' };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('[email] EMAIL_PROVIDER=resend but RESEND_API_KEY is not set');
        return { ok: false, transport: 'resend', error: 'RESEND_API_KEY missing' };
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: fromAddress(),
                to: [message.to],
                subject: message.subject,
                html: message.html,
                text: message.text,
            }),
        });

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            console.error(`[email] resend failed ${res.status}: ${body.slice(0, 300)}`);
            return { ok: false, transport: 'resend', error: `HTTP ${res.status}` };
        }

        const json = (await res.json().catch(() => ({}))) as { id?: string };
        return { ok: true, transport: 'resend', id: json.id };
    } catch (err) {
        console.error('[email] resend threw', err);
        return {
            ok: false,
            transport: 'resend',
            error: err instanceof Error ? err.message : 'unknown error',
        };
    }
}

// ============================================
// FORMATTING HELPERS
// ============================================

export function formatMoney(amountCents: number, currency = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amountCents / 100);
}

export function formatSessionTime(when: Date): string {
    // Explicit timezone keeps server output deterministic regardless of host TZ.
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'UTC',
    }).format(when) + ' (UTC)';
}

function appUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function layout(heading: string, bodyHtml: string): string {
    return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f6f6f6;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#18181b">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
    <h1 style="margin:0 0 16px;font-size:20px">${heading}</h1>
    ${bodyHtml}
    <hr style="margin:28px 0;border:0;border-top:1px solid #e4e4e7">
    <p style="margin:0;font-size:12px;color:#71717a">
      FitConnect &middot; <a href="${appUrl()}" style="color:#71717a">${appUrl()}</a>
    </p>
  </div>
</body></html>`;
}

// ============================================
// TEMPLATES
// ============================================

export interface BookingEmailContext {
    clientEmail: string;
    clientName: string;
    coachEmail: string;
    coachName: string;
    packageTitle: string;
    startTime: Date;
    amountCents: number;
    currency?: string;
    bookingId: string;
}

/** Sent to both parties once payment succeeds and the booking is CONFIRMED. */
export async function sendBookingConfirmed(ctx: BookingEmailContext): Promise<EmailResult[]> {
    const when = formatSessionTime(ctx.startTime);
    const amount = formatMoney(ctx.amountCents, ctx.currency);

    const clientText = `Your session is confirmed.\n\nCoach: ${ctx.coachName}\nPackage: ${ctx.packageTitle}\nWhen: ${when}\nPaid: ${amount}\n\nManage it at ${appUrl()}/dashboard/client`;
    const coachText = `${ctx.clientName} booked a session with you.\n\nClient: ${ctx.clientName}\nPackage: ${ctx.packageTitle}\nWhen: ${when}\nAmount: ${amount}\n\nSee it at ${appUrl()}/dashboard/coach/bookings`;

    return Promise.all([
        sendEmail({
            to: ctx.clientEmail,
            subject: `Your session with ${ctx.coachName} is confirmed`,
            text: clientText,
            html: layout(
                'Your session is confirmed',
                `<p style="margin:0 0 12px">You're booked in with <strong>${ctx.coachName}</strong>.</p>
                 <p style="margin:0 0 4px"><strong>Package:</strong> ${ctx.packageTitle}</p>
                 <p style="margin:0 0 4px"><strong>When:</strong> ${when}</p>
                 <p style="margin:0 0 16px"><strong>Paid:</strong> ${amount}</p>
                 <a href="${appUrl()}/dashboard/client" style="display:inline-block;background:#18181b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">View booking</a>`
            ),
        }),
        sendEmail({
            to: ctx.coachEmail,
            subject: `New booking from ${ctx.clientName}`,
            text: coachText,
            html: layout(
                'You have a new booking',
                `<p style="margin:0 0 12px"><strong>${ctx.clientName}</strong> booked a session with you.</p>
                 <p style="margin:0 0 4px"><strong>Package:</strong> ${ctx.packageTitle}</p>
                 <p style="margin:0 0 4px"><strong>When:</strong> ${when}</p>
                 <p style="margin:0 0 16px"><strong>Amount:</strong> ${amount}</p>
                 <a href="${appUrl()}/dashboard/coach/bookings" style="display:inline-block;background:#18181b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">View bookings</a>`
            ),
        }),
    ]);
}

/** Sent to both parties when a booking is cancelled. */
export async function sendBookingCancelled(
    ctx: BookingEmailContext & { refunded: boolean; cancelledByRole: 'client' | 'coach' | 'admin' }
): Promise<EmailResult[]> {
    const when = formatSessionTime(ctx.startTime);
    const refundLine = ctx.refunded
        ? `A refund of ${formatMoney(ctx.amountCents, ctx.currency)} is on its way and usually lands within 5-10 business days.`
        : 'No payment had been captured, so there is nothing to refund.';
    const by = `Cancelled by the ${ctx.cancelledByRole}.`;

    const body = (who: string) =>
        `${who}\n\nPackage: ${ctx.packageTitle}\nWas scheduled for: ${when}\n${by}\n${refundLine}`;

    return Promise.all([
        sendEmail({
            to: ctx.clientEmail,
            subject: `Your session with ${ctx.coachName} was cancelled`,
            text: body(`Your session with ${ctx.coachName} has been cancelled.`),
            html: layout(
                'Session cancelled',
                `<p style="margin:0 0 12px">Your session with <strong>${ctx.coachName}</strong> has been cancelled.</p>
                 <p style="margin:0 0 4px"><strong>Package:</strong> ${ctx.packageTitle}</p>
                 <p style="margin:0 0 4px"><strong>Was scheduled for:</strong> ${when}</p>
                 <p style="margin:0 0 12px;color:#71717a">${by}</p>
                 <p style="margin:0 0 16px">${refundLine}</p>
                 <a href="${appUrl()}/coaches" style="display:inline-block;background:#18181b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Book another session</a>`
            ),
        }),
        sendEmail({
            to: ctx.coachEmail,
            subject: `Booking with ${ctx.clientName} was cancelled`,
            text: body(`Your session with ${ctx.clientName} has been cancelled.`),
            html: layout(
                'Booking cancelled',
                `<p style="margin:0 0 12px">Your session with <strong>${ctx.clientName}</strong> has been cancelled.</p>
                 <p style="margin:0 0 4px"><strong>Package:</strong> ${ctx.packageTitle}</p>
                 <p style="margin:0 0 4px"><strong>Was scheduled for:</strong> ${when}</p>
                 <p style="margin:0 0 12px;color:#71717a">${by}</p>
                 <p style="margin:0">${refundLine}</p>`
            ),
        }),
    ]);
}

/** Sent to both parties when a booking moves to a new time. */
export async function sendBookingRescheduled(
    ctx: BookingEmailContext & { previousStartTime: Date }
): Promise<EmailResult[]> {
    const before = formatSessionTime(ctx.previousStartTime);
    const after = formatSessionTime(ctx.startTime);

    const body = (who: string) =>
        `${who}\n\nPackage: ${ctx.packageTitle}\nWas: ${before}\nNow: ${after}`;

    const html = (who: string, dashboard: string) =>
        layout(
            'Session rescheduled',
            `<p style="margin:0 0 12px">${who}</p>
             <p style="margin:0 0 4px"><strong>Package:</strong> ${ctx.packageTitle}</p>
             <p style="margin:0 0 4px;color:#71717a"><strong>Was:</strong> <s>${before}</s></p>
             <p style="margin:0 0 16px"><strong>Now:</strong> ${after}</p>
             <a href="${dashboard}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">View booking</a>`
        );

    return Promise.all([
        sendEmail({
            to: ctx.clientEmail,
            subject: `Your session with ${ctx.coachName} moved to a new time`,
            text: body(`Your session with ${ctx.coachName} has been rescheduled.`),
            html: html(
                `Your session with <strong>${ctx.coachName}</strong> has been rescheduled.`,
                `${appUrl()}/dashboard/client`
            ),
        }),
        sendEmail({
            to: ctx.coachEmail,
            subject: `Session with ${ctx.clientName} moved to a new time`,
            text: body(`Your session with ${ctx.clientName} has been rescheduled.`),
            html: html(
                `Your session with <strong>${ctx.clientName}</strong> has been rescheduled.`,
                `${appUrl()}/dashboard/coach/bookings`
            ),
        }),
    ]);
}

/** Sent once on signup. */
export async function sendWelcome(params: {
    email: string;
    name?: string | null;
    role: 'CLIENT' | 'COACH' | 'ADMIN';
}): Promise<EmailResult> {
    const greeting = params.name ? `Welcome, ${params.name}` : 'Welcome to FitConnect';
    const isCoach = params.role === 'COACH';

    const nextStep = isCoach
        ? 'Finish setting up your profile and connect payouts so clients can book you.'
        : 'Browse coaches and book your first session whenever you are ready.';
    const cta = isCoach
        ? `${appUrl()}/dashboard/coach/settings`
        : `${appUrl()}/coaches`;
    const ctaLabel = isCoach ? 'Set up your profile' : 'Browse coaches';

    return sendEmail({
        to: params.email,
        subject: greeting,
        text: `${greeting}\n\n${nextStep}\n\n${cta}`,
        html: layout(
            greeting,
            `<p style="margin:0 0 16px">${nextStep}</p>
             <a href="${cta}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${ctaLabel}</a>`
        ),
    });
}
