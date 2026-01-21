'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewPackagePage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [durationMins, setDurationMins] = useState('60');
    const [price, setPrice] = useState('');
    const [type, setType] = useState('ONLINE');

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'coach') {
                router.push('/dashboard/client');
            }
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !price || !durationMins) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const priceCents = Math.round(parseFloat(price) * 100);

            const res = await fetch('/api/coach/packages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    durationMins: parseInt(durationMins),
                    priceCents,
                    type,
                    currency: 'usd' // default
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create package');
            }

            toast.success('Package created successfully!');
            router.push('/dashboard/coach');
            router.refresh();

        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="mx-auto max-w-2xl px-4 py-8">
                <div className="mb-6">
                    <Button asChild variant="ghost" className="mb-4 pl-0">
                        <Link href="/dashboard/coach">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">Create New Package</h1>
                    <p className="text-muted-foreground mt-2">
                        Define a coaching service that clients can book.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Package Details</CardTitle>
                        <CardDescription>
                            Enter the details for your new coaching package.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Package Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. 1-on-1 Strategy Session"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="What will you cover in this session?"
                                    className="min-h-[100px]"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price ($)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Duration */}
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration (minutes)</Label>
                                    <Select
                                        value={durationMins}
                                        onValueChange={setDurationMins}
                                    >
                                        <SelectTrigger id="duration">
                                            <SelectValue placeholder="Select duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15">15 mins</SelectItem>
                                            <SelectItem value="30">30 mins</SelectItem>
                                            <SelectItem value="45">45 mins</SelectItem>
                                            <SelectItem value="60">60 mins</SelectItem>
                                            <SelectItem value="90">90 mins</SelectItem>
                                            <SelectItem value="120">2 hours</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Type */}
                            <div className="space-y-2">
                                <Label htmlFor="type">Session Type</Label>
                                <Select
                                    value={type}
                                    onValueChange={setType}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ONLINE">Online (Video Call)</SelectItem>
                                        <SelectItem value="IN_PERSON">In Person</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Package'
                                )}
                            </Button>

                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
