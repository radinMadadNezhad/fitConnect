'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
    Calendar,
    DollarSign,
    Star,
    Users,
    TrendingUp,
    Clock,
    Plus,
    Settings,
    Camera,
    Edit,
    MoreVertical,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Header } from '@/components/layout';
import { KPICard } from '@/components/common';
import { coaches, bookings, reviews } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Simulate coach view - use first coach's data
const currentCoach = coaches[0];
const coachBookings = bookings.filter((b) => b.coachId === currentCoach.id);
const coachReviews = reviews.filter((r) => r.coachId === currentCoach.id);

export default function CoachDashboardPage() {
    const upcomingBookings = coachBookings.filter((b) => b.status === 'upcoming');
    const completedBookings = coachBookings.filter((b) => b.status === 'completed');

    const totalEarnings = completedBookings.reduce((sum, b) => sum + b.payoutAmount, 0);
    const pendingEarnings = upcomingBookings.reduce((sum, b) => sum + b.payoutAmount, 0);

    // Profile completion simulation
    const profileCompletion = 85;
    const completionItems = [
        { label: 'Profile photo', complete: true },
        { label: 'Bio & tagline', complete: true },
        { label: 'Certifications', complete: true },
        { label: 'Packages', complete: true },
        { label: 'Gallery photos', complete: currentCoach.gallery.length >= 4 },
        { label: 'Availability', complete: true },
        { label: 'Bank account', complete: false },
    ];

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
                {/* Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Coach Dashboard</h1>
                        <p className="mt-1 text-muted-foreground">
                            Manage your profile, bookings, and earnings
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline" className="rounded-xl">
                            <Link href={`/coaches/${currentCoach.id}`}>
                                View Public Profile
                            </Link>
                        </Button>
                        <Button asChild className="rounded-xl">
                            <Link href="/dashboard/coach/settings">
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
                        change="+12% from last month"
                        changeType="positive"
                        icon={DollarSign}
                        iconColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    />
                    <KPICard
                        title="Pending Payout"
                        value={`$${pendingEarnings.toFixed(0)}`}
                        change="Next payout in 3 days"
                        changeType="neutral"
                        icon={TrendingUp}
                        iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                    <KPICard
                        title="Total Sessions"
                        value={currentCoach.sessionsCompleted}
                        change="+8 this week"
                        changeType="positive"
                        icon={Calendar}
                        iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    />
                    <KPICard
                        title="Average Rating"
                        value={currentCoach.rating}
                        change={`${currentCoach.reviewCount} reviews`}
                        changeType="neutral"
                        icon={Star}
                        iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
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
                                                <AvatarImage src={`https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face`} />
                                                <AvatarFallback>{booking.clientName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium">{booking.clientName}</p>
                                                <p className="text-sm text-muted-foreground">{booking.packageTitle}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatDate(booking.datetime)}</p>
                                                <p className="text-sm text-muted-foreground">{formatTime(booking.datetime)}</p>
                                            </div>
                                            <Badge variant="outline">${booking.payoutAmount}</Badge>
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
                                <Button size="sm" className="rounded-xl">
                                    <Plus className="mr-1 h-4 w-4" />
                                    Add Package
                                </Button>
                            </div>
                            <div className="divide-y">
                                {currentCoach.packages.map((pkg) => (
                                    <div key={pkg.id} className="flex items-center gap-4 p-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                            <Clock className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium">{pkg.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {pkg.duration} min • {pkg.type}
                                            </p>
                                        </div>
                                        <p className="text-lg font-bold text-primary">${pkg.price}</p>
                                        <Button variant="ghost" size="icon">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Recent Reviews */}
                        <Card className="rounded-2xl shadow-premium">
                            <div className="flex items-center justify-between border-b p-6">
                                <h2 className="text-xl font-semibold">Recent Reviews</h2>
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                                    <span className="font-bold">{currentCoach.rating}</span>
                                    <span className="text-sm text-muted-foreground">
                                        ({currentCoach.reviewCount} reviews)
                                    </span>
                                </div>
                            </div>
                            <div className="divide-y">
                                {coachReviews.slice(0, 3).map((review) => (
                                    <div key={review.id} className="p-4">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={review.clientAvatar} />
                                                <AvatarFallback>{review.clientName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium">{review.clientName}</p>
                                                    <span className="text-sm text-muted-foreground">{review.date}</span>
                                                </div>
                                                <div className="mt-1 flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={cn(
                                                                'h-4 w-4',
                                                                star <= review.rating
                                                                    ? 'fill-amber-400 text-amber-400'
                                                                    : 'text-muted-foreground/30'
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                    {currentCoach.gallery.map((image, index) => (
                                        <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
                                            <Image
                                                src={image}
                                                alt={`Gallery ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
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
                                        <p className="text-3xl font-bold">5</p>
                                        <p className="text-sm text-primary-foreground/80">Sessions</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">$420</p>
                                        <p className="text-sm text-primary-foreground/80">Earned</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">2</p>
                                        <p className="text-sm text-primary-foreground/80">New Clients</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold">4.9</p>
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
