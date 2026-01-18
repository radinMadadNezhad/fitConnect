import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, AuthUser } from '@/lib/auth';
import { canAccessThread, canSendMessage } from '@/lib/permissions';
import { sendMessageSchema, paginationSchema, formatZodErrors } from '@/lib/validators';
import { broadcastMessage } from '@/lib/supabase';

interface Params {
    params: Promise<{ id: string }>;
}

// GET - Get messages in a thread (paginated)
export async function GET(req: NextRequest, { params }: Params) {
    try {
        let user: AuthUser;
        try {
            user = await requireAuth();
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const thread = await prisma.chatThread.findUnique({
            where: { id },
        });

        if (!thread) {
            return NextResponse.json(
                { error: 'Thread not found' },
                { status: 404 }
            );
        }

        // Check permission
        if (!canAccessThread(user, thread)) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const params_ = {
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '50',
        };

        const validation = paginationSchema.safeParse(params_);
        const { page, limit } = validation.success ? validation.data : { page: 1, limit: 50 };

        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where: { threadId: id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: {
                        select: {
                            id: true,
                            email: true,
                            coachProfile: {
                                select: {
                                    displayName: true,
                                },
                            },
                        },
                    },
                },
            }),
            prisma.message.count({ where: { threadId: id } }),
        ]);

        // Mark unread messages as read
        await prisma.message.updateMany({
            where: {
                threadId: id,
                senderId: { not: user.userId },
                readAt: null,
            },
            data: { readAt: new Date() },
        });

        const data = messages.reverse().map((msg) => ({
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            readAt: msg.readAt,
            sender: {
                id: msg.sender.id,
                displayName: msg.sender.coachProfile?.displayName || msg.sender.email,
                isMe: msg.sender.id === user.userId,
            },
        }));

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + messages.length < total,
            },
        });
    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Send a message
export async function POST(req: NextRequest, { params }: Params) {
    try {
        let user: AuthUser;
        try {
            user = await requireAuth();
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const thread = await prisma.chatThread.findUnique({
            where: { id },
        });

        if (!thread) {
            return NextResponse.json(
                { error: 'Thread not found' },
                { status: 404 }
            );
        }

        // Check permission
        if (!canSendMessage(user, thread)) {
            return NextResponse.json(
                { error: 'Cannot send message to this thread' },
                { status: 403 }
            );
        }

        const body = await req.json();
        const validation = sendMessageSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatZodErrors(validation.error) },
                { status: 400 }
            );
        }

        const { content } = validation.data;

        // Create message and update thread
        const [message] = await prisma.$transaction([
            prisma.message.create({
                data: {
                    threadId: id,
                    senderId: user.userId,
                    content,
                },
            }),
            prisma.chatThread.update({
                where: { id },
                data: { lastMessageAt: new Date() },
            }),
        ]);

        // Broadcast via Supabase Realtime
        try {
            await broadcastMessage(id, {
                id: message.id,
                senderId: message.senderId,
                content: message.content,
                createdAt: message.createdAt.toISOString(),
            });
        } catch (error) {
            // Non-critical: log but don't fail
            console.error('Broadcast failed:', error);
        }

        return NextResponse.json({
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            senderId: message.senderId,
        }, { status: 201 });
    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
