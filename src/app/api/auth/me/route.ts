import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const authUser = await getCurrentUser();

        if (!authUser) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: authUser.userId },
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
                        stripeOnboarded: true,
                        isActive: true,
                    },
                },
            },
        });


        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Get current user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
