import { redirect } from 'next/navigation';

export default function CoachSettingsRedirect() {
    redirect('/dashboard/settings');
}
