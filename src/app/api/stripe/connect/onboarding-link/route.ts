import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, AuthUser } from '@/lib/auth';
import { createAccountLink } from '@/lib/stripe';
import { UserRole } from '@prisma/client';

// POST - Generate Stripe Connect onboarding link
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
        });

        if (!profile) {
            return NextResponse.json(
                { error: 'Coach profile not found' },
                { status: 404 }
            );
        }

        if (!profile.stripeAccountId) {
            return NextResponse.json(
                { error: 'No Stripe account. Create one first at /api/stripe/connect/account' },
                { status: 400 }
            );
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const accountLink = await createAccountLink(
            profile.stripeAccountId,
            `${appUrl}/dashboard/coach/stripe?refresh=true`,
            `${appUrl}/dashboard/coach/stripe?success=true`
        );

        return NextResponse.json({
            url: accountLink.url,
            expiresAt: new Date(accountLink.expires_at * 1000).toISOString(),
        });
    } catch (error) {
        console.error('Create onboarding link error:', error);
        return NextResponse.json(
            { error: 'Failed to create onboarding link' },
            { status: 500 }
        );
    }
}
