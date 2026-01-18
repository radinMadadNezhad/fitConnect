import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, AuthUser } from '@/lib/auth';
import { createThreadSchema, formatZodErrors } from '@/lib/validators';

// GET - Get user's chat threads
export async function GET(req: NextRequest) {
    try {
        let user: AuthUser;
        try {
            user = await requireAuth();
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const threads = await prisma.chatThread.findMany({
            where: {
                OR: [
                    { clientId: user.userId },
                    { coachId: user.userId },
                ],
            },
            orderBy: { lastMessageAt: 'desc' },
            include: {
                coach: {
                    select: {
                        id: true,
                        email: true,
                        coachProfile: {
                            select: {
                                displayName: true,
                                gallery: {
                                    take: 1,
                                    orderBy: { sortOrder: 'asc' },
                                },
                            },
                        },
                    },
                },
                client: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        content: true,
                        createdAt: true,
                        senderId: true,
                        readAt: true,
                    },
                },
            },
        });

        // Count unread messages
        const threadsWithUnread = await Promise.all(
            threads.map(async (thread) => {
                const unreadCount = await prisma.message.count({
                    where: {
                        threadId: thread.id,
                        senderId: { not: user.userId },
                        readAt: null,
                    },
                });

                const lastMessage = thread.messages[0];
                const otherPartyIsCoach = thread.coachId !== user.userId;

                return {
                    id: thread.id,
                    participant: otherPartyIsCoach
                        ? {
                            id: thread.coach.id,
                            email: thread.coach.email,
                            displayName: thread.coach.coachProfile?.displayName,
                            avatar: thread.coach.coachProfile?.gallery[0]?.url || null,
                        }
                        : {
                            id: thread.client.id,
                            email: thread.client.email,
                            displayName: null,
                            avatar: null,
                        },
                    lastMessage: lastMessage
                        ? {
                            content: lastMessage.content,
                            createdAt: lastMessage.createdAt,
                            isFromMe: lastMessage.senderId === user.userId,
                        }
                        : null,
                    unreadCount,
                    lastMessageAt: thread.lastMessageAt,
                };
            })
        );

        return NextResponse.json(threadsWithUnread);
    } catch (error) {
        console.error('Get threads error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create or get existing thread
export async function POST(req: NextRequest) {
    try {
        let user: AuthUser;
        try {
            user = await requireAuth();
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validation = createThreadSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatZodErrors(validation.error) },
                { status: 400 }
            );
        }

        const { coachId } = validation.data;

        // Verify coach exists
        const coach = await prisma.coachProfile.findUnique({
            where: { id: coachId },
            include: { user: { select: { id: true } } },
        });

        if (!coach) {
            return NextResponse.json(
                { error: 'Coach not found' },
                { status: 404 }
            );
        }

        // Cannot message yourself
        if (coach.userId === user.userId) {
            return NextResponse.json(
                { error: 'Cannot message yourself' },
                { status: 400 }
            );
        }

        // Find or create thread
        let thread = await prisma.chatThread.findFirst({
            where: {
                coachId: coach.userId,
                clientId: user.userId,
            },
        });

        if (!thread) {
            thread = await prisma.chatThread.create({
                data: {
                    coachId: coach.userId,
                    clientId: user.userId,
                },
            });
        }

        return NextResponse.json({
            id: thread.id,
            coachId: thread.coachId,
            clientId: thread.clientId,
        }, { status: thread ? 200 : 201 });
    } catch (error) {
        console.error('Create thread error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
