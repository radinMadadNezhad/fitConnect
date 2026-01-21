import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, AuthUser } from '@/lib/auth';
import { updatePackageSchema, formatZodErrors } from '@/lib/validators';
import { UserRole } from '@prisma/client';

interface Params {
    params: Promise<{ id: string }>;
}

// GET - Get single package
export async function GET(req: NextRequest, { params }: Params) {
    try {
        let user: AuthUser;
        try {
            user = await requireRole(UserRole.COACH);
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const profile = await prisma.coachProfile.findUnique({
            where: { userId: user.userId },
            select: { id: true },
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const pkg = await prisma.package.findFirst({
            where: { id, coachId: profile.id },
        });

        if (!pkg) {
            return NextResponse.json({ error: 'Package not found' }, { status: 404 });
        }

        return NextResponse.json(pkg);
    } catch (error) {
        console.error('Get package error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Update package
export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        let user: AuthUser;
        try {
            user = await requireRole(UserRole.COACH);
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

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

        // Verify package belongs to this coach
        const existingPkg = await prisma.package.findFirst({
            where: { id, coachId: profile.id },
        });

        if (!existingPkg) {
            return NextResponse.json(
                { error: 'Package not found' },
                { status: 404 }
            );
        }

        const body = await req.json();
        const validation = updatePackageSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatZodErrors(validation.error) },
                { status: 400 }
            );
        }

        const pkg = await prisma.package.update({
            where: { id },
            data: validation.data,
        });

        // Recalculate starting rate
        const minPackage = await prisma.package.findFirst({
            where: { coachId: profile.id, isActive: true },
            orderBy: { priceCents: 'asc' },
        });

        await prisma.coachProfile.update({
            where: { id: profile.id },
            data: { startingRate: minPackage?.priceCents ?? 0 },
        });

        return NextResponse.json(pkg);
    } catch (error) {
        console.error('Update package error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Soft delete package (set isActive = false)
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        let user: AuthUser;
        try {
            user = await requireRole(UserRole.COACH);
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

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

        // Verify package belongs to this coach
        const existingPkg = await prisma.package.findFirst({
            where: { id, coachId: profile.id },
        });

        if (!existingPkg) {
            return NextResponse.json(
                { error: 'Package not found' },
                { status: 404 }
            );
        }

        // Soft delete
        await prisma.package.update({
            where: { id },
            data: { isActive: false },
        });

        // Recalculate starting rate
        const minPackage = await prisma.package.findFirst({
            where: { coachId: profile.id, isActive: true },
            orderBy: { priceCents: 'asc' },
        });

        await prisma.coachProfile.update({
            where: { id: profile.id },
            data: { startingRate: minPackage?.priceCents ?? 0 },
        });

        return NextResponse.json({ message: 'Package deleted' });
    } catch (error) {
        console.error('Delete package error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
