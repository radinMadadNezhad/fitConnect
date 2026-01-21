import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import BookingClient from './BookingClient';

interface BookingPageProps {
    params: Promise<{ coachId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function BookingPage({ params }: BookingPageProps) {
    const { coachId } = await params;

    // Auth check (soft) - we pass user to client to enforce at Step 3
    const user = await getCurrentUser();

    // Fetch Coach & Packages
    const coachProfile = await prisma.coachProfile.findUnique({
        where: { id: coachId },
        include: {
            packages: {
                where: { isActive: true }
            },
            gallery: {
                orderBy: { sortOrder: 'asc' },
                take: 1
            },
            reviews: {
                select: { rating: true }
            }
        }
    });

    if (!coachProfile) {
        return notFound();
    }

    // Transform to match Client Component expected props
    const coachForClient = {
        ...coachProfile,
        avatar: coachProfile.gallery[0]?.url || null,
        ratingAvg: coachProfile.ratingAvg || 0, // Fallback if null
        ratingCount: coachProfile.ratingCount || 0
    };

    return (
        <BookingClient
            coach={coachForClient}
            currentUser={user}
        />
    );
}
