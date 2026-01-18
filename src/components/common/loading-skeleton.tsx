import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function CoachCardSkeleton() {
    return (
        <div className="rounded-2xl border bg-card p-6">
            <div className="flex gap-4">
                <Skeleton className="h-16 w-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="mt-4 flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="space-y-8">
            {/* Hero */}
            <Skeleton className="h-64 w-full rounded-2xl" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
            </div>

            {/* Content */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Skeleton className="h-48 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-40 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <div className="flex items-center gap-4 border-b p-4">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        'h-4',
                        i === 0 ? 'w-32' : i === columns - 1 ? 'w-20' : 'w-24'
                    )}
                />
            ))}
        </div>
    );
}

export function KPICardSkeleton() {
    return (
        <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="mt-4 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-32" />
        </div>
    );
}

export function MessageSkeleton() {
    return (
        <div className="flex gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    );
}
