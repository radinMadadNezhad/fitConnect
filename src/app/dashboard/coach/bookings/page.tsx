'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Calendar, Clock, MoreVertical, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Header } from '@/components/layout';

export default function CoachBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchBookings() {
            try {
                const res = await fetch('/api/bookings');
                if (res.ok) {
                    const data = await res.json();
                    setBookings(data.bookings || []);
                }
            } catch (error) {
                console.error('Failed to fetch bookings', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchBookings();
    }, []);

    const filteredBookings = bookings.filter(booking =>
        booking.client?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.package?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (datetime: string) => {
        return new Date(datetime).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    };

    const formatTime = (datetime: string) => {
        return new Date(datetime).toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Button asChild variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                        <Link href="/dashboard/coach">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
                            <p className="mt-1 text-muted-foreground">
                                Manage your upcoming and past sessions
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline">Export CSV</Button>
                            <Button>Sync Calendar</Button>
                        </div>
                    </div>
                </div>

                <div className="mb-6 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search clients or packages..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                <Card className="rounded-xl shadow-sm">
                    {isLoading ? (
                        <div className="p-8 text-center">Loading...</div>
                    ) : (
                        <div className="divide-y">
                            {filteredBookings.length > 0 ? filteredBookings.map((booking) => (
                                <div key={booking.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                                    <div className="flex items-center gap-4 flex-1">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={booking.client?.avatar} />
                                            <AvatarFallback>{booking.client?.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{booking.client?.displayName || 'Client'}</p>
                                            <p className="text-sm text-muted-foreground">{booking.package?.title}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {formatDate(booking.startTime || booking.datetime)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            {formatTime(booking.startTime || booking.datetime)}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Badge variant={booking.status === 'upcoming' ? 'default' : 'secondary'}>
                                            {booking.status}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Message Client</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Cancel Session</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-12 text-center text-muted-foreground">
                                    No bookings found.
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </main>
        </div>
    );
}
