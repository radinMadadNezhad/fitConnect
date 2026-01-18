import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, AuthUser } from '@/lib/auth';
import { createConnectAccount } from '@/lib/stripe';
import { UserRole } from '@prisma/client';

// POST - Create Stripe Connect account for coach
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
                { error: 'Coach profile not found. Create a profile first.' },
                { status: 404 }
            );
        }

        // Check if already has Stripe account
        if (profile.stripeAccountId) {
            return NextResponse.json(
                { error: 'Stripe account already exists', accountId: profile.stripeAccountId },
                { status: 409 }
            );
        }

        // Create Stripe Connect account
        const account = await createConnectAccount(user.email, profile.id);

        // Store the account ID
        await prisma.coachProfile.update({
            where: { id: profile.id },
            data: { stripeAccountId: account.id },
        });

        return NextResponse.json({
            message: 'Stripe account created',
            accountId: account.id,
        }, { status: 201 });
    } catch (error) {
        console.error('Create Stripe account error:', error);
        return NextResponse.json(
            { error: 'Failed to create Stripe account' },
            { status: 500 }
        );
    }
}
