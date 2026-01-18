import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, AuthUser } from '@/lib/auth';
import { addGalleryImageSchema, formatZodErrors } from '@/lib/validators';
import { UserRole } from '@prisma/client';

// GET - Get coach's gallery images
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

        const gallery = await prisma.coachGalleryImage.findMany({
            where: { coachId: profile.id },
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json(gallery);
    } catch (error) {
        console.error('Get gallery error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Add gallery image
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
            select: { id: true },
        });

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            );
        }

        // Check gallery limit (max 10 images)
        const count = await prisma.coachGalleryImage.count({
            where: { coachId: profile.id },
        });

        if (count >= 10) {
            return NextResponse.json(
                { error: 'Gallery limit reached (max 10 images)' },
                { status: 400 }
            );
        }

        const body = await req.json();
        const validation = addGalleryImageSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatZodErrors(validation.error) },
                { status: 400 }
            );
        }

        const image = await prisma.coachGalleryImage.create({
            data: {
                coachId: profile.id,
                url: validation.data.url,
                sortOrder: validation.data.sortOrder ?? count,
            },
        });

        return NextResponse.json(image, { status: 201 });
    } catch (error) {
        console.error('Add gallery image error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
