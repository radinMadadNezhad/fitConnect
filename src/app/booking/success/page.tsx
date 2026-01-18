'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout';

export default function BookingSuccessPage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card className="rounded-3xl p-8 text-center shadow-premium sm:p-12">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
                        >
                            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </motion.div>

                        <h1 className="mt-6 text-2xl font-bold sm:text-3xl">Booking Confirmed!</h1>
                        <p className="mt-3 text-muted-foreground">
                            Your session has been booked successfully. We've sent a confirmation email with all the details.
                        </p>

                        <div className="mt-8 rounded-2xl bg-muted/50 p-6 text-left">
                            <h2 className="font-semibold">Session Details</h2>
                            <div className="mt-4 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Coach</span>
                                    <span className="font-medium">Sarah Mitchell</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Package</span>
                                    <span className="font-medium">Full Training (60 min)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date & Time</span>
                                    <span className="font-medium">Mon, Jan 20 @ 9:00 AM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Location</span>
                                    <span className="font-medium">In-person</span>
                                </div>
                                <div className="flex justify-between border-t pt-3">
                                    <span className="text-muted-foreground">Total Paid</span>
                                    <span className="font-semibold text-primary">$120.00</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <Button asChild size="lg" className="w-full rounded-xl">
                                <Link href="/messages">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Message Your Coach
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
                                <Link href="/dashboard">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    View My Bookings
                                </Link>
                            </Button>
                        </div>

                        <p className="mt-8 text-sm text-muted-foreground">
                            Need to make changes?{' '}
                            <Link href="/dashboard" className="text-primary hover:underline">
                                Manage your booking
                            </Link>
                        </p>
                    </Card>
                </motion.div>
            </main>
        </div>
    );
}
