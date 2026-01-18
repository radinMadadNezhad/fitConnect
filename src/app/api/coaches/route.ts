import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { coachSearchSchema, formatZodErrors } from '@/lib/validators';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Parse query params
        const params = {
            search: searchParams.get('search') || undefined,
            location: searchParams.get('location') || undefined,
            specialties: searchParams.getAll('specialties'),
            minPrice: searchParams.get('minPrice') || undefined,
            maxPrice: searchParams.get('maxPrice') || undefined,
            minRating: searchParams.get('minRating') || undefined,
            type: searchParams.get('type') || undefined,
            sortBy: searchParams.get('sortBy') || undefined,
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '12',
        };

        const validation = coachSearchSchema.safeParse(params);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid query parameters', details: formatZodErrors(validation.error) },
                { status: 400 }
            );
        }

        const {
            search,
            location,
            specialties,
            minPrice,
            maxPrice,
            minRating,
            type,
            sortBy,
            page,
            limit,
        } = validation.data;

        // Build where clause
        const where: Prisma.CoachProfileWhereInput = {
            isActive: true,
        };

        // Search by name, bio, or specialties
        if (search) {
            where.OR = [
                { displayName: { contains: search, mode: 'insensitive' } },
                { bio: { contains: search, mode: 'insensitive' } },
                { tagline: { contains: search, mode: 'insensitive' } },
                { specialties: { hasSome: [search] } },
            ];
        }

        // Filter by location
        if (location) {
            where.location = { contains: location, mode: 'insensitive' };
        }

        // Filter by specialties
        if (specialties && specialties.length > 0) {
            where.specialties = { hasSome: specialties };
        }

        // Filter by price range
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.packages = {
                some: {
                    isActive: true,
                    ...(minPrice !== undefined && { priceCents: { gte: minPrice } }),
                    ...(maxPrice !== undefined && { priceCents: { lte: maxPrice } }),
                },
            };
        }

        // Filter by minimum rating
        if (minRating !== undefined) {
            where.ratingAvg = { gte: minRating };
        }

        // Filter by package type
        if (type) {
            where.packages = {
                some: {
                    isActive: true,
                    type,
                },
            };
        }

        // Build orderBy
        let orderBy: Prisma.CoachProfileOrderByWithRelationInput = { ratingAvg: 'desc' };

        switch (sortBy) {
            case 'rating':
                orderBy = { ratingAvg: 'desc' };
                break;
            case 'price-low':
                orderBy = { startingRate: 'asc' };
                break;
            case 'price-high':
                orderBy = { startingRate: 'desc' };
                break;
            case 'reviews':
                orderBy = { ratingCount: 'desc' };
                break;
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Execute query
        const [coaches, total] = await Promise.all([
            prisma.coachProfile.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                    packages: {
                        where: { isActive: true },
                        take: 3,
                        orderBy: { priceCents: 'asc' },
                    },
                    gallery: {
                        take: 1,
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            }),
            prisma.coachProfile.count({ where }),
        ]);

        // Transform response
        const data = coaches.map((coach) => ({
            id: coach.id,
            userId: coach.userId,
            displayName: coach.displayName,
            tagline: coach.tagline,
            location: coach.location,
            specialties: coach.specialties,
            ratingAvg: coach.ratingAvg,
            ratingCount: coach.ratingCount,
            sessionsCompleted: coach.sessionsCompleted,
            responseTime: coach.responseTime,
            startingRate: coach.startingRate,
            avatar: coach.gallery[0]?.url || null,
            packages: coach.packages.map((pkg) => ({
                id: pkg.id,
                title: pkg.title,
                durationMins: pkg.durationMins,
                priceCents: pkg.priceCents,
                type: pkg.type,
            })),
        }));

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + coaches.length < total,
            },
        });
    } catch (error) {
        console.error('Coach search error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
