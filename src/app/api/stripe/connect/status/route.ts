import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, AuthUser } from '@/lib/auth';
import { getAccountStatus } from '@/lib/stripe';
import { UserRole } from '@prisma/client';

// GET - Check Stripe Connect account status
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
        });

        if (!profile) {
            return NextResponse.json(
                { error: 'Coach profile not found' },
                { status: 404 }
            );
        }

        if (!profile.stripeAccountId) {
            return NextResponse.json({
                hasAccount: false,
                onboarded: false,
                message: 'No Stripe account created',
            });
        }

        // Get status from Stripe
        const status = await getAccountStatus(profile.stripeAccountId);

        // Update onboarded status in DB if changed
        if (status.chargesEnabled && status.payoutsEnabled && !profile.stripeOnboarded) {
            await prisma.coachProfile.update({
                where: { id: profile.id },
                data: { stripeOnboarded: true },
            });
        }

        return NextResponse.json({
            hasAccount: true,
            accountId: profile.stripeAccountId,
            onboarded: status.chargesEnabled && status.payoutsEnabled,
            chargesEnabled: status.chargesEnabled,
            payoutsEnabled: status.payoutsEnabled,
            detailsSubmitted: status.detailsSubmitted,
            requiresAction: status.requiresAction,
        });
    } catch (error) {
        console.error('Get Stripe status error:', error);
        return NextResponse.json(
            { error: 'Failed to get Stripe status' },
            { status: 500 }
        );
    }
}
