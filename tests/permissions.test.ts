import { describe, it, expect } from 'vitest';
import {
    canAccessBooking,
    canCancelBooking,
    canAccessThread,
    canSendMessage,
    canCreateReview,
    canModifyCoachProfile,
    canAccessCoachProfile,
    canAccessStripeAccount,
} from '@/lib/permissions';
import type { AuthUser } from '@/lib/auth';

const client: AuthUser = { userId: 'u_client', email: 'c@example.com', role: 'CLIENT' };
const coach: AuthUser = { userId: 'u_coach', email: 'k@example.com', role: 'COACH' };
const stranger: AuthUser = { userId: 'u_other', email: 'o@example.com', role: 'CLIENT' };
const admin: AuthUser = { userId: 'u_admin', email: 'a@example.com', role: 'ADMIN' };

const booking = { clientId: 'u_client', coachId: 'u_coach', status: 'CONFIRMED' };
const thread = { clientId: 'u_client', coachId: 'u_coach' };

describe('canAccessBooking', () => {
    it('allows both participants and admin', () => {
        expect(canAccessBooking(client, booking)).toBeTruthy();
        expect(canAccessBooking(coach, booking)).toBeTruthy();
        expect(canAccessBooking(admin, booking)).toBeTruthy();
    });

    it('denies an unrelated user', () => {
        expect(canAccessBooking(stranger, booking)).toBeFalsy();
    });
});

describe('canCancelBooking', () => {
    it('allows cancelling a live booking', () => {
        for (const status of ['PENDING_PAYMENT', 'CONFIRMED']) {
            expect(canCancelBooking(client, { ...booking, status })).toBeTruthy();
            expect(canCancelBooking(coach, { ...booking, status })).toBeTruthy();
        }
    });

    // Without this, a settled booking could be cancelled again and refunded twice.
    it('refuses a booking that is already finished or settled', () => {
        for (const status of ['COMPLETED', 'CANCELLED', 'REFUNDED']) {
            expect(canCancelBooking(client, { ...booking, status })).toBe(false);
            expect(canCancelBooking(admin, { ...booking, status })).toBe(false);
        }
    });

    it('refuses an unrelated user even on a cancellable booking', () => {
        expect(canCancelBooking(stranger, booking)).toBeFalsy();
    });
});

describe('chat permissions', () => {
    it('lets participants read and write their own thread', () => {
        expect(canAccessThread(client, thread)).toBeTruthy();
        expect(canSendMessage(coach, thread)).toBeTruthy();
    });

    // This is the hole that allowed injecting messages into other people's threads.
    it('refuses a non-participant', () => {
        expect(canAccessThread(stranger, thread)).toBeFalsy();
        expect(canSendMessage(stranger, thread)).toBeFalsy();
    });

    it('lets admin read a thread but not post into it', () => {
        expect(canAccessThread(admin, thread)).toBeTruthy();
        expect(canSendMessage(admin, thread)).toBe(false);
    });
});

describe('canCreateReview', () => {
    it('allows the client only after the session is completed', () => {
        expect(canCreateReview(client, { clientId: 'u_client', status: 'COMPLETED' })).toBe(true);
    });

    it('refuses review before completion', () => {
        for (const status of ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REFUNDED']) {
            expect(canCreateReview(client, { clientId: 'u_client', status })).toBe(false);
        }
    });

    it('refuses someone who was not the client, and refuses the coach reviewing themselves', () => {
        expect(canCreateReview(stranger, { clientId: 'u_client', status: 'COMPLETED' })).toBe(false);
        expect(canCreateReview(coach, { clientId: 'u_client', status: 'COMPLETED' })).toBe(false);
    });
});

describe('coach profile and payout access', () => {
    it('only the owner may modify a profile — not even admin', () => {
        expect(canModifyCoachProfile(coach, 'u_coach')).toBe(true);
        expect(canModifyCoachProfile(admin, 'u_coach')).toBe(false);
        expect(canModifyCoachProfile(stranger, 'u_coach')).toBe(false);
    });

    it('owner or admin may read a profile', () => {
        expect(canAccessCoachProfile(coach, 'u_coach')).toBe(true);
        expect(canAccessCoachProfile(admin, 'u_coach')).toBe(true);
        expect(canAccessCoachProfile(stranger, 'u_coach')).toBe(false);
    });

    it('never exposes another coach payout account', () => {
        expect(canAccessStripeAccount(coach, 'u_coach')).toBe(true);
        expect(canAccessStripeAccount(stranger, 'u_coach')).toBe(false);
    });
});
