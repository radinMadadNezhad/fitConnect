import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, AuthUser } from '@/lib/auth';
import { createPaymentIntent, calculateFees } from '@/lib/stripe';
import { createBookingIntentSchema, formatZodErrors } from '@/lib/validators';
import { BookingStatus } from '@prisma/client';

// POST - Create booking and payment intent
export async function POST(req: NextRequest) {
    try {
        let user: AuthUser;
        try {
            user = await requireAuth();
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validation = createBookingIntentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatZodErrors(validation.error) },
                { status: 400 }
            );
        }

        const { coachId, packageId, startTime } = validation.data;
        const startDateTime = new Date(startTime);

        // Validate start time is in the future
        if (startDateTime <= new Date()) {
            return NextResponse.json(
                { error: 'Start time must be in the future' },
                { status: 400 }
            );
        }

        // Get coach profile and package
        const coach = await prisma.coachProfile.findUnique({
            where: { id: coachId, isActive: true },
            include: {
                user: { select: { id: true } },
            },
        });

        if (!coach) {
            return NextResponse.json(
                { error: 'Coach not found' },
                { status: 404 }
            );
        }

        // Cannot book yourself
        if (coach.userId === user.userId) {
            return NextResponse.json(
                { error: 'Cannot book yourself' },
                { status: 400 }
            );
        }

        // Verify coach has Stripe account
        if (!coach.stripeAccountId || !coach.stripeOnboarded) {
            return NextResponse.json(
                { error: 'Coach has not completed payment setup' },
                { status: 400 }
            );
        }

        const pkg = await prisma.package.findFirst({
            where: { id: packageId, coachId, isActive: true },
        });

        if (!pkg) {
            return NextResponse.json(
                { error: 'Package not found' },
                { status: 404 }
            );
        }

        // Calculate end time
        const endDateTime = new Date(startDateTime.getTime() + pkg.durationMins * 60 * 1000);

        // Check for overlapping bookings (double-booking prevention)
        const overlapping = await prisma.booking.findFirst({
            where: {
                coachId,
                status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT] },
                OR: [
                    // New booking starts during existing
                    {
                        startTime: { lte: startDateTime },
                        endTime: { gt: startDateTime },
                    },
                    // New booking ends during existing
                    {
                        startTime: { lt: endDateTime },
                        endTime: { gte: endDateTime },
                    },
                    // New booking contains existing
                    {
                        startTime: { gte: startDateTime },
                        endTime: { lte: endDateTime },
                    },
                ],
            },
        });

        if (overlapping) {
            return NextResponse.json(
                { error: 'This time slot is not available' },
                { status: 409 }
            );
        }

        // Calculate fees - ADD ON model
        // Fee = Price * 10%
        // Total = Price + Fee
        const platformFeeCents = Math.round(pkg.priceCents * 0.10);
        const totalAmountCents = pkg.priceCents + platformFeeCents;
        const payoutCents = pkg.priceCents;

        // Create booking in PENDING_PAYMENT status
        const booking = await prisma.booking.create({
            data: {
                coachId,
                clientId: user.userId,
                packageId,
                startTime: startDateTime,
                endTime: endDateTime,
                status: BookingStatus.PENDING_PAYMENT,
                amountCents: totalAmountCents,
                platformFeeCents: platformFeeCents,
                payoutCents: payoutCents,
                currency: pkg.currency,
            },
        });

        // Create Stripe PaymentIntent
        const { paymentIntent } = await createPaymentIntent({
            amountCents: totalAmountCents,
            currency: pkg.currency,
            coachStripeAccountId: coach.stripeAccountId,
            bookingId: booking.id,
            clientEmail: user.email,
            description: `${pkg.title} with ${coach.displayName}`,
            applicationFeeCents: platformFeeCents
        });

        // Update booking with PaymentIntent ID
        await prisma.booking.update({
            where: { id: booking.id },
            data: { stripePaymentIntentId: paymentIntent.id },
        });

        return NextResponse.json({
            bookingId: booking.id,
            clientSecret: paymentIntent.client_secret,
            amount: {
                total: totalAmountCents,
                platformFee: platformFeeCents,
                coachPayout: payoutCents,
                currency: pkg.currency,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Create booking intent error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
