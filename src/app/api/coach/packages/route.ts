import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, AuthUser } from '@/lib/auth';
import { createPackageSchema, formatZodErrors } from '@/lib/validators';
import { UserRole } from '@prisma/client';

// GET - Get coach's packages
export async function GET(req: NextRequest) {
    try {
        let user: AuthUser;
        try {
            user = await requireRole(UserRole.COACH);
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

        const packages = await prisma.package.findMany({
            where: { coachId: profile.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(packages);
    } catch (error) {
        console.error('Get packages error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create package
export async function POST(req: NextRequest) {
    try {
        let user: AuthUser;
        try {
            user = await requireRole(UserRole.COACH);
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await prisma.coachProfile.findUnique({
            where: { userId: user.userId },
            select: { id: true, startingRate: true },
        });

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            );
        }

        // Check package limit
        const count = await prisma.package.count({
            where: { coachId: profile.id, isActive: true },
        });

        if (count >= 10) {
            return NextResponse.json(
                { error: 'Package limit reached (max 10 active packages)' },
                { status: 400 }
            );
        }

        const body = await req.json();
        const validation = createPackageSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatZodErrors(validation.error) },
                { status: 400 }
            );
        }

        const pkg = await prisma.package.create({
            data: {
                coachId: profile.id,
                ...validation.data,
            },
        });

        // Update starting rate if this is cheaper
        if (
            profile.startingRate === 0 ||
            validation.data.priceCents < profile.startingRate
        ) {
            await prisma.coachProfile.update({
                where: { id: profile.id },
                data: { startingRate: validation.data.priceCents },
            });
        }

        return NextResponse.json(pkg, { status: 201 });
    } catch (error) {
        console.error('Create package error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
