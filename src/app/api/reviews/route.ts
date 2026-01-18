import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, AuthUser } from '@/lib/auth';
import { canCreateReview } from '@/lib/permissions';
import { createReviewSchema, formatZodErrors } from '@/lib/validators';

// POST - Create a review
export async function POST(req: NextRequest) {
    try {
        let user: AuthUser;
        try {
            user = await requireAuth();
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validation = createReviewSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatZodErrors(validation.error) },
                { status: 400 }
            );
        }

        const { bookingId, rating, text } = validation.data;

        // Get booking
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                coach: true,
                review: true,
            },
        });

        if (!booking) {
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            );
        }

        // Check this is client's booking and it's completed
        if (!canCreateReview(user, booking)) {
            return NextResponse.json(
                { error: 'Cannot review this booking' },
                { status: 403 }
            );
        }

        // Check if already reviewed
        if (booking.review) {
            return NextResponse.json(
                { error: 'This booking has already been reviewed' },
                { status: 409 }
            );
        }

        // Create review and update coach rating
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const review = await prisma.$transaction(async (tx: any) => {
            const newReview = await tx.review.create({
                data: {
                    bookingId,
                    coachId: booking.coachId,
                    clientId: user.userId,
                    rating,
                    text,
                },
            });

            // Recalculate coach rating
            const reviews = await tx.review.findMany({
                where: { coachId: booking.coachId },
                select: { rating: true },
            });

            const totalRating = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
            const avgRating = totalRating / reviews.length;

            await tx.coachProfile.update({
                where: { id: booking.coachId },
                data: {
                    ratingAvg: Math.round(avgRating * 10) / 10, // Round to 1 decimal
                    ratingCount: reviews.length,
                },
            });

            return newReview;
        });

        return NextResponse.json(review, { status: 201 });
    } catch (error) {
        console.error('Create review error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
