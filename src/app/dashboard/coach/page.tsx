'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
    Calendar,
    DollarSign,
    Star,
    TrendingUp,
    Plus,
    Settings,
    Camera,
    MoreVertical,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Header } from '@/components/layout';
import { KPICard } from '@/components/common';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CoachDashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [coachBookings, setCoachBookings] = useState<any[]>([]);
    const [coachId, setCoachId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
                return;
            }
            if (user.role !== 'coach') {
                router.push('/dashboard'); // Will redirect to client dashboard
                return;
            }
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (authLoading || !user || user.role !== 'coach') return;

        async function fetchCoachData() {
            try {
                // Fetch bookings
                const bookingsRes = await fetch('/api/bookings');
                // Note: The /api/bookings endpoint needs to support filtering by coach or return all relevant bookings
                // For now assuming it returns bookings for the current user (if they are a coach)
                if (bookingsRes.ok) {
                    const data = await bookingsRes.json();
                    setCoachBookings(data.bookings || []);
                }

                // Fetch Profile for Coach ID
                const profileRes = await fetch('/api/user/profile');
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    if (data.coachProfile?.id) {
                        setCoachId(data.coachProfile.id);
                    }
                }
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCoachData();
    }, [authLoading, user]);

    const formatDate = (datetime: string) => {
        const date = new Date(datetime);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (datetime: string) => {
        const date = new Date(datetime);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    // Derived state
    const upcomingBookings = coachBookings.filter((b) => b.status === 'upcoming' || b.status === 'PENDING_PAYMENT' || b.status === 'CONFIRMED');
    const completedBookings = coachBookings.filter((b) => b.status === 'completed' || b.status === 'COMPLETED');

    // Simple calculation for MVP
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.payoutCents || 0) / 100, 0);
    const pendingEarnings = upcomingBookings.reduce((sum, b) => sum + (b.payoutCents || 0) / 100, 0);

    // Mock profile completion for now until we also fetch profile
    const profileCompletion = 85;
    const completionItems = [
        { label: 'Profile photo', complete: true },
        { label: 'Bio & tagline', complete: true },
        { label: 'Certifications', complete: true },
        { label: 'Gallery photos', complete: true },
        { label: 'Bank account', complete: false },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Coach Dashboard</h1>
                        <p className="mt-1 text-muted-foreground">
                            Manage your profile, bookings, and earnings
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline" className="rounded-xl" disabled={!coachId}>
                            <Link href={coachId ? `/booking/${coachId}` : '/coaches'}>
                                View Public Profile
                            </Link>
                        </Button>
                        <Button asChild className="rounded-xl">
                            <Link href="/dashboard/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <KPICard
                        title="Total Earnings"
                        value={`$${totalEarnings.toFixed(0)}`}
                        change="Lifetime"
                        changeType="positive"
                        icon={DollarSign}
                        iconColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    />
                    <KPICard
                        title="Pending Payout"
                        value={`$${pendingEarnings.toFixed(0)}`}
                        change="Upcoming sessions"
                        changeType="neutral"
                        icon={TrendingUp}
                        iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                    <KPICard
                        title="Total Sessions"
                        value={completedBookings.length}
                        change="Completed"
                        changeType="positive"
                        icon={Calendar}
                        iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    />
                    <KPICard
                        title="Average Rating"
                        value={5.0}
                        change={`0 reviews`}
                        changeType="neutral"
                        icon={Star}
                        iconColor="bg-amber-100 text-amber-400"
                    />
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* Upcoming Bookings */}
                        <Card className="rounded-2xl shadow-premium">
                            <div className="flex items-center justify-between border-b p-6">
                                <h2 className="text-xl font-semibold">Upcoming Bookings</h2>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href="/dashboard/coach/bookings">
                                        View all
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                            <div className="divide-y">
                                {upcomingBookings.length > 0 ? (
                                    upcomingBookings.map((booking) => (
                                        <div key={booking.id} className="flex items-center gap-4 p-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={booking.client?.avatar || undefined} />
                                                <AvatarFallback>{booking.client?.displayName?.charAt(0) || 'C'}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium">{booking.client?.displayName || 'Client'}</p>
                                                <p className="text-sm text-muted-foreground">{booking.package?.title}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatDate(booking.startTime || booking.datetime)}</p>
                                                <p className="text-sm text-muted-foreground">{formatTime(booking.startTime || booking.datetime)}</p>
                                            </div>
                                            <Badge variant="outline">${(booking.payoutCents || 0) / 100}</Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Message Client</DropdownMenuItem>
                                                    <DropdownMenuItem>Reschedule</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground">
                                        No upcoming bookings
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Manage Packages */}
                        <Card className="rounded-2xl shadow-premium">
                            <div className="flex items-center justify-between border-b p-6">
                                <h2 className="text-xl font-semibold">Your Packages</h2>
                                <Button asChild size="sm" className="rounded-xl">
                                    <Link href="/dashboard/coach/packages/new">
                                        <Plus className="mr-1 h-4 w-4" />
                                        Add Package
                                    </Link>
                                </Button>
                            </div>
                            <div className="p-8 text-center text-muted-foreground">
                                <p>Manage your coaching packages here.</p>
                                {/* Future: Map real packages here */}
                            </div>
                        </Card>

                        {/* Recent Reviews */}
                        <Card className="rounded-2xl shadow-premium">
                            <div className="flex items-center justify-between border-b p-6">
                                <h2 className="text-xl font-semibold">Recent Reviews</h2>
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                                    <span className="font-bold">5.0</span>
                                </div>
                            </div>
                            <div className="p-8 text-center text-muted-foreground">
                                No reviews yet.
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Profile Completion */}
                        <Card className="rounded-2xl shadow-premium">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">Profile Completion</h3>
                                    <span className="text-2xl font-bold text-primary">{profileCompletion}%</span>
                                </div>
                                <Progress value={profileCompletion} className="mt-4 h-2" />
                                <div className="mt-6 space-y-3">
                                    {completionItems.map((item) => (
                                        <div key={item.label} className="flex items-center gap-2 text-sm">
                                            <div
                                                className={cn(
                                                    'h-5 w-5 rounded-full flex items-center justify-center',
                                                    item.complete
                                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-muted text-muted-foreground'
                                                )}
                                            >
                                                {item.complete ? '✓' : '○'}
                                            </div>
                                            <span className={cn(!item.complete && 'text-muted-foreground')}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" className="mt-6 w-full rounded-xl">
                                    Complete Profile
                                </Button>
                            </div>
                        </Card>

                        {/* Manage Gallery */}
                        <Card className="rounded-2xl shadow-premium">
                            <div className="border-b p-6">
                                <h3 className="font-semibold">Gallery</h3>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Mock Empty State for now */}
                                    <button className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                                        <Camera className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Stats */}
                        <Card className="rounded-2xl bg-primary text-primary-foreground shadow-premium">
                            <div className="p-6">
                                <h3 className="font-semibold">This Week</h3>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-3xl font-bold">{completedBookings.length}</p>
                                        <p className="text-sm text-primary-foreground/80">Sessions</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">${totalEarnings}</p>
                                        <p className="text-sm text-primary-foreground/80">Earned</p>
                                    </div>
                                    {/* Placeholders */}
                                    <div>
                                        <p className="text-3xl font-bold">0</p>
                                        <p className="text-sm text-primary-foreground/80">New Clients</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">5.0</p>
                                        <p className="text-sm text-primary-foreground/80">Avg Rating</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
