import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const user = await verifyToken(token || '');

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: threadId } = await params;

        // Verify user is participant in thread
        const thread = await prisma.chatThread.findUnique({
            where: { id: threadId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 100 // Limit to last 100 messages
                }
            }
        });

        if (!thread) {
            return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
        }

        if (thread.coachId !== user.userId && thread.clientId !== user.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(thread.messages);

    } catch (error) {
        console.error('Get thread messages error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
