import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { constructWebhookEvent, stripe } from '@/lib/stripe';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';

// Required for raw body handling in Next.js App Router
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing stripe-signature header' },
                { status: 400 }
            );
        }

        // Get raw body as text
        const body = await req.text();

        let event: Stripe.Event;
        try {
            event = constructWebhookEvent(body, signature);
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
                break;

            case 'account.updated':
                await handleAccountUpdated(event.data.object as Stripe.Account);
                break;

            case 'charge.refunded':
                await handleChargeRefunded(event.data.object as Stripe.Charge);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;

    if (!bookingId) {
        console.error('No bookingId in PaymentIntent metadata');
        return;
    }

    // Idempotency check: see if payment already recorded
    const existingPayment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (existingPayment) {
        console.log(`Payment ${paymentIntent.id} already processed`);
        return;
    }

    const platformFeeCents = parseInt(paymentIntent.metadata.platformFeeCents || '0', 10);
    const payoutCents = parseInt(paymentIntent.metadata.payoutCents || '0', 10);

    // Create payment and update booking in transaction
    await prisma.$transaction(async (tx) => {
        // Create payment record
        await tx.payment.create({
            data: {
                bookingId,
                stripePaymentIntentId: paymentIntent.id,
                status: PaymentStatus.SUCCEEDED,
                amountCents: paymentIntent.amount,
                platformFeeCents,
                payoutCents,
                currency: paymentIntent.currency,
                paidAt: new Date(),
                rawWebhookJson: paymentIntent as unknown as object,
            },
        });

        // Update booking status
        await tx.booking.update({
            where: { id: bookingId },
            data: {
                status: BookingStatus.CONFIRMED,
                stripePaymentIntentId: paymentIntent.id,
            },
        });

        // Update coach sessions count
        const booking = await tx.booking.findUnique({
            where: { id: bookingId },
            select: { coachId: true },
        });

        if (booking) {
            await tx.coachProfile.update({
                where: { id: booking.coachId },
                data: {
                    sessionsCompleted: { increment: 1 },
                },
            });
        }
    });

    console.log(`Payment succeeded for booking ${bookingId}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;

    if (!bookingId) return;

    // Update payment status if exists
    await prisma.payment.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: PaymentStatus.FAILED },
    });

    // Keep booking as PENDING_PAYMENT so they can retry
    console.log(`Payment failed for booking ${bookingId}`);
}

async function handleAccountUpdated(account: Stripe.Account) {
    // Find coach by Stripe account ID
    const profile = await prisma.coachProfile.findUnique({
        where: { stripeAccountId: account.id },
    });

    if (!profile) return;

    // Update onboarded status
    const isOnboarded = account.charges_enabled && account.payouts_enabled;

    if (profile.stripeOnboarded !== isOnboarded) {
        await prisma.coachProfile.update({
            where: { id: profile.id },
            data: { stripeOnboarded: isOnboarded },
        });
        console.log(`Coach ${profile.id} onboarded status: ${isOnboarded}`);
    }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
    if (!charge.payment_intent) return;

    const paymentIntentId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent.id;

    const payment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntentId },
        include: { booking: true },
    });

    if (!payment) return;

    await prisma.$transaction([
        prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.REFUNDED },
        }),
        prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: BookingStatus.REFUNDED },
        }),
    ]);

    console.log(`Refund processed for booking ${payment.bookingId}`);
}
