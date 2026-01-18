import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, AuthUser } from '@/lib/auth';
import {
    createCoachProfileSchema,
    updateCoachProfileSchema,
    formatZodErrors
} from '@/lib/validators';
import { UserRole } from '@prisma/client';

// GET - Get current coach's profile
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
            include: {
                packages: {
                    orderBy: { createdAt: 'desc' },
                },
                gallery: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Get coach profile error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create coach profile (if not exists)
export async function POST(req: NextRequest) {
    try {
        let user: AuthUser;
        try {
            user = await requireRole(UserRole.COACH);
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if profile already exists
        const existing = await prisma.coachProfile.findUnique({
            where: { userId: user.userId },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Profile already exists. Use PATCH to update.' },
                { status: 409 }
            );
        }

        const body = await req.json();
        const validation = createCoachProfileSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatZodErrors(validation.error) },
                { status: 400 }
            );
        }

        const profile = await prisma.coachProfile.create({
            data: {
                userId: user.userId,
                ...validation.data,
            },
        });

        return NextResponse.json(profile, { status: 201 });
    } catch (error) {
        console.error('Create coach profile error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH - Update coach profile
export async function PATCH(req: NextRequest) {
    try {
        let user: AuthUser;
        try {
            user = await requireRole(UserRole.COACH);
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validation = updateCoachProfileSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatZodErrors(validation.error) },
                { status: 400 }
            );
        }

        const profile = await prisma.coachProfile.update({
            where: { userId: user.userId },
            data: validation.data,
        });

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Update coach profile error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
