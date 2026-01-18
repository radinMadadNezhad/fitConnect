import { z } from 'zod';
import { PackageType, BookingStatus } from '@prisma/client';

// ============================================
// AUTH
// ============================================

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['CLIENT', 'COACH']).default('CLIENT'),
    displayName: z.string().min(2).max(100).optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// COACH PROFILE
// ============================================

export const createCoachProfileSchema = z.object({
    displayName: z.string().min(2).max(100),
    bio: z.string().max(2000).optional(),
    tagline: z.string().max(200).optional(),
    location: z.string().max(100).optional(),
    specialties: z.array(z.string()).max(10).optional(),
    certifications: z.array(z.string()).max(20).optional(),
    languages: z.array(z.string()).max(10).optional(),
    responseTime: z.string().max(100).optional(),
});

export const updateCoachProfileSchema = createCoachProfileSchema.partial();

export type CreateCoachProfileInput = z.infer<typeof createCoachProfileSchema>;
export type UpdateCoachProfileInput = z.infer<typeof updateCoachProfileSchema>;

// ============================================
// GALLERY
// ============================================

export const addGalleryImageSchema = z.object({
    url: z.string().url('Invalid image URL'),
    sortOrder: z.number().int().min(0).max(100).optional(),
});

export type AddGalleryImageInput = z.infer<typeof addGalleryImageSchema>;

// ============================================
// PACKAGES
// ============================================

export const createPackageSchema = z.object({
    title: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
    durationMins: z.number().int().min(15).max(480),
    priceCents: z.number().int().min(100).max(100000), // $1 - $1000
    currency: z.string().length(3).default('usd'),
    type: z.nativeEnum(PackageType),
});

export const updatePackageSchema = createPackageSchema.partial().extend({
    isActive: z.boolean().optional(),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;

// ============================================
// BOOKINGS
// ============================================

export const createBookingIntentSchema = z.object({
    coachId: z.string().cuid(),
    packageId: z.string().cuid(),
    startTime: z.string().datetime(),
});

export const cancelBookingSchema = z.object({
    reason: z.string().max(500).optional(),
});

export type CreateBookingIntentInput = z.infer<typeof createBookingIntentSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

// ============================================
// CHAT
// ============================================

export const createThreadSchema = z.object({
    coachId: z.string().cuid(),
});

export const sendMessageSchema = z.object({
    content: z.string().min(1).max(5000),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ============================================
// REVIEWS
// ============================================

export const createReviewSchema = z.object({
    bookingId: z.string().cuid(),
    rating: z.number().int().min(1).max(5),
    text: z.string().max(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// ============================================
// QUERY PARAMS
// ============================================

export const coachSearchSchema = z.object({
    search: z.string().optional(),
    location: z.string().optional(),
    specialties: z.array(z.string()).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().max(100000).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    type: z.nativeEnum(PackageType).optional(),
    sortBy: z.enum(['rating', 'price-low', 'price-high', 'reviews']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CoachSearchParams = z.infer<typeof coachSearchSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;

// ============================================
// HELPER
// ============================================

/**
 * Safely parse a schema and return result or null
 */
export function safeParse<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}

/**
 * Format Zod errors for API response
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    for (const issue of error.issues) {
        const path = issue.path.join('.') || 'root';
        if (!errors[path]) {
            errors[path] = [];
        }
        errors[path].push(issue.message);
    }
    return errors;
}
