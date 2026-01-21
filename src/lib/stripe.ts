import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
});

// Platform fee percentage (default 10%)
export const PLATFORM_FEE_PERCENT = parseInt(
    process.env.STRIPE_PLATFORM_FEE_PERCENT || '10',
    10
);

/**
 * Calculate platform fee and coach payout from total amount
 */
export function calculateFees(amountCents: number): {
    amountCents: number;
    platformFeeCents: number;
    payoutCents: number;
} {
    const platformFeeCents = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100));
    const payoutCents = amountCents - platformFeeCents;

    return {
        amountCents,
        platformFeeCents,
        payoutCents,
    };
}

/**
 * Create a Stripe Connect account for a coach
 */
export async function createConnectAccount(email: string, coachId: string) {
    const account = await stripe.accounts.create({
        type: 'express',
        email,
        metadata: {
            coachId,
        },
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
    });

    return account;
}

/**
 * Generate onboarding link for Stripe Connect
 */
export async function createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
) {
    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
    });

    return accountLink;
}

/**
 * Check if a Connect account is fully onboarded
 */
export async function getAccountStatus(accountId: string) {
    const account = await stripe.accounts.retrieve(accountId);

    return {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requiresAction: account.requirements?.currently_due?.length ?? 0 > 0,
    };
}

/**
 * Create a PaymentIntent with destination charge
 * Platform collects payment and transfers to connected account minus fee
 */
export async function createPaymentIntent(params: {
    amountCents: number;
    currency: string;
    coachStripeAccountId: string;
    bookingId: string;
    clientEmail: string;
    description: string;
    applicationFeeCents?: number;
}) {
    let platformFeeCents: number;
    let payoutCents: number;

    if (params.applicationFeeCents !== undefined) {
        platformFeeCents = params.applicationFeeCents;
        payoutCents = params.amountCents - platformFeeCents;
    } else {
        const fees = calculateFees(params.amountCents);
        platformFeeCents = fees.platformFeeCents;
        payoutCents = fees.payoutCents;
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: params.amountCents,
        currency: params.currency,
        application_fee_amount: platformFeeCents,
        transfer_data: {
            destination: params.coachStripeAccountId,
        },
        metadata: {
            bookingId: params.bookingId,
            payoutCents: payoutCents.toString(),
            platformFeeCents: platformFeeCents.toString(),
        },
        receipt_email: params.clientEmail,
        description: params.description,
        automatic_payment_methods: {
            enabled: true,
        },
    });

    return {
        paymentIntent,
        platformFeeCents,
        payoutCents,
    };
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
    payload: string | Buffer,
    signature: string
): Stripe.Event {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
    );
}

/**
 * Refund a payment
 */
export async function refundPayment(paymentIntentId: string, reason?: string) {
    const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
            reason: reason || 'Booking cancelled',
        },
    });

    return refund;
}

export default stripe;
