import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
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
            include: { package: true }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
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
                status: BookingStatus.CONFIRMED // Re-confirm if it was pending? Keep simple for now.
            }
        });

        // TODO: Notify other party

        return NextResponse.json(updatedBooking);

    } catch (error) {
        console.error('Reschedule booking error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
