'use client';

import { use } from 'react';
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
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout';
import { coaches, reviews } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface CoachProfilePageProps {
    params: Promise<{ id: string }>;
}

export default function CoachProfilePage({ params }: CoachProfilePageProps) {
    const { id } = use(params);
    const coach = coaches.find((c) => c.id === id);

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

    const coachReviews = reviews.filter((r) => r.coachId === coach.id);
    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: coachReviews.filter((r) => Math.floor(r.rating) === rating).length,
        percentage:
            coachReviews.length > 0
                ? (coachReviews.filter((r) => Math.floor(r.rating) === rating).length /
                    coachReviews.length) *
                100
                : 0,
    }));

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
                                <Image
                                    src={coach.avatar}
                                    alt={coach.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            {coach.verified && (
                                <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary ring-4 ring-background">
                                    <BadgeCheck className="h-5 w-5 text-primary-foreground" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-bold lg:text-4xl">{coach.name}</h1>
                                {coach.verified && (
                                    <Badge className="rounded-full">Verified Pro</Badge>
                                )}
                            </div>
                            <p className="mt-2 text-lg text-muted-foreground">{coach.tagline}</p>

                            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    {coach.location}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    <strong>{coach.rating}</strong>
                                    <span className="text-muted-foreground">({coach.reviewCount} reviews)</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    {coach.responseTime}
                                </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {coach.specialties.map((specialty) => (
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
                        { label: 'Rating', value: coach.rating, icon: Star },
                        { label: 'Reviews', value: coach.reviewCount, icon: Users },
                        { label: 'Starting at', value: `$${coach.startingRate}`, icon: Award },
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
                        <Card className="overflow-hidden rounded-2xl shadow-premium">
                            <div className="border-b p-6">
                                <h2 className="text-xl font-semibold">Gallery</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
                                {coach.gallery.map((image, index) => (
                                    <div
                                        key={index}
                                        className="relative aspect-square overflow-hidden rounded-xl"
                                    >
                                        <Image
                                            src={image}
                                            alt={`Gallery ${index + 1}`}
                                            fill
                                            className="object-cover transition-transform hover:scale-105"
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card>

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
                                    <p className="text-muted-foreground leading-relaxed">{coach.bio}</p>
                                </TabsContent>
                                <TabsContent value="certifications" className="p-6">
                                    <div className="flex flex-wrap gap-3">
                                        {coach.certifications.map((cert) => (
                                            <div key={cert} className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2">
                                                <Award className="h-4 w-4 text-primary" />
                                                <span className="font-medium">{cert}</span>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                                <TabsContent value="languages" className="p-6">
                                    <div className="flex flex-wrap gap-3">
                                        {coach.languages.map((lang) => (
                                            <div key={lang} className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2">
                                                <Globe className="h-4 w-4 text-primary" />
                                                <span className="font-medium">{lang}</span>
                                            </div>
                                        ))}
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
                                        <p className="text-5xl font-bold">{coach.rating}</p>
                                        <div className="mt-2 flex justify-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={cn(
                                                        'h-5 w-5',
                                                        star <= Math.round(coach.rating)
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-muted-foreground/30'
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {coach.reviewCount} reviews
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
                                        coachReviews.map((review) => (
                                            <div key={review.id} className="flex gap-4">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={review.clientAvatar} />
                                                    <AvatarFallback>{review.clientName.charAt(0)}</AvatarFallback>
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
                            <div className="divide-y">
                                {coach.packages.map((pkg) => (
                                    <div key={pkg.id} className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold">{pkg.title}</h3>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {pkg.description}
                                                </p>
                                            </div>
                                            <Badge variant={pkg.type === 'online' ? 'secondary' : 'outline'} className="shrink-0">
                                                {pkg.type === 'online' ? <Video className="mr-1 h-3 w-3" /> : <User className="mr-1 h-3 w-3" />}
                                                {pkg.type}
                                            </Badge>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                {pkg.duration} min
                                            </div>
                                            <div>
                                                <span className="text-2xl font-bold text-primary">${pkg.price}</span>
                                            </div>
                                        </div>
                                        <Button asChild className="mt-4 w-full rounded-xl">
                                            <Link href={`/booking/${coach.id}?package=${pkg.id}`}>
                                                Select Package
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Availability Preview */}
                        <Card className="rounded-2xl shadow-premium">
                            <div className="border-b p-6">
                                <h2 className="text-xl font-semibold">Availability</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {coach.availability.slice(0, 5).map((day) => (
                                        <div key={day.day} className="flex items-start justify-between">
                                            <span className="font-medium">{day.day}</span>
                                            <div className="flex flex-wrap justify-end gap-2">
                                                {day.slots.slice(0, 3).map((slot) => (
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
                                    Message {coach.name.split(' ')[0]} directly to discuss your goals.
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
