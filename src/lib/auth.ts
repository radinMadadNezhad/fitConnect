import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Local type definition to avoid Prisma import issues before migration
export type UserRole = 'CLIENT' | 'COACH' | 'ADMIN';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-for-development-only'
);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12;

// ============================================
// PASSWORD HASHING
// ============================================

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ============================================
// JWT TOKENS
// ============================================

export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
}

export async function signToken(payload: JWTPayload): Promise<string> {
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRES_IN)
        .sign(JWT_SECRET);

    return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

// ============================================
// COOKIE MANAGEMENT
// ============================================

const COOKIE_NAME = 'auth_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export async function setAuthCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
    });
}

export async function getAuthCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    return cookie?.value || null;
}

export async function clearAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

// ============================================
// AUTH MIDDLEWARE HELPERS
// ============================================

export interface AuthUser {
    userId: string;
    email: string;
    role: UserRole;
}

/**
 * Get the current authenticated user from request cookies
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    const token = await getAuthCookie();
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
    };
}

/**
 * Get current user or throw 401 response
 */
export async function requireAuth(): Promise<AuthUser> {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Unauthorized');
    }
    return user;
}

/**
 * Require specific role(s)
 */
export async function requireRole(roles: UserRole | UserRole[]): Promise<AuthUser> {
    const user = await requireAuth();
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(user.role)) {
        throw new Error('Forbidden');
    }

    return user;
}

// ============================================
// ROUTE HANDLER WRAPPERS
// ============================================

type RouteHandler = (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

type AuthenticatedHandler = (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
    user: AuthUser
) => Promise<NextResponse>;

/**
 * Wrap a route handler with authentication check
 */
export function withAuth(handler: AuthenticatedHandler): RouteHandler {
    return async (req, context) => {
        try {
            const user = await requireAuth();
            return handler(req, context, user);
        } catch {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    };
}

/**
 * Wrap a route handler with role check
 */
export function withRole(
    roles: UserRole | UserRole[],
    handler: AuthenticatedHandler
): RouteHandler {
    return async (req, context) => {
        try {
            const user = await requireRole(roles);
            return handler(req, context, user);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'Forbidden') {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
            }
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    };
}

// ============================================
// RATE LIMITING (Simple in-memory implementation)
// ============================================

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per window for auth endpoints

export function checkRateLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
} {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // Clean up expired entries periodically
    if (rateLimitStore.size > 10000) {
        for (const [key, val] of rateLimitStore.entries()) {
            if (val.resetAt < now) {
                rateLimitStore.delete(key);
            }
        }
    }

    if (!entry || entry.resetAt < now) {
        // New window
        const newEntry: RateLimitEntry = {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW_MS,
        };
        rateLimitStore.set(identifier, newEntry);
        return {
            allowed: true,
            remaining: RATE_LIMIT_MAX_REQUESTS - 1,
            resetAt: newEntry.resetAt,
        };
    }

    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.resetAt,
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
        resetAt: entry.resetAt,
    };
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitId(req: NextRequest, prefix: string): string {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        'unknown';
    return `${prefix}:${ip}`;
}
