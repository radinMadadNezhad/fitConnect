import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, AuthUser } from '@/lib/auth';
import { z } from 'zod';
import { formatZodErrors } from '@/lib/validators';

const updateUserProfileSchema = z.object({
    displayName: z.string().min(2).max(50).optional().nullable().transform(val => val || null),
    avatar: z.string().url().optional().nullable().or(z.literal('')).transform(val => val || null),
});


// GET - Get current user's profile
export async function GET() {
    try {
        let user: AuthUser;
        try {
            user = await requireAuth();
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userData = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
                id: true,
                email: true,
                displayName: true,
                avatar: true,
                role: true,
                createdAt: true,
                coachProfile: {
                    select: {
                        id: true,
                        displayName: true,
                        bio: true,
                        tagline: true,
                        location: true,
                        specialties: true,
                        certifications: true,
                        languages: true,
                        responseTime: true,
                        startingRate: true,
                        ratingAvg: true,
                        ratingCount: true,
                        sessionsCompleted: true,
                        isActive: true,
                    },
                },
            },
        });

        if (!userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(userData);
    } catch (error) {
        console.error('Get user profile error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH - Update user's basic profile (displayName, avatar)
export async function PATCH(req: NextRequest) {
    try {
        let user: AuthUser;
        try {
            user = await requireAuth();
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validation = updateUserProfileSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatZodErrors(validation.error) },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.userId },
            data: validation.data,
            select: {
                id: true,
                email: true,
                displayName: true,
                avatar: true,
                role: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Update user profile error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
