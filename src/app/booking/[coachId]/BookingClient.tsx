'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronLeft,
    Check,
    Calendar,
    Clock,
    CreditCard,
    Video,
    User as UserIcon,
    MapPin,
    Star,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout';
import { cn, isDemoMode } from '@/lib/utils';
import { toast } from 'sonner';
import StripePayment from '@/components/common/StripePayment';

// Define types locally since we are detaching from mock-data
type Package = {
    id: string;
    title: string;
    description: string | null;
    durationMins: number;
    priceCents: number;
    type: 'ONLINE' | 'IN_PERSON';
};

type Coach = {
    id: string;
    displayName: string;
    avatar: string | null;
    ratingAvg: number;
    ratingCount: number;
    packages: Package[];
};

type AuthUser = {
    userId: string;
    email: string;
    displayName?: string | null;
};

interface BookingClientProps {
    coach: Coach;
    currentUser: AuthUser | null;
}

const steps = [
    { id: 1, name: 'Select Package' },
    { id: 2, name: 'Choose Time' },
    { id: 3, name: 'Your Details' },
    { id: 4, name: 'Payment' },
];

export default function BookingClient({ coach, currentUser }: BookingClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedPackage = searchParams.get('package');

    const [currentStep, setCurrentStep] = useState(1);
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(
        coach.packages.find((p) => p.id === preselectedPackage) || null
    );
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');

    // Form states
    const [guestName, setGuestName] = useState(currentUser?.displayName || '');
    const [guestEmail, setGuestEmail] = useState(currentUser?.email || '');
    const [guestPhone, setGuestPhone] = useState('');

    const sessionPrice = selectedPackage ? selectedPackage.priceCents / 100 : 0;
    const platformFee = sessionPrice * 0.1;
    // Fix Issue 3: Total should include fee (or be clearly separated). 
    // The requirement is "total = sessionPrice + platformFee"
    const totalAmount = sessionPrice + platformFee;

    const [isProcessing, setIsProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [paymentLoading, setPaymentLoading] = useState(false);

    const handleBooking = async () => {
        if (!selectedPackage || !selectedDate || !selectedTime) return;
        // Step 2 logic handles auth check for UI flow, but we check again here
        if (!currentUser) {
            toast.error('Please login to continue');
            return router.push('/login');
        }

        setIsProcessing(true);
        try {
            // Mock Date Construction
            // In real app, parse selectedDate + selectedTime to ISO
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const startTimeIso = futureDate.toISOString();

            const res = await fetch('/api/bookings/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coachId: coach.id,
                    packageId: selectedPackage.id,
                    startTime: startTimeIso
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create booking');
            }

            const data = await res.json();

            toast.success('Booking created!');
            // Redirect to success
            router.push('/booking/success?bookingId=' + data.bookingId);

        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        } finally {
            setIsProcessing(false);
        }
    };

    // Create payment intent when reaching step 4
    useEffect(() => {
        if (currentStep === 4 && selectedPackage && !clientSecret && !isDemoMode()) {
            createPaymentIntent();
        }
    }, [currentStep, selectedPackage]);

    const createPaymentIntent = async () => {
        if (!selectedPackage || !selectedDate || !selectedTime || !currentUser) return;

        setPaymentLoading(true);
        try {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 1);
            const startTimeIso = futureDate.toISOString();

            const res = await fetch('/api/bookings/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coachId: coach.id,
                    packageId: selectedPackage.id,
                    startTime: startTimeIso
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create payment');
            }

            const data = await res.json();
            setClientSecret(data.clientSecret);
            setBookingId(data.bookingId);
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Payment setup failed');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        toast.success('Payment successful!');
        router.push(`/booking/success${bookingId ? `?bookingId=${bookingId}` : ''}`);
    };

    const handlePaymentError = (error: string) => {
        toast.error(error);
        setIsProcessing(false);
    };

    const nextStep = () => {
        if (currentStep === 2) {
            // Require login before Step 3
            if (!currentUser) {
                toast.error('Please login to continue booking');
                router.push(`/login?next=/booking/${coach.id}`);
                return;
            }
        }
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    // HARDCODED DATES for MVP/Demo purposes (replace with real availability later)
    const availableDates = [
        'Mon, Jan 20',
        'Tue, Jan 21',
        'Wed, Jan 22',
        'Thu, Jan 23',
        'Fri, Jan 24',
    ];
    const availableTimes = ['9:00 AM', '10:00 AM', '2:00 PM', '4:00 PM', '5:00 PM'];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Button asChild variant="ghost" className="mb-6 -ml-2">
                    <Link href={`/coaches/${coach.id}`}>
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to Profile
                    </Link>
                </Button>

                {/* Stepper */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-colors',
                                            currentStep > step.id
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : currentStep === step.id
                                                    ? 'border-primary text-primary'
                                                    : 'border-muted text-muted-foreground'
                                        )}
                                    >
                                        {currentStep > step.id ? (
                                            <Check className="h-5 w-5" />
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <span
                                        className={cn(
                                            'mt-2 hidden text-sm font-medium sm:block',
                                            currentStep >= step.id
                                                ? 'text-foreground'
                                                : 'text-muted-foreground'
                                        )}
                                    >
                                        {step.name}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            'mx-2 h-0.5 w-full min-w-[40px] flex-1 sm:min-w-[80px]',
                                            currentStep > step.id ? 'bg-primary' : 'bg-muted'
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Step 1: Select Package */}
                        {currentStep === 1 && (
                            <Card className="rounded-2xl shadow-premium">
                                <div className="border-b p-6">
                                    <h2 className="text-xl font-semibold">Select a Package</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Choose the session type that fits your needs
                                    </p>
                                </div>
                                <div className="divide-y relative">
                                    {coach.packages.length === 0 && (
                                        <div className="p-6 text-center text-muted-foreground">
                                            No packages available.
                                        </div>
                                    )}
                                    {coach.packages.map((pkg) => (
                                        <button
                                            key={pkg.id}
                                            onClick={() => setSelectedPackage(pkg)}
                                            className={cn(
                                                'w-full p-6 text-left transition-colors hover:bg-muted/50',
                                                selectedPackage?.id === pkg.id && 'bg-primary/5 ring-2 ring-primary ring-inset'
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{pkg.title}</h3>
                                                        <Badge variant={pkg.type === 'ONLINE' ? 'secondary' : 'outline'}>
                                                            {pkg.type === 'ONLINE' ? (
                                                                <Video className="mr-1 h-3 w-3" />
                                                            ) : (
                                                                <UserIcon className="mr-1 h-3 w-3" />
                                                            )}
                                                            {pkg.type}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {pkg.description}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        {pkg.durationMins} minutes
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-primary">
                                                        ${(pkg.priceCents / 100).toFixed(2)}
                                                    </p>
                                                    {selectedPackage?.id === pkg.id && (
                                                        <Check className="ml-auto mt-2 h-5 w-5 text-primary" />
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Step 2: Choose Time */}
                        {currentStep === 2 && (
                            <Card className="rounded-2xl shadow-premium">
                                <div className="border-b p-6">
                                    <h2 className="text-xl font-semibold">Choose Date & Time</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Select your preferred session time
                                    </p>
                                </div>
                                <div className="p-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        {/* Date Selection */}
                                        <div>
                                            <Label className="text-sm font-medium">Select Date</Label>
                                            <div className="mt-3 space-y-2">
                                                {availableDates.map((date) => (
                                                    <button
                                                        key={date}
                                                        onClick={() => setSelectedDate(date)}
                                                        className={cn(
                                                            'flex w-full items-center gap-3 rounded-xl border p-3 transition-colors',
                                                            selectedDate === date
                                                                ? 'border-primary bg-primary/5'
                                                                : 'hover:bg-muted/50'
                                                        )}
                                                    >
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{date}</span>
                                                        {selectedDate === date && (
                                                            <Check className="ml-auto h-4 w-4 text-primary" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Time Selection */}
                                        <div>
                                            <Label className="text-sm font-medium">Select Time</Label>
                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                {availableTimes.map((time) => (
                                                    <button
                                                        key={time}
                                                        onClick={() => setSelectedTime(time)}
                                                        disabled={!selectedDate}
                                                        className={cn(
                                                            'flex items-center justify-center gap-2 rounded-xl border p-3 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                                                            selectedTime === time
                                                                ? 'border-primary bg-primary/5'
                                                                : 'hover:bg-muted/50'
                                                        )}
                                                    >
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{time}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Step 3: Your Details */}
                        {currentStep === 3 && (
                            <Card className="rounded-2xl shadow-premium">
                                <div className="border-b p-6">
                                    <h2 className="text-xl font-semibold">Your Details</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Confirm your contact information
                                    </p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="displayName">Name</Label>
                                            <Input
                                                id="displayName"
                                                value={guestName}
                                                onChange={(e) => setGuestName(e.target.value)}
                                                className="mt-2"
                                                readOnly={!!currentUser} // Lock if logged in
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={guestEmail}
                                            onChange={(e) => setGuestEmail(e.target.value)}
                                            className="mt-2"
                                            readOnly={!!currentUser} // Lock if logged in
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="(555) 000-0000"
                                            value={guestPhone}
                                            onChange={(e) => setGuestPhone(e.target.value)}
                                            className="mt-2"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="notes">Notes for Coach (optional)</Label>
                                        <Input id="notes" placeholder="Any goals or concerns you'd like to share..." className="mt-2" />
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Step 4: Payment */}
                        {currentStep === 4 && (
                            <Card className="rounded-2xl shadow-premium">
                                <div className="border-b p-6">
                                    <h2 className="text-xl font-semibold">Payment Details</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Complete your booking with secure payment
                                    </p>
                                </div>
                                <div className="p-6 space-y-4">
                                    {isDemoMode() ? (
                                        /* Demo Mode: Show fake card inputs */
                                        <>
                                            <div>
                                                <Label htmlFor="cardNumber">Card Number</Label>
                                                <Input id="cardNumber" placeholder="4242 4242 4242 4242" className="mt-2" />
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <Label htmlFor="expiry">Expiry Date</Label>
                                                    <Input id="expiry" placeholder="MM/YY" className="mt-2" />
                                                </div>
                                                <div>
                                                    <Label htmlFor="cvc">CVC</Label>
                                                    <Input id="cvc" placeholder="123" className="mt-2" />
                                                </div>
                                            </div>
                                        </>
                                    ) : paymentLoading ? (
                                        /* Loading State */
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            <span className="ml-2 text-muted-foreground">Setting up payment...</span>
                                        </div>
                                    ) : (
                                        /* Production Mode: Real Stripe Elements */
                                        <StripePayment
                                            clientSecret={clientSecret}
                                            totalAmount={totalAmount}
                                            onSuccess={handlePaymentSuccess}
                                            onError={handlePaymentError}
                                        />
                                    )}
                                    <div className="mt-6 flex items-center gap-2 rounded-xl bg-muted/50 p-4 text-sm">
                                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                            Payments are securely processed via Stripe
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Navigation Buttons */}
                        <div className="mt-6 flex justify-between">
                            <Button
                                variant="outline"
                                onClick={prevStep}
                                className="rounded-xl"
                                disabled={currentStep === 1 || isProcessing}
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Back
                            </Button>
                            {currentStep < 4 ? (
                                <Button
                                    onClick={nextStep}
                                    className="rounded-xl"
                                    disabled={
                                        (currentStep === 1 && !selectedPackage) ||
                                        (currentStep === 2 && (!selectedDate || !selectedTime))
                                    }
                                >
                                    {currentStep === 2 && !currentUser ? 'Login to Continue' : 'Continue'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleBooking}
                                    className="rounded-xl"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Processing...' : `Pay & Book $${totalAmount.toFixed(2)}`}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <Card className="sticky top-24 rounded-2xl shadow-premium">
                            <div className="border-b p-6">
                                <h3 className="font-semibold">Booking Summary</h3>
                            </div>
                            <div className="p-6">
                                {/* Coach Info */}
                                <div className="flex gap-4">
                                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                                        {coach.avatar && (
                                            <Image
                                                src={coach.avatar}
                                                alt={coach.displayName}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                        {!coach.avatar && <div className="h-full w-full flex items-center justify-center text-lg">{coach.displayName.charAt(0)}</div>}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{coach.displayName}</h4>
                                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                            {coach.ratingAvg.toFixed(1)} ({coach.ratingCount})
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                {/* Selected Package */}
                                {selectedPackage && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Package</span>
                                            <span className="font-medium">{selectedPackage.title}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Duration</span>
                                            <span>{selectedPackage.durationMins} min</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Type</span>
                                            <Badge variant="outline" className="capitalize">
                                                {selectedPackage.type.toLowerCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                {selectedDate && selectedTime && (
                                    <>
                                        <Separator className="my-6" />
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Date</span>
                                                <span className="font-medium">{selectedDate}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Time</span>
                                                <span className="font-medium">{selectedTime}</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Separator className="my-6" />

                                {/* Pricing Breakdown */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Session Price</span>
                                        <span>${sessionPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Platform Fee (10%)</span>
                                        <span>${platformFee.toFixed(2)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-semibold">
                                        <span>Total</span>
                                        <span className="text-primary">${totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mt-6 rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
                                    <p className="font-medium text-foreground">Commission Breakdown:</p>
                                    <p className="mt-1">Coach receives: ${sessionPrice.toFixed(2)}</p>
                                    <p>Platform fee: ${platformFee.toFixed(2)}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
