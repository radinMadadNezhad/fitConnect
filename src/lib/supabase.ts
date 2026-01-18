import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for browser/public use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

/**
 * Broadcast a new message to a chat thread via Supabase Realtime
 */
export async function broadcastMessage(
    threadId: string,
    message: {
        id: string;
        senderId: string;
        content: string;
        createdAt: string;
    }
) {
    const channel = supabase.channel(`thread:${threadId}`);

    await channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: message,
    });
}

/**
 * Subscribe to new messages in a thread
 */
export function subscribeToThread(
    threadId: string,
    callback: (message: {
        id: string;
        senderId: string;
        content: string;
        createdAt: string;
    }) => void
) {
    const channel = supabase
        .channel(`thread:${threadId}`)
        .on('broadcast', { event: 'new_message' }, ({ payload }) => {
            callback(payload);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Notify a user of a new message (for notifications)
 */
export async function notifyUser(
    userId: string,
    notification: {
        type: 'new_message' | 'booking_confirmed' | 'booking_cancelled';
        data: Record<string, unknown>;
    }
) {
    const channel = supabase.channel(`user:${userId}`);

    await channel.send({
        type: 'broadcast',
        event: notification.type,
        payload: notification.data,
    });
}

export default supabase;
