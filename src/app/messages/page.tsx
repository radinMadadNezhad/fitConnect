import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import MessagesClient from './messages-client';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return <MessagesClient />;
}
