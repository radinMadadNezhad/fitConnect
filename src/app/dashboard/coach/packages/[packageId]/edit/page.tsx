'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface EditPackagePageProps {
    params: Promise<{ packageId: string }>;
}

export default function EditPackagePage({ params }: EditPackagePageProps) {
    const { packageId } = use(params);
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
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

    useEffect(() => {
        async function fetchPackage() {
            try {
                const res = await fetch(`/api/coach/packages/${packageId}`);
                if (!res.ok) throw new Error('Failed to load package');
                const data = await res.json();

                setTitle(data.title);
                setDescription(data.description);
                setDurationMins(data.durationMins.toString());
                setPrice((data.priceCents / 100).toFixed(2));
                setType(data.type);
            } catch (error) {
                console.error(error);
                toast.error('Could not load package details');
                router.push('/dashboard/coach');
            } finally {
                setIsLoading(false);
            }
        }
        if (packageId) fetchPackage();
    }, [packageId, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !price || !durationMins) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const priceCents = Math.round(parseFloat(price) * 100);

            const res = await fetch(`/api/coach/packages/${packageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    durationMins: parseInt(durationMins),
                    priceCents,
                    type,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update package');
            }

            toast.success('Package updated successfully!');
            router.push('/dashboard/coach');
            router.refresh();

        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this package? This cannot be undone.')) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/coach/packages/${packageId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete package');

            toast.success('Package deleted');
            router.push('/dashboard/coach');
            router.refresh();
        } catch (error) {
            toast.error('Failed to delete package');
            setIsSubmitting(false);
        }
    };

    if (authLoading || isLoading) {
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
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <Button asChild variant="ghost" className="mb-4 pl-0">
                            <Link href="/dashboard/coach">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold">Edit Package</h1>
                    </div>
                    <Button variant="destructive" size="icon" onClick={handleDelete} type="button">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Package Details</CardTitle>
                        <CardDescription>
                            Update the details for your coaching package.
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

                            <div className="flex gap-4">
                                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => router.push('/dashboard/coach')}>
                                    Cancel
                                </Button>
                            </div>

                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
