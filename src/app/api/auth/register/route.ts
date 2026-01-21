import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken, setAuthCookie, checkRateLimit, getRateLimitId } from '@/lib/auth';
import { registerSchema, formatZodErrors } from '@/lib/validators';
import { UserRole } from '@prisma/client';

export async function POST(req: Request) {
    console.log("DEBUG_DB_URL_CHECK:", process.env.DATABASE_URL ? "Defined and starts with " + process.env.DATABASE_URL.substring(0, 15) : "Undefined");
    try {
        // Rate limiting
        const rateLimitId = getRateLimitId(req as NextRequest, 'register');
        const rateLimit = checkRateLimit(rateLimitId);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimit.resetAt.toString(),
                    },
                }
            );
        }

        // Parse and validate body
        const body = await req.json();
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatZodErrors(validation.error) },
                { status: 400 }
            );
        }

        const { email, password, role, displayName } = validation.data;

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user (and coach profile if role is COACH)
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                role: role as UserRole,
                ...(role === 'COACH' && displayName
                    ? {
                        coachProfile: {
                            create: {
                                displayName,
                            },
                        },
                    }
                    : {}),
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                coachProfile: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
            },
        });

        // Sign JWT and set cookie
        const token = await signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        await setAuthCookie(token);

        return NextResponse.json(
            {
                message: 'Registration successful',
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    coachProfile: user.coachProfile,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("DEBUG_REGISTER_ERROR:", error);
        // @ts-ignore
        console.error("DEBUG_REGISTER_ERROR_MSG:", error.message);
        // @ts-ignore
        console.error("DEBUG_REGISTER_ERROR_CODE:", error.code);
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
            { status: 500 }
        );
    }
}
