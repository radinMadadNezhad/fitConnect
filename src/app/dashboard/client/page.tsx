'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
    Calendar,
    Clock,
    MapPin,
    Video,
    User,
    Star,
    Heart,
    Receipt,
    ChevronRight,
    MessageSquare,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout';
import { coaches } from '@/lib/mock-data';
import { cn, isDemoMode } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Booking {
    id: string;
    coachId: string;
    coachName: string;
    coachAvatar?: string;
    packageTitle: string;
    datetime: string;
    amount: number;
    status: 'upcoming' | 'completed' | 'cancelled';
}

export default function UserDashboardPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const savedCoaches = isDemoMode() ? coaches.slice(0, 3) : []; // Keep mock for now as we focus on bookings

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push('/login');
        }
    }, [isAuthLoading, user, router]);

    const fetchBookings = async () => {
        try {
            const res = await fetch('/api/bookings');
            if (res.ok) {
                const data = await res.json();
                // Map API data to UI model if necessary, for now assuming match or simple transform
                // verified API logic returns standard Booking model, we might need to adapt
                setBookings(data.bookings || []);
            }
        } catch (error) {
            console.error('Failed to fetch bookings', error);
            toast.error('Failed to load bookings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user]);

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('Are you sure you want to cancel this session?')) return;

        try {
            const res = await fetch(`/api/bookings/${bookingId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Booking cancelled successfully');
                fetchBookings(); // Refresh list
            } else {
                throw new Error('Failed to cancel');
            }
        } catch (error) {
            toast.error('Failed to cancel booking');
        }
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    const upcomingBookings = bookings.filter((b) => b.status === 'upcoming');
    const pastBookings = bookings.filter((b) => b.status === 'completed');
    const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

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

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Welcome Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Welcome back, {user.name.split(' ')[0]}! 👋
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Here's what's happening with your fitness journey
                        </p>
                    </div>
                    <Button asChild className="rounded-xl">
                        <Link href="/coaches">
                            Find a Coach
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {/* Upcoming Sessions */}
                <section className="mb-10">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/dashboard/bookings">View all</Link>
                        </Button>
                    </div>

                    {upcomingBookings.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {upcomingBookings.map((booking) => (
                                <Card
                                    key={booking.id}
                                    className="overflow-hidden rounded-2xl shadow-premium transition-shadow hover:shadow-lg"
                                >
                                    <div className="flex items-center gap-4 p-6">
                                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                                            <Image
                                                src={booking.coachAvatar || '/placeholder-avatar.jpg'}
                                                alt={booking.coachName}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate font-semibold">{booking.coachName}</h3>
                                            <p className="text-sm text-muted-foreground">{booking.packageTitle}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    {formatDate(booking.datetime)}
                                                </span>
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    {formatTime(booking.datetime)}
                                                </span>
                                            </div>
                                        </div>
                                        <Button asChild variant="outline" size="sm" className="shrink-0 rounded-xl">
                                            <Link href="/messages">
                                                <MessageSquare className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                    <div className="flex border-t">
                                        <Button
                                            asChild
                                            variant="ghost"
                                            className="flex-1 rounded-none h-12"
                                        >
                                            <Link href={`/booking/${booking.coachId}`}>Reschedule</Link>
                                        </Button>
                                        <div className="w-px bg-border" />
                                        <Button
                                            variant="ghost"
                                            className="flex-1 rounded-none h-12 text-destructive hover:text-destructive"
                                            onClick={() => handleCancelBooking(booking.id)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="rounded-2xl border-dashed p-8 text-center">
                            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 font-semibold">No upcoming sessions</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Browse coaches and book your next session
                            </p>
                            <Button asChild className="mt-4 rounded-xl">
                                <Link href="/coaches">Find a Coach</Link>
                            </Button>
                        </Card>
                    )}
                </section>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Past Sessions */}
                    <div className="lg:col-span-2">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Past Sessions</h2>
                        </div>
                        <Card className="rounded-2xl shadow-premium overflow-hidden">
                            <Tabs defaultValue="completed" className="w-full">
                                <div className="border-b px-4">
                                    <TabsList className="h-12 bg-transparent p-0">
                                        <TabsTrigger value="completed" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                            Completed
                                        </TabsTrigger>
                                        <TabsTrigger value="cancelled" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                            Cancelled
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent value="completed" className="m-0">
                                    {pastBookings.length > 0 ? (
                                        <div className="divide-y">
                                            {pastBookings.map((booking) => (
                                                <div key={booking.id} className="flex items-center gap-4 p-4">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={booking.coachAvatar} />
                                                        <AvatarFallback>{booking.coachName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium">{booking.coachName}</p>
                                                        <p className="text-sm text-muted-foreground">{booking.packageTitle}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium">{formatDate(booking.datetime)}</p>
                                                        <p className="text-sm text-muted-foreground">${booking.amount}</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon">
                                                        <Receipt className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No completed sessions yet
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="cancelled" className="m-0">
                                    {cancelledBookings.length > 0 ? (
                                        <div className="divide-y">
                                            {cancelledBookings.map((booking) => (
                                                <div key={booking.id} className="flex items-center gap-4 p-4 opacity-75">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={booking.coachAvatar} />
                                                        <AvatarFallback>{booking.coachName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium">{booking.coachName}</p>
                                                        <p className="text-sm text-muted-foreground">{booking.packageTitle}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium">{formatDate(booking.datetime)}</p>
                                                        <Badge variant="destructive" className="ml-auto">Cancelled</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No cancelled sessions
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </Card>
                    </div>

                    {/* Saved Coaches */}
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Saved Coaches</h2>
                        </div>
                        <Card className="rounded-2xl shadow-premium">
                            <div className="divide-y">
                                {savedCoaches.map((coach) => (
                                    <Link
                                        key={coach.id}
                                        href={`/coaches/${coach.id}`}
                                        className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                                            <Image
                                                src={coach.avatar}
                                                alt={coach.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{coach.name}</p>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                {coach.rating}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="shrink-0">
                                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                            <div className="border-t p-4">
                                <Button asChild variant="ghost" className="w-full">
                                    <Link href="/coaches">Browse More Coaches</Link>
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
