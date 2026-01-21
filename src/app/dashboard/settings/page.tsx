'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    User,
    Camera,
    Mail,
    MapPin,
    Save,
    Loader2,
    Award,
    Languages,
    Clock,
    DollarSign,
    FileText,
    Tag,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout';
import { useAuth } from '@/contexts/auth-context';

interface CoachProfile {
    id: string;
    displayName: string;
    bio: string | null;
    tagline: string | null;
    location: string | null;
    specialties: string[];
    certifications: string[];
    languages: string[];
    responseTime: string | null;
    startingRate: number;
    isActive: boolean;
}

interface UserProfile {
    id: string;
    email: string;
    displayName: string | null;
    avatar: string | null;
    role: string;
    coachProfile: CoachProfile | null;
}

export default function SettingsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, checkAuth } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // User profile form
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Coach profile form
    const [coachDisplayName, setCoachDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [tagline, setTagline] = useState('');
    const [location, setLocation] = useState('');
    const [specialties, setSpecialties] = useState('');
    const [certifications, setCertifications] = useState('');
    const [languages, setLanguages] = useState('');
    const [responseTime, setResponseTime] = useState('');
    const [startingRate, setStartingRate] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        async function fetchProfile() {
            try {
                const res = await fetch('/api/user/profile');
                if (!res.ok) throw new Error('Failed to fetch profile');
                const data = await res.json();
                setProfile(data);

                // Populate user form
                setDisplayName(data.displayName || '');
                setAvatarUrl(data.avatar || '');

                // Populate coach form if coach
                if (data.coachProfile) {
                    const cp = data.coachProfile;
                    setCoachDisplayName(cp.displayName || '');
                    setBio(cp.bio || '');
                    setTagline(cp.tagline || '');
                    setLocation(cp.location || '');
                    setSpecialties(cp.specialties?.join(', ') || '');
                    setCertifications(cp.certifications?.join(', ') || '');
                    setLanguages(cp.languages?.join(', ') || '');
                    setResponseTime(cp.responseTime || '');
                    setStartingRate(cp.startingRate ? String(cp.startingRate / 100) : '');
                }
            } catch {
                setError('Failed to load profile');
            } finally {
                setIsLoading(false);
            }
        }

        if (user) {
            fetchProfile();
        }
    }, [user, authLoading, router]);

    const handleSaveUserProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName: displayName || null,
                    avatar: avatarUrl || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update profile');
            }

            setSuccess('Profile updated successfully!');
            await checkAuth(); // Refresh auth context
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCoachProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/coach/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName: coachDisplayName || undefined,
                    bio: bio || undefined,
                    tagline: tagline || undefined,
                    location: location || undefined,
                    specialties: specialties ? specialties.split(',').map(s => s.trim()) : undefined,
                    certifications: certifications ? certifications.split(',').map(s => s.trim()) : undefined,
                    languages: languages ? languages.split(',').map(s => s.trim()) : undefined,
                    responseTime: responseTime || undefined,
                    startingRate: startingRate ? Math.round(parseFloat(startingRate) * 100) : undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update coach profile');
            }

            setSuccess('Coach profile updated successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update coach profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!user || !profile) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="mt-2 text-muted-foreground">
                        Manage your profile and account settings
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 rounded-lg bg-green-500/10 p-4 text-green-600 dark:text-green-400">
                        {success}
                    </div>
                )}

                <div className="space-y-8">
                    {/* Profile Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Profile Information
                            </CardTitle>
                            <CardDescription>
                                Update your profile picture and display name
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveUserProfile} className="space-y-6">
                                {/* Avatar Section */}
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="h-24 w-24 overflow-hidden rounded-full bg-muted">
                                            {avatarUrl ? (
                                                <Image
                                                    src={avatarUrl}
                                                    alt="Profile"
                                                    width={96}
                                                    height={96}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <User className="h-12 w-12 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5">
                                            <Camera className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <Label htmlFor="avatarUpload">Profile Picture</Label>
                                        <Input
                                            id="avatarUpload"
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                try {
                                                    setIsSaving(true);
                                                    setSuccess('');
                                                    setError('');

                                                    // Use the supabase client directly if available, or upload via API
                                                    // For now, let's assume we need to add a specialized upload logic
                                                    // But simplified: we will use a FormData upload to a new API endpoint we will create

                                                    const formData = new FormData();
                                                    formData.append('file', file);

                                                    const res = await fetch('/api/user/avatar', {
                                                        method: 'POST',
                                                        body: formData,
                                                    });

                                                    if (!res.ok) throw new Error('Failed to upload image');

                                                    const data = await res.json();
                                                    setAvatarUrl(data.url);
                                                    setSuccess('Image uploaded! Click Save internally to persist if needed, or it auto-saves.');
                                                } catch (err) {
                                                    setError('Failed to upload image');
                                                    console.error(err);
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }}
                                            className="mt-1"
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Upload a PNG or JPG key image. Max 2MB.
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Display Name */}
                                <div>
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input
                                        id="displayName"
                                        placeholder="Your display name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>

                                {/* Email (read-only) */}
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative mt-1">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            value={profile.email}
                                            disabled
                                            className="pl-10 bg-muted"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Email cannot be changed
                                    </p>
                                </div>

                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Coach Profile Section (only for coaches) */}
                    {profile.role === 'COACH' && profile.coachProfile && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5" />
                                    Coach Profile
                                </CardTitle>
                                <CardDescription>
                                    Customize how clients see your coach profile
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveCoachProfile} className="space-y-6">
                                    {/* Coach Display Name */}
                                    <div>
                                        <Label htmlFor="coachDisplayName">
                                            <User className="mr-1 inline h-4 w-4" />
                                            Coach Display Name
                                        </Label>
                                        <Input
                                            id="coachDisplayName"
                                            placeholder="How you want to be known to clients"
                                            value={coachDisplayName}
                                            onChange={(e) => setCoachDisplayName(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Tagline */}
                                    <div>
                                        <Label htmlFor="tagline">
                                            <Tag className="mr-1 inline h-4 w-4" />
                                            Tagline
                                        </Label>
                                        <Input
                                            id="tagline"
                                            placeholder="e.g., Transform Your Body, Transform Your Life"
                                            value={tagline}
                                            onChange={(e) => setTagline(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <Label htmlFor="bio">
                                            <FileText className="mr-1 inline h-4 w-4" />
                                            Bio
                                        </Label>
                                        <Textarea
                                            id="bio"
                                            placeholder="Tell clients about your experience, philosophy, and what makes you unique..."
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            className="mt-1 min-h-[120px]"
                                        />
                                    </div>

                                    <Separator />

                                    {/* Location */}
                                    <div>
                                        <Label htmlFor="location">
                                            <MapPin className="mr-1 inline h-4 w-4" />
                                            Location
                                        </Label>
                                        <Input
                                            id="location"
                                            placeholder="e.g., New York, NY"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Specialties */}
                                    <div>
                                        <Label htmlFor="specialties">
                                            <Award className="mr-1 inline h-4 w-4" />
                                            Specialties (comma-separated)
                                        </Label>
                                        <Input
                                            id="specialties"
                                            placeholder="e.g., Weight Loss, Strength Training, HIIT"
                                            value={specialties}
                                            onChange={(e) => setSpecialties(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Certifications */}
                                    <div>
                                        <Label htmlFor="certifications">
                                            <Award className="mr-1 inline h-4 w-4" />
                                            Certifications (comma-separated)
                                        </Label>
                                        <Input
                                            id="certifications"
                                            placeholder="e.g., NASM CPT, ACE, CrossFit Level 2"
                                            value={certifications}
                                            onChange={(e) => setCertifications(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Languages */}
                                    <div>
                                        <Label htmlFor="languages">
                                            <Languages className="mr-1 inline h-4 w-4" />
                                            Languages (comma-separated)
                                        </Label>
                                        <Input
                                            id="languages"
                                            placeholder="e.g., English, Spanish"
                                            value={languages}
                                            onChange={(e) => setLanguages(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    <Separator />

                                    {/* Response Time */}
                                    <div>
                                        <Label htmlFor="responseTime">
                                            <Clock className="mr-1 inline h-4 w-4" />
                                            Response Time
                                        </Label>
                                        <Input
                                            id="responseTime"
                                            placeholder="e.g., Usually within 1 hour"
                                            value={responseTime}
                                            onChange={(e) => setResponseTime(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Starting Rate */}
                                    <div>
                                        <Label htmlFor="startingRate">
                                            <DollarSign className="mr-1 inline h-4 w-4" />
                                            Starting Rate ($ per session)
                                        </Label>
                                        <Input
                                            id="startingRate"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="e.g., 75"
                                            value={startingRate}
                                            onChange={(e) => setStartingRate(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Coach Profile
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Account Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                            <CardDescription>
                                Manage your account settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <button className="flex w-full items-center justify-between rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors">
                                <div>
                                    <p className="font-medium">Change Password</p>
                                    <p className="text-sm text-muted-foreground">
                                        Update your password regularly to keep your account secure
                                    </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </button>
                            <button className="flex w-full items-center justify-between rounded-lg border border-destructive/20 p-4 text-left hover:bg-destructive/5 transition-colors">
                                <div>
                                    <p className="font-medium text-destructive">Delete Account</p>
                                    <p className="text-sm text-muted-foreground">
                                        Permanently delete your account and all data
                                    </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-destructive" />
                            </button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
