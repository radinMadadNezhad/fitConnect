import { AuthUser } from './auth';

// Constants for roles and statuses (matching Prisma schema enums)
const UserRoles = {
    CLIENT: 'CLIENT',
    COACH: 'COACH',
    ADMIN: 'ADMIN',
} as const;

const BookingStatuses = {
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    CONFIRMED: 'CONFIRMED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
} as const;

// ============================================
// ROLE CHECKS
// ============================================

export function isClient(user: AuthUser): boolean {
    return user.role === UserRoles.CLIENT;
}

export function isCoach(user: AuthUser): boolean {
    return user.role === UserRoles.COACH;
}

export function isAdmin(user: AuthUser): boolean {
    return user.role === UserRoles.ADMIN;
}

export function isCoachOrAdmin(user: AuthUser): boolean {
    return user.role === UserRoles.COACH || user.role === UserRoles.ADMIN;
}

// ============================================
// RESOURCE OWNERSHIP
// ============================================

export function canAccessCoachProfile(
    user: AuthUser,
    profileUserId: string
): boolean {
    // Owner or admin
    return user.userId === profileUserId || isAdmin(user);
}

export function canModifyCoachProfile(
    user: AuthUser,
    profileUserId: string
): boolean {
    // Only owner can modify
    return user.userId === profileUserId;
}

export function canAccessBooking(
    user: AuthUser,
    booking: { clientId: string; coachId?: string }
): boolean {
    // Client who booked, coach who's booked, or admin
    return (
        user.userId === booking.clientId ||
        (booking.coachId && user.userId === booking.coachId) ||
        isAdmin(user)
    );
}

export function canCancelBooking(
    user: AuthUser,
    booking: { clientId: string; coachId?: string; status: string }
): boolean {
    // Can only cancel pending or confirmed bookings
    const cancellableStatuses = [
        BookingStatuses.PENDING_PAYMENT,
        BookingStatuses.CONFIRMED,
    ];

    if (!(cancellableStatuses as string[]).includes(booking.status)) {
        return false;
    }

    // Client, coach, or admin can cancel
    return canAccessBooking(user, booking);
}

// ============================================
// CHAT PERMISSIONS
// ============================================

export function canAccessThread(
    user: AuthUser,
    thread: { clientId: string; coachId: string }
): boolean {
    // Only participants or admin
    return (
        user.userId === thread.clientId ||
        user.userId === thread.coachId ||
        isAdmin(user)
    );
}

export function canSendMessage(
    user: AuthUser,
    thread: { clientId: string; coachId: string }
): boolean {
    // Only participants can send messages
    return user.userId === thread.clientId || user.userId === thread.coachId;
}

// ============================================
// REVIEW PERMISSIONS
// ============================================

export function canCreateReview(
    user: AuthUser,
    booking: { clientId: string; status: string }
): boolean {
    // Only client can review, only after completion
    return (
        user.userId === booking.clientId &&
        booking.status === BookingStatuses.COMPLETED
    );
}

// ============================================
// STRIPE PERMISSIONS
// ============================================

export function canAccessStripeAccount(
    user: AuthUser,
    coachUserId: string
): boolean {
    // Only the coach themselves or admin
    return user.userId === coachUserId || isAdmin(user);
}

// ============================================
// GENERAL HELPERS
// ============================================

export function assertPermission(
    condition: boolean,
    message = 'Permission denied'
): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}
