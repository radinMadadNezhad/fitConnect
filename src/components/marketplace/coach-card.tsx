'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Clock, BadgeCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coach } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CoachCardProps {
    coach: Coach;
    featured?: boolean;
}

export function CoachCard({ coach, featured = false }: CoachCardProps) {
    return (
        <Card className={cn(
            'group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-premium transition-all duration-300',
            'hover:shadow-lg hover:border-primary/20',
            featured && 'ring-2 ring-primary/20'
        )}>
            {/* Verified Badge */}
            {coach.verified && (
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                </div>
            )}

            {/* Profile Section */}
            <div className="flex gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Image
                        src={coach.avatar}
                        alt={coach.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold group-hover:text-primary transition-colors">
                        {coach.name}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {coach.location}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 font-medium">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            {coach.rating}
                        </span>
                        <span className="text-muted-foreground">
                            ({coach.reviewCount} reviews)
                        </span>
                    </div>
                </div>
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-2">
                {coach.specialties.slice(0, 3).map((specialty) => (
                    <Badge
                        key={specialty}
                        variant="secondary"
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    >
                        {specialty}
                    </Badge>
                ))}
                {coach.specialties.length > 3 && (
                    <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs">
                        +{coach.specialties.length - 3}
                    </Badge>
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between border-t pt-4">
                <div>
                    <p className="text-xs text-muted-foreground">Starting at</p>
                    <p className="text-lg font-bold text-primary">${coach.startingRate}<span className="text-sm font-normal text-muted-foreground">/session</span></p>
                </div>
                <Button asChild className="rounded-xl">
                    <Link href={`/coaches/${coach.id}`}>
                        View Profile
                    </Link>
                </Button>
            </div>

            {/* Response Time */}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {coach.responseTime}
            </div>
        </Card>
    );
}
