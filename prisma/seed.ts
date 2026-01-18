import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Use string constants that match Prisma schema enums
// This allows the seed to compile before migrations are run
const UserRole = {
    CLIENT: 'CLIENT' as const,
    COACH: 'COACH' as const,
    ADMIN: 'ADMIN' as const,
};

const PackageType = {
    ONLINE: 'ONLINE' as const,
    IN_PERSON: 'IN_PERSON' as const,
};

const BookingStatus = {
    PENDING_PAYMENT: 'PENDING_PAYMENT' as const,
    CONFIRMED: 'CONFIRMED' as const,
    COMPLETED: 'COMPLETED' as const,
    CANCELLED: 'CANCELLED' as const,
    REFUNDED: 'REFUNDED' as const,
};

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clean existing data
    await prisma.message.deleteMany();
    await prisma.chatThread.deleteMany();
    await prisma.review.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.package.deleteMany();
    await prisma.coachGalleryImage.deleteMany();
    await prisma.coachProfile.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Cleaned existing data');

    // Create password hash (password: "password123")
    const passwordHash = await bcrypt.hash('password123', 12);

    // Create admin user
    const admin = await prisma.user.create({
        data: {
            email: 'admin@fitconnect.com',
            passwordHash,
            role: UserRole.ADMIN,
        },
    });
    console.log('✅ Created admin user');

    // Create client users
    const clients = await Promise.all([
        prisma.user.create({
            data: {
                email: 'alex@example.com',
                passwordHash,
                role: UserRole.CLIENT,
            },
        }),
        prisma.user.create({
            data: {
                email: 'jordan@example.com',
                passwordHash,
                role: UserRole.CLIENT,
            },
        }),
        prisma.user.create({
            data: {
                email: 'sam@example.com',
                passwordHash,
                role: UserRole.CLIENT,
            },
        }),
    ]);
    console.log('✅ Created client users');

    // Create coach users with profiles
    const coachData = [
        {
            email: 'sarah@example.com',
            profile: {
                displayName: 'Sarah Mitchell',
                bio: 'Certified personal trainer with 8+ years of experience. I specialize in strength training, athletic performance, and weight loss transformations. My approach combines science-based programming with sustainable lifestyle changes.',
                tagline: 'Transform your body, transform your life',
                location: 'New York, NY',
                specialties: ['Strength Training', 'Athletic Performance', 'Weight Loss'],
                certifications: ['NASM-CPT', 'CSCS', 'Precision Nutrition L1'],
                languages: ['English', 'Spanish'],
                responseTime: 'Usually within 1 hour',
                startingRate: 7500,
                ratingAvg: 4.9,
                ratingCount: 127,
                sessionsCompleted: 342,
            },
        },
        {
            email: 'marcus@example.com',
            profile: {
                displayName: 'Marcus Johnson',
                bio: 'Former D1 athlete turned coach. I help busy professionals build muscle, lose fat, and optimize performance. Online and in-person coaching available.',
                tagline: 'Elite training for ambitious people',
                location: 'Los Angeles, CA',
                specialties: ['Bodybuilding', 'Nutrition', 'Muscle Building'],
                certifications: ['ISSA-CPT', 'Certified Sports Nutritionist'],
                languages: ['English'],
                responseTime: 'Usually within 30 minutes',
                startingRate: 8500,
                ratingAvg: 4.8,
                ratingCount: 89,
                sessionsCompleted: 215,
            },
        },
        {
            email: 'emma@example.com',
            profile: {
                displayName: 'Emma Chen',
                bio: 'Yoga instructor and mindfulness coach. I blend traditional practices with modern fitness to help you find balance, flexibility, and inner peace.',
                tagline: 'Find your flow, find yourself',
                location: 'San Francisco, CA',
                specialties: ['Yoga', 'Flexibility', 'Mindfulness'],
                certifications: ['RYT-500', 'Meditation Teacher Certification'],
                languages: ['English', 'Mandarin'],
                responseTime: 'Usually within 2 hours',
                startingRate: 6000,
                ratingAvg: 5.0,
                ratingCount: 156,
                sessionsCompleted: 428,
            },
        },
        {
            email: 'james@example.com',
            profile: {
                displayName: 'James Rodriguez',
                bio: 'CrossFit coach and functional fitness expert. I design challenging, effective workouts that build real-world strength and endurance.',
                tagline: 'Forged in the fire of functional fitness',
                location: 'Miami, FL',
                specialties: ['CrossFit', 'HIIT', 'Functional Fitness'],
                certifications: ['CrossFit L3', 'USAW Sports Performance'],
                languages: ['English', 'Portuguese'],
                responseTime: 'Usually within 1 hour',
                startingRate: 7000,
                ratingAvg: 4.7,
                ratingCount: 203,
                sessionsCompleted: 567,
            },
        },
        {
            email: 'rachel@example.com',
            profile: {
                displayName: 'Rachel Kim',
                bio: 'Pilates instructor and rehabilitation specialist. I help clients recover from injuries and build core strength through precise, controlled movements.',
                tagline: 'Precision movement for lasting results',
                location: 'Chicago, IL',
                specialties: ['Pilates', 'Rehabilitation', 'Posture Correction'],
                certifications: ['Balanced Body Certified', 'Physical Therapy Assistant'],
                languages: ['English', 'Korean'],
                responseTime: 'Usually within 3 hours',
                startingRate: 8000,
                ratingAvg: 4.9,
                ratingCount: 78,
                sessionsCompleted: 189,
            },
        },
        {
            email: 'david@example.com',
            profile: {
                displayName: 'David Thompson',
                bio: 'Marathon runner and endurance coach. I train athletes from 5K to ultramarathon distances with personalized plans that get results.',
                tagline: 'Go the distance',
                location: 'Boston, MA',
                specialties: ['Kettlebell Training', 'Endurance', 'Running'],
                certifications: ['RRCA Certified', 'StrongFirst SFG'],
                languages: ['English'],
                responseTime: 'Usually within 2 hours',
                startingRate: 6500,
                ratingAvg: 4.6,
                ratingCount: 64,
                sessionsCompleted: 145,
            },
        },
    ];

    const coaches: Array<{ user: typeof admin; profile: Awaited<ReturnType<typeof prisma.coachProfile.create>> }> = [];

    for (const data of coachData) {
        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                role: UserRole.COACH,
            },
        });

        const profile = await prisma.coachProfile.create({
            data: {
                userId: user.id,
                ...data.profile,
                stripeOnboarded: false, // Set to true if testing payments
            },
        });

        // Add gallery images
        await prisma.coachGalleryImage.createMany({
            data: [
                { coachId: profile.id, url: `https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400`, sortOrder: 0 },
                { coachId: profile.id, url: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400`, sortOrder: 1 },
            ],
        });

        // Create packages
        await prisma.package.createMany({
            data: [
                {
                    coachId: profile.id,
                    title: 'Single Session',
                    description: 'One-on-one training session',
                    durationMins: 60,
                    priceCents: data.profile.startingRate,
                    type: PackageType.IN_PERSON,
                },
                {
                    coachId: profile.id,
                    title: '4-Week Program',
                    description: 'Customized 4-week training program with weekly check-ins',
                    durationMins: 60,
                    priceCents: data.profile.startingRate * 3,
                    type: PackageType.ONLINE,
                },
                {
                    coachId: profile.id,
                    title: 'Premium Coaching',
                    description: '12-week transformation program with daily support',
                    durationMins: 90,
                    priceCents: data.profile.startingRate * 10,
                    type: PackageType.ONLINE,
                },
            ],
        });

        coaches.push({ user, profile });
    }
    console.log('✅ Created coach users with profiles and packages');

    // Create some bookings
    const now = new Date();
    const packages = await prisma.package.findMany();

    // Upcoming booking
    await prisma.booking.create({
        data: {
            coachId: coaches[0].profile.id,
            clientId: clients[0].id,
            packageId: packages[0].id,
            startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
            status: BookingStatus.CONFIRMED,
            amountCents: packages[0].priceCents,
            platformFeeCents: Math.round(packages[0].priceCents * 0.1),
            payoutCents: Math.round(packages[0].priceCents * 0.9),
        },
    });

    // Completed booking with review
    const completedBooking = await prisma.booking.create({
        data: {
            coachId: coaches[1].profile.id,
            clientId: clients[0].id,
            packageId: packages[3].id,
            startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
            status: BookingStatus.COMPLETED,
            amountCents: packages[3].priceCents,
            platformFeeCents: Math.round(packages[3].priceCents * 0.1),
            payoutCents: Math.round(packages[3].priceCents * 0.9),
        },
    });

    await prisma.review.create({
        data: {
            bookingId: completedBooking.id,
            coachId: coaches[1].profile.id,
            clientId: clients[0].id,
            rating: 5,
            text: 'Amazing session! Marcus is incredibly knowledgeable and made the workout challenging yet achievable.',
        },
    });

    console.log('✅ Created bookings and reviews');

    // Create chat threads with messages
    const thread = await prisma.chatThread.create({
        data: {
            coachId: coaches[0].user.id,
            clientId: clients[0].id,
            lastMessageAt: new Date(),
        },
    });

    await prisma.message.createMany({
        data: [
            {
                threadId: thread.id,
                senderId: clients[0].id,
                content: "Hi Sarah! I'm interested in your strength training program. What should I expect in the first session?",
                createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
            },
            {
                threadId: thread.id,
                senderId: coaches[0].user.id,
                content: "Hi Alex! Great to hear from you! In our first session, we'll do a comprehensive fitness assessment, discuss your goals, and start with some foundational movements. I'll create a personalized plan based on what we learn.",
                createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
                readAt: new Date(now.getTime() - 30 * 60 * 1000),
            },
            {
                threadId: thread.id,
                senderId: clients[0].id,
                content: "That sounds perfect! I'm excited to get started.",
                createdAt: new Date(now.getTime() - 15 * 60 * 1000),
            },
        ],
    });

    console.log('✅ Created chat threads and messages');

    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('Test accounts (password: password123):');
    console.log('  Admin:  admin@fitconnect.com');
    console.log('  Client: alex@example.com');
    console.log('  Coach:  sarah@example.com');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
