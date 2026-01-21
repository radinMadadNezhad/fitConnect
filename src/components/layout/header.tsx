'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Search,
    Bell,
    Menu,
    X,
    Home,
    Users,
    Calendar,
    MessageSquare,
    LayoutDashboard,
    Settings,
    LogOut,
    ChevronDown,
    Dumbbell
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Browse Coaches', href: '/coaches', icon: Users },
    { name: 'My Bookings', href: '/dashboard/client', icon: Calendar },
    { name: 'Messages', href: '/messages', icon: MessageSquare, badge: 3 },
];

const coachNavigation = [
    { name: 'Dashboard', href: '/dashboard/coach', icon: LayoutDashboard },
    { name: 'My Bookings', href: '/dashboard/coach/bookings', icon: Calendar },
    { name: 'Messages', href: '/messages', icon: MessageSquare, badge: 3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, isLoading } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const isCoach = user?.role === 'coach';

    const navItems = isCoach ? coachNavigation : navigation;

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                        <Dumbbell className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="hidden text-xl font-bold sm:block">
                        Fit<span className="text-primary">Connect</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-1 md:flex">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                                    isActive
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                                {item.badge && (
                                    <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
                                        {item.badge}
                                    </Badge>
                                )}
                                {isActive && (
                                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Search + Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Search */}
                    <div className="hidden w-64 lg:block">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search coaches..."
                                className="h-9 pl-9 bg-muted/50 border-transparent focus:border-border"
                            />
                        </div>
                    </div>

                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative h-9 w-9">
                        <Bell className="h-4 w-4" />
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                    </Button>

                    {/* User Menu / Login */}
                    {!user ? (
                        <Link href="/login">
                            <Button variant="default" size="sm">Sign In</Button>
                        </Link>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 gap-2 px-2">
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="hidden text-sm font-medium sm:block">
                                        {user.name.split(' ')[0]}
                                    </span>
                                    <ChevronDown className="hidden h-4 w-4 opacity-50 sm:block" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard" className="cursor-pointer">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings" className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                    onClick={handleSignOut}
                                    disabled={isLoggingOut}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    {isLoggingOut ? 'Signing out...' : 'Sign out'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Mobile Menu */}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72 p-0">
                            <div className="flex h-full flex-col">
                                <div className="flex items-center justify-between border-b p-4">
                                    <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                                            <Dumbbell className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                        <span className="text-lg font-bold">
                                            Fit<span className="text-primary">Connect</span>
                                        </span>
                                    </Link>
                                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Mobile Search */}
                                <div className="border-b p-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Search coaches..."
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                {/* Mobile Nav */}
                                <nav className="flex-1 space-y-1 p-4">
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                {item.name}
                                                {item.badge && (
                                                    <Badge
                                                        variant={isActive ? 'secondary' : 'default'}
                                                        className="ml-auto h-5 min-w-5 px-1.5 text-xs"
                                                    >
                                                        {item.badge}
                                                    </Badge>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </nav>

                                {/* Mobile User Section */}
                                <div className="border-t p-4">
                                    {user ? (
                                        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                            <Button className="w-full">Sign In</Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
