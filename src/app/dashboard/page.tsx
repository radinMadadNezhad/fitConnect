import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (user.role === 'COACH') {
        redirect('/dashboard/coach');
    } else {
        redirect('/dashboard/client');
    }
}
