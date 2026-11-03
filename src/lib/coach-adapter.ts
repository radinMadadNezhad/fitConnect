import { Coach, Package } from '@/lib/types';

/**
 * Maps the API's coach representation onto the shape the marketplace UI
 * components expect.
 *
 * The two differ in three ways that matter:
 *  - naming: the DB stores `displayName`/`ratingAvg`/`ratingCount`
 *  - money: the API speaks cents, the filters and cards speak whole dollars
 *  - enums: Prisma uses ONLINE/IN_PERSON, the UI uses 'online'/'in-person'
 */

type ApiPackage = {
    id: string;
    title: string;
    description?: string | null;
    durationMins: number;
    priceCents: number;
    type: 'ONLINE' | 'IN_PERSON';
};

type ApiGalleryImage = { url: string };

export type ApiCoach = {
    id: string;
    displayName: string;
    bio?: string | null;
    tagline?: string | null;
    location?: string | null;
    specialties?: string[] | null;
    certifications?: string[] | null;
    languages?: string[] | null;
    responseTime?: string | null;
    startingRate?: number | null;
    ratingAvg?: number | null;
    ratingCount?: number | null;
    sessionsCompleted?: number | null;
    avatar?: string | null;
    gallery?: (ApiGalleryImage | string)[] | null;
    packages?: ApiPackage[] | null;
};

const centsToDollars = (cents: number | null | undefined): number =>
    Math.round((cents ?? 0) / 100);

function adaptPackage(pkg: ApiPackage): Package {
    return {
        id: pkg.id,
        title: pkg.title,
        duration: pkg.durationMins,
        price: centsToDollars(pkg.priceCents),
        type: pkg.type === 'ONLINE' ? 'online' : 'in-person',
        description: pkg.description ?? '',
    };
}

function adaptGallery(gallery: ApiCoach['gallery']): string[] {
    if (!gallery) return [];
    return gallery.map((item) => (typeof item === 'string' ? item : item.url));
}

export function adaptCoach(api: ApiCoach): Coach {
    const gallery = adaptGallery(api.gallery);

    return {
        id: api.id,
        name: api.displayName,
        // Coaches without an uploaded avatar fall back to their first gallery image
        avatar: api.avatar ?? gallery[0] ?? '',
        gallery,
        bio: api.bio ?? '',
        tagline: api.tagline ?? '',
        specialties: api.specialties ?? [],
        certifications: api.certifications ?? [],
        location: api.location ?? '',
        languages: api.languages ?? [],
        rating: api.ratingAvg ?? 0,
        reviewCount: api.ratingCount ?? 0,
        sessionsCompleted: api.sessionsCompleted ?? 0,
        responseTime: api.responseTime ?? '',
        startingRate: centsToDollars(api.startingRate),
        packages: (api.packages ?? []).map(adaptPackage),
        // Per-slot availability is not modelled in the database yet; the
        // availability filter works off package type instead.
        availability: [],
        verified: true,
    };
}

export function adaptCoaches(list: ApiCoach[]): Coach[] {
    return list.map(adaptCoach);
}

/**
 * Fetches the coach listing from the API and adapts it for the UI.
 */
export async function fetchCoaches(): Promise<Coach[]> {
    const res = await fetch('/api/coaches');
    if (!res.ok) throw new Error('Failed to load coaches');
    const json = await res.json();
    const list: ApiCoach[] = json.data ?? json.coaches ?? [];
    return adaptCoaches(list);
}
