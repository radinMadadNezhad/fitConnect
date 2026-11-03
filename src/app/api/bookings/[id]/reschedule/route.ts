import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { sendBookingRescheduled } from '@/lib/email';
import { BookingStatus } from '@prisma/client';

interface Params {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const user = await verifyToken(token || '');

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { startTime } = body;

        if (!startTime) {
            return NextResponse.json({ error: 'Start time is required' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                package: true,
                client: { select: { email: true, displayName: true } },
                coach: {
                    select: {
                        displayName: true,
                        user: { select: { email: true } },
                    },
                },
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Only live bookings can be moved. Without this, a CANCELLED or REFUNDED
        // booking could be flipped back to CONFIRMED without a new payment.
        const reschedulableStatuses: BookingStatus[] = [
            BookingStatus.CONFIRMED,
            BookingStatus.PENDING_PAYMENT,
        ];

        if (!reschedulableStatuses.includes(booking.status)) {
            return NextResponse.json(
                { error: `Cannot reschedule a booking with status ${booking.status}` },
                { status: 409 }
            );
        }

        let coachProfileId: string | undefined;
        if (user.role === 'COACH') {
            const profile = await prisma.coachProfile.findUnique({
                where: { userId: user.userId },
                select: { id: true }
            });
            coachProfileId = profile?.id;
        }

        // Allow Client or Coach to reschedule
        if (booking.clientId !== user.userId && booking.coachId !== coachProfileId) {
            return NextResponse.json({ error: 'Unauthorized to reschedule this booking' }, { status: 403 });
        }

        // Calculate new end time based on package duration
        const newStart = new Date(startTime);
        const newEnd = new Date(newStart.getTime() + booking.package.durationMins * 60000);

        // Check availability (very basic check for now)
        const conflict = await prisma.booking.findFirst({
            where: {
                coachId: booking.coachId,
                status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT] },
                id: { not: id }, // Exclude current booking
                OR: [
                    {
                        startTime: { lt: newEnd },
                        endTime: { gt: newStart }
                    }
                ]
            }
        });

        if (conflict) {
            return NextResponse.json({ error: 'Time slot not available' }, { status: 409 });
        }

        // Update booking
        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                startTime: newStart,
                endTime: newEnd,
                // Status is deliberately left untouched: moving a session must not
                // promote an unpaid PENDING_PAYMENT booking to CONFIRMED.
            }
        });

        // Notify both parties of the new time. sendEmail never throws, so a
        // mail failure cannot fail an already-persisted reschedule.
        await sendBookingRescheduled({
            bookingId: booking.id,
            clientEmail: booking.client.email,
            clientName: booking.client.displayName || booking.client.email.split('@')[0],
            coachEmail: booking.coach.user.email,
            coachName: booking.coach.displayName,
            packageTitle: booking.package.title,
            previousStartTime: booking.startTime,
            startTime: newStart,
            amountCents: booking.amountCents,
            currency: booking.currency,
        });

        return NextResponse.json(updatedBooking);

    } catch (error) {
        console.error('Reschedule booking error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
