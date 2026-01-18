# FitConnect Backend

Production-ready backend for a freelance marketplace for gym coaches/trainers.

## Tech Stack

- **Framework**: Next.js 16 (App Router API routes)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Custom JWT (jose + bcrypt)
- **Payments**: Stripe Connect (destination charges)
- **Real-time**: Supabase Realtime
- **Validation**: Zod

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account (test mode)
- Supabase project (for real-time chat)

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with test data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Stripe Webhook Testing

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Test Accounts

After seeding, use these accounts (password: `password123`):

| Role   | Email                  |
|--------|------------------------|
| Admin  | admin@fitconnect.com   |
| Client | alex@example.com       |
| Coach  | sarah@example.com      |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Marketplace (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coaches` | Browse coaches (search, filters, pagination) |
| GET | `/api/coaches/:id` | Get coach profile |
| GET | `/api/coaches/:id/reviews` | Get coach reviews |

### Coach Management (Coaches only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coach/profile` | Get own profile |
| POST | `/api/coach/profile` | Create profile |
| PATCH | `/api/coach/profile` | Update profile |
| GET/POST | `/api/coach/gallery` | Manage gallery images |
| DELETE | `/api/coach/gallery/:imageId` | Delete image |
| GET/POST | `/api/coach/packages` | Manage packages |
| PATCH/DELETE | `/api/coach/packages/:id` | Update/delete package |
| GET | `/api/coach/bookings` | Get coach's bookings |

### Stripe Connect (Coaches only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe/connect/account` | Create Stripe account |
| POST | `/api/stripe/connect/onboarding-link` | Get onboarding URL |
| GET | `/api/stripe/connect/status` | Check account status |
| POST | `/api/stripe/webhook` | Stripe webhook handler |

### Bookings (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/create-intent` | Create booking + PaymentIntent |
| GET | `/api/bookings` | Get client's bookings |
| POST | `/api/bookings/:id/cancel` | Cancel booking (auto-refund) |

### Chat (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/threads` | Get conversation list |
| POST | `/api/chat/threads` | Create/get thread |
| GET | `/api/chat/threads/:id/messages` | Get messages (paginated) |
| POST | `/api/chat/threads/:id/messages` | Send message |

### Reviews (Authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Create review (completed bookings only) |

## Payment Flow

1. Client calls `POST /api/bookings/create-intent`
2. Backend creates booking (PENDING_PAYMENT) and Stripe PaymentIntent
3. Client confirms payment on frontend using `client_secret`
4. Stripe sends webhook `payment_intent.succeeded`
5. Backend confirms booking and records payment
6. Coach receives payout (minus platform fee) via Stripe Connect

## Database Schema

```
User ─┬─> CoachProfile ──> Package
      │         ├──> CoachGalleryImage
      │         ├──> Review
      │
      ├─> Booking ──> Payment
      │
      └─> ChatThread ──> Message
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables:
   - `DATABASE_URL` (use connection pooler URL)
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy triggers auto-migration via build script

## Security

- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ JWT with httpOnly cookies
- ✅ Role-based access control
- ✅ Rate limiting on auth endpoints
- ✅ Stripe webhook signature verification
- ✅ Zod input validation
- ✅ Prisma SQL injection prevention
- ✅ CORS configuration
