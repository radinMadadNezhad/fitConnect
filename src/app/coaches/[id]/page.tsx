'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Star,
    MapPin,
    Clock,
    BadgeCheck,
    MessageSquare,
    Calendar,
    Globe,
    Award,
    ChevronLeft,
    Play,
    Users,
    Video,
    User,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout';
import { coaches, reviews } from '@/lib/mock-data';
import { cn, isDemoMode } from '@/lib/utils';

interface CoachProfilePageProps {
    params: Promise<{ id: string }>;
}

export default function CoachProfilePage({ params }: CoachProfilePageProps) {
    const { id } = use(params);
    const [coach, setCoach] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchCoach() {
            if (isDemoMode()) {
                const found = coaches.find((c) => c.id === id);
                setCoach(found || null);
                setIsLoading(false);
            } else {
                try {
                    const res = await fetch(`/api/coaches/${id}`);
                    if (!res.ok) {
                        if (res.status === 404) setCoach(null);
                        else throw new Error('Failed to load coach');
                    } else {
                        const data = await res.json();
                        setCoach(data);
                    }
                } catch (err) {
                    console.error(err);
                    setError('Failed to load profile');
                } finally {
                    setIsLoading(false);
                }
            }
        }
        fetchCoach();
    }, [id]);

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

    if (!coach) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="mx-auto max-w-7xl px-4 py-16 text-center">
                    <h1 className="text-2xl font-bold">Coach not found</h1>
                    <p className="mt-2 text-muted-foreground">
                        The coach you're looking for doesn't exist.
                    </p>
                    <Button asChild className="mt-6">
                        <Link href="/coaches">Browse Coaches</Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Mock reviews for demo, or real reviews if available
    const coachReviews = isDemoMode()
        ? reviews.filter((r) => r.coachId === coach.id)
        : (coach.reviews || []).map((r: any) => ({
            id: r.id,
            rating: r.rating,
            comment: r.text, // API returns 'text', UI expects 'comment'
            date: new Date(r.createdAt).toLocaleDateString(),
            clientName: 'Client', // API might not return name for privacy, or we need to fetch it
            clientAvatar: undefined
        }));

    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: coachReviews.filter((r: any) => Math.floor(r.rating) === rating).length,
        percentage:
            coachReviews.length > 0
                ? (coachReviews.filter((r: any) => Math.floor(r.rating) === rating).length /
                    coachReviews.length) *
                100
                : 0,
    }));

    // Safety check for array props if API returns something unexpected
    const specialties = coach.specialties || [];
    const certifications = coach.certifications || [];
    const languages = coach.languages || [];
    const gallery = coach.gallery || [];
    const packages = coach.packages || [];
    const availability = coach.availability || []; // API currently doesn't return this!

    // Fallback for availability if missing
    const displayAvailability = availability.length > 0 ? availability : [
        { day: 'Mon', slots: ['9:00 AM', '10:00 AM', '2:00 PM'] },
        { day: 'Tue', slots: ['9:00 AM', '10:00 AM'] },
        { day: 'Wed', slots: ['2:00 PM', '4:00 PM'] },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Button asChild variant="ghost" className="mb-6 -ml-2">
                    <Link href="/coaches">
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to Coaches
                    </Link>
                </Button>

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-background">
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />

                    <div className="relative flex flex-col gap-8 p-8 lg:flex-row lg:items-center lg:p-12">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="relative h-32 w-32 overflow-hidden rounded-2xl ring-4 ring-background lg:h-40 lg:w-40">
                                {coach.avatar ? (
                                    <Image
                                        src={coach.avatar}
                                        alt={coach.displayName || coach.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-muted text-4xl font-bold text-muted-foreground">
                                        {(coach.displayName || coach.name || '?').charAt(0)}
                                    </div>
                                )}
                            </div>
                            {(coach.verified || false) && (
                                <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary ring-4 ring-background">
                                    <BadgeCheck className="h-5 w-5 text-primary-foreground" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-bold lg:text-4xl">{coach.displayName || coach.name}</h1>
                                {(coach.verified || false) && (
                                    <Badge className="rounded-full">Verified Pro</Badge>
                                )}
                            </div>
                            <p className="mt-2 text-lg text-muted-foreground">{coach.tagline}</p>

                            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                                {coach.location && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        {coach.location}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    <strong>{coach.ratingAvg?.toFixed(1) || coach.rating}</strong>
                                    <span className="text-muted-foreground">({coach.ratingCount || coach.reviewCount || 0} reviews)</span>
                                </span>
                                {coach.responseTime && (
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        {coach.responseTime}
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {specialties.map((specialty: string) => (
                                    <Badge key={specialty} variant="secondary" className="rounded-full">
                                        {specialty}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                            <Button asChild size="lg" className="rounded-xl">
                                <Link href={`/booking/${coach.id}`}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Book Session
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" className="rounded-xl">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Message
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { label: 'Sessions', value: coach.sessionsCompleted, icon: Calendar },
                        { label: 'Rating', value: coach.ratingAvg?.toFixed(1) || coach.rating, icon: Star },
                        { label: 'Reviews', value: coach.ratingCount || coach.reviewCount, icon: Users },
                        { label: 'Starting at', value: `$${(coach.startingRate ? coach.startingRate / 100 : 0)}`, icon: Award },
                    ].map((stat) => (
                        <Card key={stat.label} className="rounded-2xl p-4 text-center shadow-premium">
                            <stat.icon className="mx-auto h-5 w-5 text-primary" />
                            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </Card>
                    ))}
                </div>

                {/* Main Content */}
                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    {/* Left Column */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* Gallery */}
                        {gallery.length > 0 ? (
                            <Card className="overflow-hidden rounded-2xl shadow-premium">
                                <div className="border-b p-6">
                                    <h2 className="text-xl font-semibold">Gallery</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
                                    {gallery.map((image: any, index: number) => (
                                        <div
                                            key={image.id || index}
                                            className="relative aspect-square overflow-hidden rounded-xl"
                                        >
                                            <Image
                                                src={image.url || image}
                                                alt={`Gallery ${index + 1}`}
                                                fill
                                                className="object-cover transition-transform hover:scale-105"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ) : null}

                        {/* About */}
                        <Card className="rounded-2xl shadow-premium">
                            <Tabs defaultValue="about" className="w-full">
                                <div className="border-b px-6">
                                    <TabsList className="h-14 w-full justify-start gap-4 bg-transparent p-0">
                                        <TabsTrigger value="about" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14">
                                            About
                                        </TabsTrigger>
                                        <TabsTrigger value="certifications" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14">
                                            Certifications
                                        </TabsTrigger>
                                        <TabsTrigger value="languages" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14">
                                            Languages
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent value="about" className="p-6">
                                    <p className="text-muted-foreground leading-relaxed">{coach.bio || 'No bio available yet.'}</p>
                                </TabsContent>
                                <TabsContent value="certifications" className="p-6">
                                    <div className="flex flex-wrap gap-3">
                                        {certifications.length > 0 ? certifications.map((cert: string) => (
                                            <div key={cert} className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2">
                                                <Award className="h-4 w-4 text-primary" />
                                                <span className="font-medium">{cert}</span>
                                            </div>
                                        )) : <p className="text-muted-foreground">No certifications listed.</p>}
                                    </div>
                                </TabsContent>
                                <TabsContent value="languages" className="p-6">
                                    <div className="flex flex-wrap gap-3">
                                        {languages.length > 0 ? languages.map((lang: string) => (
                                            <div key={lang} className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2">
                                                <Globe className="h-4 w-4 text-primary" />
                                                <span className="font-medium">{lang}</span>
                                            </div>
                                        )) : <p className="text-muted-foreground">No languages listed.</p>}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </Card>

                        {/* Reviews */}
                        <Card className="rounded-2xl shadow-premium">
                            <div className="border-b p-6">
                                <h2 className="text-xl font-semibold">Reviews</h2>
                            </div>
                            <div className="p-6">
                                {/* Rating Summary */}
                                <div className="mb-6 flex flex-wrap gap-8">
                                    <div className="text-center">
                                        <p className="text-5xl font-bold">{coach.ratingAvg?.toFixed(1) || coach.rating}</p>
                                        <div className="mt-2 flex justify-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={cn(
                                                        'h-5 w-5',
                                                        star <= Math.round(coach.ratingAvg || coach.rating || 5)
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-muted-foreground/30'
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {coach.ratingCount || coach.reviewCount} reviews
                                        </p>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        {ratingDistribution.map(({ rating, count, percentage }) => (
                                            <div key={rating} className="flex items-center gap-3">
                                                <span className="w-3 text-sm">{rating}</span>
                                                <Star className="h-4 w-4 text-amber-400" />
                                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full bg-amber-400"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="w-8 text-right text-sm text-muted-foreground">
                                                    {count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                {/* Review List */}
                                <div className="space-y-6">
                                    {coachReviews.length > 0 ? (
                                        coachReviews.map((review: any) => (
                                            <div key={review.id} className="flex gap-4">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={review.clientAvatar} />
                                                    <AvatarFallback>{(review.clientName || 'C').charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium">{review.clientName}</p>
                                                        <p className="text-sm text-muted-foreground">{review.date}</p>
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
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        {review.comment}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">
                                            No reviews yet.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column - Packages & Availability */}
                    <div className="space-y-6">
                        {/* Packages */}
                        <Card className="rounded-2xl shadow-premium">
                            <div className="border-b p-6">
                                <h2 className="text-xl font-semibold">Packages</h2>
                            </div>
                            <div className="divide-y max-h-[500px] overflow-y-auto">
                                {packages.length > 0 ? packages.map((pkg: any) => (
                                    <div key={pkg.id} className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold">{pkg.title}</h3>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {pkg.description}
                                                </p>
                                            </div>
                                            <Badge variant={pkg.type?.toLowerCase() === 'online' ? 'secondary' : 'outline'} className="shrink-0">
                                                {pkg.type?.toLowerCase() === 'online' ? <Video className="mr-1 h-3 w-3" /> : <User className="mr-1 h-3 w-3" />}
                                                {pkg.type}
                                            </Badge>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                {pkg.durationMins || pkg.duration} min
                                            </div>
                                            <div>
                                                <span className="text-2xl font-bold text-primary">${(pkg.priceCents ? pkg.priceCents / 100 : pkg.price)}</span>
                                            </div>
                                        </div>
                                        <Button asChild className="mt-4 w-full rounded-xl">
                                            <Link href={`/booking/${coach.id}?package=${pkg.id}`}>
                                                Select Package
                                            </Link>
                                        </Button>
                                    </div>
                                )) : (
                                    <div className="p-6 text-center text-muted-foreground">
                                        No public packages.
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Availability Preview */}
                        <Card className="rounded-2xl shadow-premium">
                            <div className="border-b p-6">
                                <h2 className="text-xl font-semibold">Availability</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {displayAvailability.slice(0, 5).map((day: any) => (
                                        <div key={day.day} className="flex items-start justify-between">
                                            <span className="font-medium">{day.day}</span>
                                            <div className="flex flex-wrap justify-end gap-2">
                                                {day.slots.slice(0, 3).map((slot: string) => (
                                                    <Badge key={slot} variant="outline" className="text-xs">
                                                        {slot}
                                                    </Badge>
                                                ))}
                                                {day.slots.length > 3 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{day.slots.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button asChild variant="outline" className="mt-6 w-full rounded-xl">
                                    <Link href={`/booking/${coach.id}`}>
                                        View Full Calendar
                                    </Link>
                                </Button>
                            </div>
                        </Card>

                        {/* Quick Contact */}
                        <Card className="rounded-2xl bg-primary text-primary-foreground shadow-premium">
                            <div className="p-6 text-center">
                                <MessageSquare className="mx-auto h-8 w-8" />
                                <h3 className="mt-4 font-semibold">Have questions?</h3>
                                <p className="mt-2 text-sm text-primary-foreground/80">
                                    Message {(coach.displayName || coach.name).split(' ')[0]} directly to discuss your goals.
                                </p>
                                <Button variant="secondary" className="mt-4 w-full rounded-xl">
                                    Send Message
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
