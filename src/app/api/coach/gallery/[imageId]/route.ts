import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, AuthUser } from '@/lib/auth';
import { UserRole } from '@prisma/client';

interface Params {
    params: Promise<{ imageId: string }>;
}

// DELETE - Remove gallery image
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        let user: AuthUser;
        try {
            user = await requireRole(UserRole.COACH);
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { imageId } = await params;

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

        // Verify the image belongs to this coach
        const image = await prisma.coachGalleryImage.findFirst({
            where: {
                id: imageId,
                coachId: profile.id,
            },
        });

        if (!image) {
            return NextResponse.json(
                { error: 'Image not found' },
                { status: 404 }
            );
        }

        await prisma.coachGalleryImage.delete({
            where: { id: imageId },
        });

        return NextResponse.json({ message: 'Image deleted' });
    } catch (error) {
        console.error('Delete gallery image error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
