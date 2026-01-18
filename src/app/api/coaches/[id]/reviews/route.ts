import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { paginationSchema } from '@/lib/validators';

interface Params {
    params: Promise<{ id: string }>;
}

// GET - Get coach's reviews
export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        // Verify coach exists
        const coach = await prisma.coachProfile.findUnique({
            where: { id },
        });

        if (!coach) {
            return NextResponse.json(
                { error: 'Coach not found' },
                { status: 404 }
            );
        }

        const { searchParams } = new URL(req.url);
        const params_ = {
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '10',
        };

        const validation = paginationSchema.safeParse(params_);
        const { page, limit } = validation.success ? validation.data : { page: 1, limit: 10 };

        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: { coachId: id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    client: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                    booking: {
                        select: {
                            package: {
                                select: {
                                    title: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.review.count({ where: { coachId: id } }),
        ]);

        // Calculate rating distribution
        const ratingDist = await prisma.review.groupBy({
            by: ['rating'],
            where: { coachId: id },
            _count: { rating: true },
        });

        const distribution = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
        };

        for (const r of ratingDist) {
            distribution[r.rating as keyof typeof distribution] = r._count.rating;
        }

        const data = reviews.map((review) => ({
            id: review.id,
            rating: review.rating,
            text: review.text,
            createdAt: review.createdAt,
            client: {
                id: review.client.id,
                // Hide email, show first letter + asterisks
                displayName: review.client.email.charAt(0) + '***',
            },
            packageTitle: review.booking.package.title,
        }));

        return NextResponse.json({
            data,
            summary: {
                average: coach.ratingAvg,
                total: coach.ratingCount,
                distribution,
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get coach reviews error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
