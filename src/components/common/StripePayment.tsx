'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';

// Initialize Stripe outside of component to avoid recreating on each render
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

interface PaymentFormProps {
    onSuccess: () => void;
    onError: (error: string) => void;
    totalAmount: number;
    isProcessing: boolean;
    setIsProcessing: (val: boolean) => void;
}

function PaymentForm({ onSuccess, onError, totalAmount, isProcessing, setIsProcessing }: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/booking/success`,
            },
        });

        if (error) {
            // This point will only be reached if there's an immediate error when
            // confirming the payment. Otherwise, your customer will be redirected.
            if (error.type === "card_error" || error.type === "validation_error") {
                onError(error.message || 'Payment failed');
            } else {
                onError("An unexpected error occurred.");
            }
            setIsProcessing(false);
        } else {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement
                options={{
                    layout: 'tabs',
                }}
            />
            <Button
                type="submit"
                disabled={!stripe || !elements || isProcessing}
                className="w-full rounded-xl"
                size="lg"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay ${totalAmount.toFixed(2)}
                    </>
                )}
            </Button>
        </form>
    );
}

interface StripePaymentProps {
    clientSecret: string | null;
    totalAmount: number;
    onSuccess: () => void;
    onError: (error: string) => void;
}

export default function StripePayment({ clientSecret, totalAmount, onSuccess, onError }: StripePaymentProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!stripePromise) {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-medium">Stripe not configured</p>
                <p className="mt-1">Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.</p>
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading payment...</span>
            </div>
        );
    }

    const appearance = {
        theme: 'stripe' as const,
        variables: {
            colorPrimary: '#f97316', // Orange primary color matching FitConnect
            borderRadius: '12px',
        },
    };

    return (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
            <PaymentForm
                onSuccess={onSuccess}
                onError={onError}
                totalAmount={totalAmount}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
            />
        </Elements>
    );
}
