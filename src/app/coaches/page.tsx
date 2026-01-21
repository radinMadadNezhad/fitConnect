'use client';

import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Header } from '@/components/layout';
import { CoachCard } from '@/components/marketplace';
import { CoachFiltersSidebar, FilterState } from '@/components/marketplace/coach-filters';
import { coaches } from '@/lib/mock-data';
import { isDemoMode } from '@/lib/utils';

export default function BrowseCoachesPage() {
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        location: '',
        specialties: [],
        priceRange: [0, 200],
        minRating: 0,
        availability: 'all',
        sortBy: 'rating',
    });
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        setFilters({ ...filters, [key]: value });
    };

    const toggleSpecialty = (specialty: string) => {
        const current = filters.specialties;
        const updated = current.includes(specialty)
            ? current.filter((s) => s !== specialty)
            : [...current, specialty];
        updateFilter('specialties', updated);
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            location: '',
            specialties: [],
            priceRange: [0, 200],
            minRating: 0,
            availability: 'all',
            sortBy: 'rating',
        });
    };

    const filteredCoaches = useMemo(() => {
        let result = isDemoMode() ? [...coaches] : [];

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(
                (c) =>
                    c.name.toLowerCase().includes(searchLower) ||
                    c.specialties.some((s) => s.toLowerCase().includes(searchLower)) ||
                    c.location.toLowerCase().includes(searchLower)
            );
        }

        // Location filter
        if (filters.location) {
            result = result.filter((c) => c.location === filters.location);
        }

        // Specialties filter
        if (filters.specialties.length > 0) {
            result = result.filter((c) =>
                filters.specialties.some((s) => c.specialties.includes(s))
            );
        }

        // Price range filter
        result = result.filter(
            (c) =>
                c.startingRate >= filters.priceRange[0] &&
                c.startingRate <= filters.priceRange[1]
        );

        // Rating filter
        if (filters.minRating > 0) {
            result = result.filter((c) => c.rating >= filters.minRating);
        }

        // Availability filter
        if (filters.availability !== 'all') {
            result = result.filter((c) =>
                c.packages.some((p) => p.type === filters.availability)
            );
        }

        // Sorting
        switch (filters.sortBy) {
            case 'rating':
                result.sort((a, b) => b.rating - a.rating);
                break;
            case 'price-low':
                result.sort((a, b) => a.startingRate - b.startingRate);
                break;
            case 'price-high':
                result.sort((a, b) => b.startingRate - a.startingRate);
                break;
            case 'reviews':
                result.sort((a, b) => b.reviewCount - a.reviewCount);
                break;
        }

        return result;
    }, [filters]);

    const activeFilterCount = [
        filters.location !== '',
        filters.specialties.length > 0,
        filters.priceRange[0] > 0 || filters.priceRange[1] < 200,
        filters.minRating > 0,
        filters.availability !== 'all',
    ].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Browse Coaches</h1>
                    <p className="mt-2 text-muted-foreground">
                        Find the perfect trainer for your fitness journey
                    </p>
                </div>

                {/* Search & Filter Bar */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search coaches by name, specialty..."
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Sort */}
                    <Select
                        value={filters.sortBy}
                        onValueChange={(value) => updateFilter('sortBy', value as FilterState['sortBy'])}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="rating">Highest Rated</SelectItem>
                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                            <SelectItem value="reviews">Most Reviews</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Mobile Filter Button */}
                    <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="gap-2 lg:hidden">
                                <SlidersHorizontal className="h-4 w-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge variant="default" className="h-5 min-w-5 px-1.5">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6">
                                <CoachFiltersSidebar filters={filters} onFilterChange={setFilters} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Active Filters */}
                {activeFilterCount > 0 && (
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {filteredCoaches.length} coaches found
                        </span>
                        {filters.location && (
                            <Badge variant="secondary" className="gap-1.5">
                                {filters.location}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => updateFilter('location', '')}
                                />
                            </Badge>
                        )}
                        {filters.specialties.map((specialty) => (
                            <Badge key={specialty} variant="secondary" className="gap-1.5">
                                {specialty}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => toggleSpecialty(specialty)}
                                />
                            </Badge>
                        ))}
                        {(filters.priceRange[0] > 0 || filters.priceRange[1] < 200) && (
                            <Badge variant="secondary" className="gap-1.5">
                                ${filters.priceRange[0]} - ${filters.priceRange[1]}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => updateFilter('priceRange', [0, 200])}
                                />
                            </Badge>
                        )}
                        {filters.minRating > 0 && (
                            <Badge variant="secondary" className="gap-1.5">
                                {filters.minRating}+ rating
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => updateFilter('minRating', 0)}
                                />
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={clearFilters}
                        >
                            Clear all
                        </Button>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden w-72 shrink-0 lg:block">
                        <CoachFiltersSidebar filters={filters} onFilterChange={setFilters} />
                    </aside>

                    {/* Coach Grid */}
                    <div className="flex-1">
                        {filteredCoaches.length > 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredCoaches.map((coach) => (
                                    <CoachCard key={coach.id} coach={coach} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
                                <Search className="h-12 w-12 text-muted-foreground/50" />
                                <h3 className="mt-6 text-lg font-semibold">No coaches found</h3>
                                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                    Try adjusting your filters or search terms to find more coaches.
                                </p>
                                <Button onClick={clearFilters} className="mt-6">
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
