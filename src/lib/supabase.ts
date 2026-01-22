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
 * NOTE: Channels must be subscribed before sending. We subscribe, send, then cleanup.
 */
export async function broadcastMessage(
    threadId: string,
    message: {
        id: string;
        senderId: string;
        content: string;
        createdAt: string;
    }
): Promise<boolean> {
    const channelName = `thread:${threadId}`;

    return new Promise((resolve) => {
        const channel = supabase.channel(channelName);

        channel
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Now we can send
                    channel.send({
                        type: 'broadcast',
                        event: 'new_message',
                        payload: message,
                    }).then(() => {
                        // Cleanup after sending
                        supabase.removeChannel(channel);
                        resolve(true);
                    }).catch((err) => {
                        console.error('Failed to broadcast:', err);
                        supabase.removeChannel(channel);
                        resolve(false);
                    });
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('Channel subscription failed:', status);
                    supabase.removeChannel(channel);
                    resolve(false);
                }
            });

        // Timeout safety
        setTimeout(() => {
            supabase.removeChannel(channel);
            resolve(false);
        }, 5000);
    });
}

/**
 * Subscribe to new messages in a thread
 * Returns an unsubscribe function
 */
export function subscribeToThread(
    threadId: string,
    callback: (message: {
        id: string;
        senderId: string;
        content: string;
        createdAt: string;
    }) => void,
    onStatusChange?: (status: string) => void
) {
    const channelName = `thread:${threadId}`;

    const channel = supabase
        .channel(channelName)
        .on('broadcast', { event: 'new_message' }, ({ payload }) => {
            console.log('[Realtime] Received message:', payload?.id);
            callback(payload);
        })
        .subscribe((status) => {
            console.log(`[Realtime] Channel ${channelName} status:`, status);
            onStatusChange?.(status);
        });

    return () => {
        console.log(`[Realtime] Unsubscribing from ${channelName}`);
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
): Promise<boolean> {
    const channelName = `user:${userId}`;

    return new Promise((resolve) => {
        const channel = supabase.channel(channelName);

        channel
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    channel.send({
                        type: 'broadcast',
                        event: notification.type,
                        payload: notification.data,
                    }).then(() => {
                        supabase.removeChannel(channel);
                        resolve(true);
                    }).catch((err) => {
                        console.error('Failed to notify:', err);
                        supabase.removeChannel(channel);
                        resolve(false);
                    });
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    supabase.removeChannel(channel);
                    resolve(false);
                }
            });

        setTimeout(() => {
            supabase.removeChannel(channel);
            resolve(false);
        }, 5000);
    });
}

export default supabase;
