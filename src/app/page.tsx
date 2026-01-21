'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Search,
  Calendar,
  CreditCard,
  Shield,
  BadgeCheck,
  Star,
  ChevronRight,
  Dumbbell,
  Users,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { coaches } from '@/lib/mock-data';
import { Header } from '@/components/layout';
import { isDemoMode } from '@/lib/utils';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const featuredCoaches = isDemoMode() ? coaches.slice(0, 6) : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-sm">
                <span className="mr-2">🎯</span>
                Trusted by 10,000+ fitness enthusiasts
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Find Your Perfect{' '}
              <span className="text-gradient">Personal Trainer</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
            >
              Connect with certified coaches, book sessions, and pay securely—all in one place.
              Transform your fitness journey with expert guidance.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            >
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by specialty, location, or name..."
                  className="h-14 rounded-2xl border-2 pl-12 pr-4 text-base shadow-lg focus:border-primary"
                />
              </div>
              <Button asChild size="lg" className="h-14 rounded-2xl px-8 text-base shadow-lg">
                <Link href="/coaches">
                  Browse Coaches
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={fadeInUp}
              className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <span>Verified Coaches</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <span>4.9/5 Average Rating</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Coaches */}
      <section className="border-t bg-muted/30 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Featured Coaches</h2>
              <p className="mt-2 text-muted-foreground">Top-rated trainers ready to help you reach your goals</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:flex">
              <Link href="/coaches">
                View all coaches
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCoaches.map((coach, index) => (
              <motion.div
                key={coach.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={`/coaches/${coach.id}`}>
                  <Card className="group overflow-hidden rounded-2xl border bg-card p-6 shadow-premium transition-all duration-300 hover:shadow-lg hover:border-primary/20">
                    <div className="flex gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={coach.avatar}
                          alt={coach.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {coach.verified && (
                          <div className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1">
                            <BadgeCheck className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold group-hover:text-primary transition-colors">
                          {coach.name}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">{coach.location}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium">{coach.rating}</span>
                          <span className="text-sm text-muted-foreground">({coach.reviewCount})</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {coach.specialties.slice(0, 3).map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="rounded-full text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <div>
                        <span className="text-lg font-bold text-primary">${coach.startingRate}</span>
                        <span className="text-sm text-muted-foreground">/session</span>
                      </div>
                      <span className="text-sm font-medium text-primary group-hover:underline">
                        View Profile →
                      </span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Button asChild variant="outline">
              <Link href="/coaches">
                View all coaches
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">How FitConnect Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in minutes with our simple 3-step process
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Find Your Coach',
                description: 'Browse verified trainers by specialty, location, price, and ratings. Read reviews and find your perfect match.',
              },
              {
                step: '02',
                icon: Calendar,
                title: 'Book a Session',
                description: 'Choose a package, pick a time that works for you, and confirm your booking in seconds.',
              },
              {
                step: '03',
                icon: CreditCard,
                title: 'Pay Securely',
                description: 'All payments are processed through Stripe. Your money is safe and coaches get paid reliably.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="rounded-2xl border bg-card p-8 shadow-premium">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-4xl font-bold text-muted-foreground/20">{item.step}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-muted-foreground">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 sm:block">
                    <ChevronRight className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-t bg-muted/30 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                A Platform Built for{' '}
                <span className="text-gradient">Trust & Safety</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                We verify every coach, secure every payment, and ensure every session meets our quality standards.
              </p>

              <div className="mt-10 space-y-6">
                {[
                  {
                    icon: BadgeCheck,
                    title: 'Verified Profiles',
                    description: 'Every coach goes through identity verification and credential checks.',
                  },
                  {
                    icon: Shield,
                    title: 'Secure Payments',
                    description: 'Payments are processed via Stripe Connect. No direct transactions.',
                  },
                  {
                    icon: Star,
                    title: 'Genuine Reviews',
                    description: 'Only clients who completed sessions can leave reviews.',
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: '500+', label: 'Certified Coaches', icon: Users },
                  { value: '10K+', label: 'Sessions Booked', icon: Calendar },
                  { value: '4.9', label: 'Average Rating', icon: Star },
                  { value: '< 2hr', label: 'Response Time', icon: Clock },
                ].map((stat) => (
                  <Card key={stat.label} className="rounded-2xl p-6 text-center shadow-premium">
                    <stat.icon className="mx-auto h-8 w-8 text-primary" />
                    <p className="mt-4 text-3xl font-bold">{stat.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA for Coaches */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-primary-foreground sm:px-16 sm:py-20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative mx-auto max-w-2xl text-center">
              <Dumbbell className="mx-auto h-12 w-12 mb-6" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Are You a Personal Trainer?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/90">
                Join FitConnect and grow your business. Set your own rates, manage your schedule,
                and get paid reliably through our secure payment system.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="h-14 rounded-2xl px-8 text-base"
                >
                  <Link href="/signup?role=coach">
                    Become a Coach
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-14 rounded-2xl px-8 text-base text-primary-foreground hover:bg-white/10"
                >
                  <Link href="/coaches">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Dumbbell className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">
                Fit<span className="text-primary">Connect</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/coaches" className="hover:text-foreground transition-colors">Browse Coaches</Link>
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 FitConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
