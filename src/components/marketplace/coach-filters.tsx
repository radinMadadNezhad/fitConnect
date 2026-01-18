'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { specialties, locations } from '@/lib/mock-data';

export interface FilterState {
    search: string;
    location: string;
    specialties: string[];
    priceRange: [number, number];
    minRating: number;
    availability: 'all' | 'online' | 'in-person';
    sortBy: 'rating' | 'price-low' | 'price-high' | 'reviews';
}

interface CoachFiltersProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    resultCount: number;
}

export function CoachFilters({ filters, onFilterChange, resultCount }: CoachFiltersProps) {
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const toggleSpecialty = (specialty: string) => {
        const current = filters.specialties;
        const updated = current.includes(specialty)
            ? current.filter((s) => s !== specialty)
            : [...current, specialty];
        updateFilter('specialties', updated);
    };

    const clearFilters = () => {
        onFilterChange({
            search: '',
            location: '',
            specialties: [],
            priceRange: [0, 200],
            minRating: 0,
            availability: 'all',
            sortBy: 'rating',
        });
    };

    const activeFilterCount = [
        filters.location !== '',
        filters.specialties.length > 0,
        filters.priceRange[0] > 0 || filters.priceRange[1] < 200,
        filters.minRating > 0,
        filters.availability !== 'all',
    ].filter(Boolean).length;

    const FilterContent = () => (
        <div className="space-y-6">
            {/* Location */}
            <div>
                <Label className="text-sm font-medium">Location</Label>
                <Select
                    value={filters.location || 'all'}
                    onValueChange={(value) => updateFilter('location', value === 'all' ? '' : value)}
                >
                    <SelectTrigger className="mt-2">
                        <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All locations</SelectItem>
                        {locations.map((location) => (
                            <SelectItem key={location} value={location}>
                                {location}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            {/* Specialties */}
            <div>
                <Label className="text-sm font-medium">Specialties</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                    {specialties.slice(0, 12).map((specialty) => (
                        <Badge
                            key={specialty}
                            variant={filters.specialties.includes(specialty) ? 'default' : 'outline'}
                            className="cursor-pointer rounded-full transition-colors"
                            onClick={() => toggleSpecialty(specialty)}
                        >
                            {specialty}
                        </Badge>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Price Range */}
            <div>
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Price Range</Label>
                    <span className="text-sm text-muted-foreground">
                        ${filters.priceRange[0]} - ${filters.priceRange[1]}+
                    </span>
                </div>
                <Slider
                    value={filters.priceRange}
                    min={0}
                    max={200}
                    step={10}
                    onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                    className="mt-4"
                />
            </div>

            <Separator />

            {/* Minimum Rating */}
            <div>
                <Label className="text-sm font-medium">Minimum Rating</Label>
                <div className="mt-3 flex gap-2">
                    {[0, 4, 4.5, 4.8].map((rating) => (
                        <Button
                            key={rating}
                            variant={filters.minRating === rating ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-full"
                            onClick={() => updateFilter('minRating', rating)}
                        >
                            {rating === 0 ? 'Any' : `${rating}+`}
                        </Button>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Availability */}
            <div>
                <Label className="text-sm font-medium">Session Type</Label>
                <div className="mt-3 space-y-3">
                    {[
                        { value: 'all', label: 'All types' },
                        { value: 'online', label: 'Online only' },
                        { value: 'in-person', label: 'In-person only' },
                    ].map((option) => (
                        <div key={option.value} className="flex items-center gap-2">
                            <Checkbox
                                id={option.value}
                                checked={filters.availability === option.value}
                                onCheckedChange={() => updateFilter('availability', option.value as FilterState['availability'])}
                            />
                            <Label htmlFor={option.value} className="text-sm cursor-pointer">
                                {option.label}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            {activeFilterCount > 0 && (
                <>
                    <Separator />
                    <Button variant="outline" className="w-full" onClick={clearFilters}>
                        Clear all filters
                    </Button>
                </>
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center gap-3">
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
                            <FilterContent />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">{resultCount} coaches found</span>
                    {filters.location && (
                        <Badge variant="secondary" className="gap-1.5">
                            {filters.location}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('location', '')} />
                        </Badge>
                    )}
                    {filters.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="gap-1.5">
                            {specialty}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => toggleSpecialty(specialty)} />
                        </Badge>
                    ))}
                    {(filters.priceRange[0] > 0 || filters.priceRange[1] < 200) && (
                        <Badge variant="secondary" className="gap-1.5">
                            ${filters.priceRange[0]} - ${filters.priceRange[1]}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('priceRange', [0, 200])} />
                        </Badge>
                    )}
                    {filters.minRating > 0 && (
                        <Badge variant="secondary" className="gap-1.5">
                            {filters.minRating}+ rating
                            <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('minRating', 0)} />
                        </Badge>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                        Clear all
                    </Button>
                </div>
            )}

            {/* Desktop Sidebar (rendered by parent) */}
            <div className="hidden lg:block">
                <div className="rounded-2xl border bg-card p-6">
                    <h3 className="font-semibold">Filters</h3>
                    <div className="mt-4">
                        <FilterContent />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export a simple sidebar version for the browse page layout
export function CoachFiltersSidebar({ filters, onFilterChange }: Omit<CoachFiltersProps, 'resultCount'>) {
    const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const toggleSpecialty = (specialty: string) => {
        const current = filters.specialties;
        const updated = current.includes(specialty)
            ? current.filter((s) => s !== specialty)
            : [...current, specialty];
        updateFilter('specialties', updated);
    };

    const clearFilters = () => {
        onFilterChange({
            search: '',
            location: '',
            specialties: [],
            priceRange: [0, 200],
            minRating: 0,
            availability: 'all',
            sortBy: 'rating',
        });
    };

    const activeFilterCount = [
        filters.location !== '',
        filters.specialties.length > 0,
        filters.priceRange[0] > 0 || filters.priceRange[1] < 200,
        filters.minRating > 0,
        filters.availability !== 'all',
    ].filter(Boolean).length;

    return (
        <div className="sticky top-24 space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-premium">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Filters</h3>
                    {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                            Clear all
                        </Button>
                    )}
                </div>

                <div className="mt-6 space-y-6">
                    {/* Location */}
                    <div>
                        <Label className="text-sm font-medium">Location</Label>
                        <Select
                            value={filters.location || 'all'}
                            onValueChange={(value) => updateFilter('location', value === 'all' ? '' : value)}
                        >
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="All locations" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All locations</SelectItem>
                                {locations.map((location) => (
                                    <SelectItem key={location} value={location}>
                                        {location}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    {/* Specialties */}
                    <div>
                        <Label className="text-sm font-medium">Specialties</Label>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {specialties.slice(0, 10).map((specialty) => (
                                <Badge
                                    key={specialty}
                                    variant={filters.specialties.includes(specialty) ? 'default' : 'outline'}
                                    className="cursor-pointer rounded-full transition-colors text-xs"
                                    onClick={() => toggleSpecialty(specialty)}
                                >
                                    {specialty}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Price Range */}
                    <div>
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Price Range</Label>
                            <span className="text-xs text-muted-foreground">
                                ${filters.priceRange[0]} - ${filters.priceRange[1]}+
                            </span>
                        </div>
                        <Slider
                            value={filters.priceRange}
                            min={0}
                            max={200}
                            step={10}
                            onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                            className="mt-4"
                        />
                    </div>

                    <Separator />

                    {/* Minimum Rating */}
                    <div>
                        <Label className="text-sm font-medium">Minimum Rating</Label>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {[0, 4, 4.5, 4.8].map((rating) => (
                                <Button
                                    key={rating}
                                    variant={filters.minRating === rating ? 'default' : 'outline'}
                                    size="sm"
                                    className="rounded-full h-8 text-xs"
                                    onClick={() => updateFilter('minRating', rating)}
                                >
                                    {rating === 0 ? 'Any' : `${rating}+`}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    {/* Session Type */}
                    <div>
                        <Label className="text-sm font-medium">Session Type</Label>
                        <div className="mt-3 space-y-2.5">
                            {[
                                { value: 'all', label: 'All types' },
                                { value: 'online', label: 'Online only' },
                                { value: 'in-person', label: 'In-person only' },
                            ].map((option) => (
                                <div key={option.value} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`sidebar-${option.value}`}
                                        checked={filters.availability === option.value}
                                        onCheckedChange={() => updateFilter('availability', option.value as FilterState['availability'])}
                                    />
                                    <Label htmlFor={`sidebar-${option.value}`} className="text-sm cursor-pointer">
                                        {option.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
