import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/coaches',
    '/api/stripe/webhook',
];

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // CORS headers for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const origin = request.headers.get('origin') || '';
        const allowedOrigins = [
            'http://localhost:3000',
            'https://fitconnect.vercel.app', // Production
            process.env.NEXT_PUBLIC_APP_URL,
        ].filter(Boolean);

        if (allowedOrigins.includes(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin);
        }

        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Max-Age', '86400');

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, { status: 200, headers: response.headers });
        }
    }

    return response;
}

export const config = {
    matcher: ['/api/:path*'],
};
