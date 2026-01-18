import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, AuthUser } from '@/lib/auth';
import { canCancelBooking } from '@/lib/permissions';
import { refundPayment } from '@/lib/stripe';
import { cancelBookingSchema } from '@/lib/validators';

// Status constants (match Prisma schema enums)
const PaymentStatusSucceeded = 'SUCCEEDED';
const PaymentStatusRefunded = 'REFUNDED';
const BookingStatusRefunded = 'REFUNDED';
const BookingStatusCancelled = 'CANCELLED';

interface Params {
    params: Promise<{ id: string }>;
}

// POST - Cancel booking
export async function POST(req: NextRequest, { params }: Params) {
    try {
        let user: AuthUser;
        try {
            user = await requireAuth();
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get booking with coach info
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                coach: {
                    select: { userId: true },
                },
                payment: true,
            },
        });

        if (!booking) {
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            );
        }

        // Check permission (client, coach, or admin)
        const bookingForPermission = {
            clientId: booking.clientId,
            coachId: booking.coach.userId,
            status: booking.status,
        };

        if (!canCancelBooking(user, bookingForPermission)) {
            return NextResponse.json(
                { error: 'Cannot cancel this booking' },
                { status: 403 }
            );
        }

        // Parse optional reason
        const body = await req.json().catch(() => ({}));
        const validation = cancelBookingSchema.safeParse(body);
        const reason = validation.success ? validation.data.reason : undefined;

        // If payment exists and was successful, issue refund
        let refundIssued = false;
        if (
            booking.payment &&
            booking.payment.status === PaymentStatusSucceeded &&
            booking.stripePaymentIntentId
        ) {
            try {
                await refundPayment(booking.stripePaymentIntentId, reason);
                refundIssued = true;
            } catch (error) {
                console.error('Refund failed:', error);
                return NextResponse.json(
                    { error: 'Failed to process refund' },
                    { status: 500 }
                );
            }
        }

        // Update booking status
        await prisma.booking.update({
            where: { id },
            data: {
                status: refundIssued ? BookingStatusRefunded : BookingStatusCancelled,
                cancelledAt: new Date(),
                cancelReason: reason,
            },
        });

        // Update payment status if exists
        if (booking.payment && refundIssued) {
            await prisma.payment.update({
                where: { id: booking.payment.id },
                data: { status: PaymentStatusRefunded },
            });
        }

        return NextResponse.json({
            message: refundIssued ? 'Booking cancelled and refunded' : 'Booking cancelled',
            refunded: refundIssued,
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
