import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { broadcastMessage } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const user = await verifyToken(token || '');

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all threads for the user
        const threads = await prisma.chatThread.findMany({
            where: {
                OR: [
                    { coachId: user.userId },
                    { clientId: user.userId }
                ]
            },
            include: {
                coach: {
                    select: { displayName: true, avatar: true }
                },
                client: {
                    select: { displayName: true, avatar: true }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        });

        // Format for UI
        const conversations = threads.map(thread => {
            const isCoach = user.role === 'COACH';
            const otherUser = isCoach ? thread.client : thread.coach;
            const lastMessage = thread.messages[0];

            return {
                id: thread.id,
                name: otherUser.displayName || 'Unknown User',
                avatar: otherUser.avatar,
                lastMessage: lastMessage?.content || 'No messages yet',
                time: lastMessage?.createdAt.toISOString() || thread.createdAt.toISOString(),
                unread: 0, // simple mock for now
                online: false // simple mock
            };
        });

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error('Messages error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const user = await verifyToken(token || '');

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { recipientId, content, threadId } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        let targetThreadId = threadId;

        // If no threadId, find or create one based on recipient
        if (!targetThreadId && recipientId) {
            // Determine who is coach/client based on current user role
            // This logic assumes a strict Coach <-> Client relationship for now
            // But we can just use the IDs if valid

            // To simplify, let's assume we pass a threadId if it exists, 
            // OR we look it up. 
            // For now, let's just handle sending to an existing thread or basic creation if we can infer roles.

            // NOTE: In a real app, we need to know valid roles. 
            // Let's rely on threadId being passed for existing chats.
            return NextResponse.json({ error: 'Thread ID required for now' }, { status: 400 });
        }

        const message = await prisma.message.create({
            data: {
                threadId: targetThreadId,
                senderId: user.userId,
                content
            }
        });

        // Update thread timestamp
        await prisma.chatThread.update({
            where: { id: targetThreadId },
            data: { lastMessageAt: new Date() }
        });

        // Broadcast to realtime channel
        try {
            await broadcastMessage(targetThreadId, {
                id: message.id,
                senderId: message.senderId,
                content: message.content,
                createdAt: message.createdAt.toISOString()
            });
        } catch (error) {
            console.error('Failed to broadcast message:', error);
            // Don't fail the request if broadcast fails
        }

        return NextResponse.json(message);

    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
