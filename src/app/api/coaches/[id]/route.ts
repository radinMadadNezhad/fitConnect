import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const coach = await prisma.coachProfile.findUnique({
            where: { id, isActive: true },
            include: {
                packages: {
                    where: { isActive: true },
                    orderBy: { priceCents: 'asc' },
                },
                gallery: {
                    orderBy: { sortOrder: 'asc' },
                },
                reviews: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        client: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!coach) {
            return NextResponse.json(
                { error: 'Coach not found' },
                { status: 404 }
            );
        }

        // Transform to public response
        const response = {
            id: coach.id,
            userId: coach.userId,
            displayName: coach.displayName,
            bio: coach.bio,
            tagline: coach.tagline,
            location: coach.location,
            specialties: coach.specialties,
            certifications: coach.certifications,
            languages: coach.languages,
            responseTime: coach.responseTime,
            startingRate: coach.startingRate,
            ratingAvg: coach.ratingAvg,
            ratingCount: coach.ratingCount,
            sessionsCompleted: coach.sessionsCompleted,
            gallery: coach.gallery.map((img) => ({
                id: img.id,
                url: img.url,
            })),
            packages: coach.packages.map((pkg) => ({
                id: pkg.id,
                title: pkg.title,
                description: pkg.description,
                durationMins: pkg.durationMins,
                priceCents: pkg.priceCents,
                currency: pkg.currency,
                type: pkg.type,
            })),
            reviews: coach.reviews.map((review) => ({
                id: review.id,
                rating: review.rating,
                text: review.text,
                createdAt: review.createdAt,
                clientId: review.client.id,
            })),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Get coach error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
