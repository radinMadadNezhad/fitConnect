import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, AuthUser } from '@/lib/auth';
import { paginationSchema } from '@/lib/validators';

// GET - Get coach's bookings
export async function GET(req: NextRequest) {
    try {
        let user: AuthUser;
        try {
            // Check if user is a coach by checking their role
            user = await requireAuth();
            if (user.role !== 'COACH') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await prisma.coachProfile.findUnique({
            where: { userId: user.userId },
            select: { id: true },
        });

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            );
        }

        const { searchParams } = new URL(req.url);
        const params = {
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '20',
        };

        const validation = paginationSchema.safeParse(params);
        const { page, limit } = validation.success ? validation.data : { page: 1, limit: 20 };

        const status = searchParams.get('status');
        const upcoming = searchParams.get('upcoming') === 'true';

        // Build where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {
            coachId: profile.id,
        };

        if (status) {
            where.status = { in: status.split(',') };
        }

        if (upcoming) {
            where.startTime = { gte: new Date() };
        }

        const skip = (page - 1) * limit;

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                skip,
                take: limit,
                orderBy: { startTime: 'desc' },
                include: {
                    package: {
                        select: {
                            title: true,
                            durationMins: true,
                            type: true,
                        },
                    },
                    client: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                    payment: {
                        select: {
                            status: true,
                            paidAt: true,
                        },
                    },
                },
            }),
            prisma.booking.count({ where }),
        ]);

        const data = bookings.map((booking) => ({
            id: booking.id,
            status: booking.status,
            startTime: booking.startTime,
            endTime: booking.endTime,
            amountCents: booking.amountCents,
            platformFeeCents: booking.platformFeeCents,
            payoutCents: booking.payoutCents,
            currency: booking.currency,
            package: booking.package,
            client: booking.client,
            payment: booking.payment,
            createdAt: booking.createdAt,
        }));

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get coach bookings error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
