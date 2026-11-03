import { describe, it, expect } from 'vitest';
import { adaptCoach, adaptCoaches, type ApiCoach } from '@/lib/coach-adapter';

/**
 * The adapter is the seam between the API (cents, Prisma enums, displayName)
 * and the marketplace UI (dollars, lowercase enums, name). Getting the money
 * units wrong here silently hides every coach behind the price filter.
 */
const apiCoach: ApiCoach = {
    id: 'cmvzqu18a000mevrwenrdjr9u',
    displayName: 'Emma Chen',
    bio: 'Yoga and mobility.',
    tagline: 'Find your flow',
    location: 'San Francisco, CA',
    specialties: ['Yoga', 'Flexibility'],
    certifications: ['RYT-500'],
    languages: ['English'],
    responseTime: 'Usually within 2 hours',
    startingRate: 6000,
    ratingAvg: 5,
    ratingCount: 156,
    sessionsCompleted: 428,
    avatar: 'https://example.com/a.jpg',
    gallery: [{ url: 'https://example.com/g1.jpg' }],
    packages: [
        { id: 'p1', title: 'Single Session', durationMins: 60, priceCents: 6000, type: 'IN_PERSON' },
        { id: 'p2', title: '4-Week Program', durationMins: 60, priceCents: 18000, type: 'ONLINE' },
    ],
};

describe('adaptCoach', () => {
    it('maps the API field names onto what the card reads', () => {
        const ui = adaptCoach(apiCoach);

        expect(ui.name).toBe('Emma Chen');
        expect(ui.rating).toBe(5);
        expect(ui.reviewCount).toBe(156);
        expect(ui.id).toBe(apiCoach.id);
    });

    it('converts cents to whole dollars for the price filter', () => {
        // The browse filter range is 0-200 in dollars; 6000 cents must become 60.
        expect(adaptCoach(apiCoach).startingRate).toBe(60);
    });

    it('maps Prisma package enums to the UI values', () => {
        const [single, program] = adaptCoach(apiCoach).packages;

        expect(single.type).toBe('in-person');
        expect(program.type).toBe('online');
        expect(single.duration).toBe(60);
        expect(single.price).toBe(60);
        expect(program.price).toBe(180);
    });

    it('flattens gallery objects to urls', () => {
        expect(adaptCoach(apiCoach).gallery).toEqual(['https://example.com/g1.jpg']);
    });

    it('accepts a gallery already given as strings', () => {
        const ui = adaptCoach({ ...apiCoach, gallery: ['https://example.com/x.jpg'] });

        expect(ui.gallery).toEqual(['https://example.com/x.jpg']);
    });

    it('falls back to the first gallery image when there is no avatar', () => {
        const ui = adaptCoach({ ...apiCoach, avatar: null });

        expect(ui.avatar).toBe('https://example.com/g1.jpg');
    });

    it('survives a sparse record without throwing or producing undefined', () => {
        const ui = adaptCoach({ id: 'c1', displayName: 'Minimal Coach' });

        expect(ui.name).toBe('Minimal Coach');
        expect(ui.startingRate).toBe(0);
        expect(ui.rating).toBe(0);
        expect(ui.specialties).toEqual([]);
        expect(ui.packages).toEqual([]);
        expect(ui.gallery).toEqual([]);
        expect(ui.avatar).toBe('');
        expect(ui.location).toBe('');
    });

    it('never emits a price the filter would treat as fractional', () => {
        const ui = adaptCoach({ ...apiCoach, startingRate: 6549 });

        expect(Number.isInteger(ui.startingRate)).toBe(true);
    });
});

describe('adaptCoaches', () => {
    it('maps a list and preserves order', () => {
        const list = adaptCoaches([
            apiCoach,
            { ...apiCoach, id: 'c2', displayName: 'Second Coach' },
        ]);

        expect(list).toHaveLength(2);
        expect(list[1].name).toBe('Second Coach');
    });

    it('returns an empty array for an empty response', () => {
        expect(adaptCoaches([])).toEqual([]);
    });
});
