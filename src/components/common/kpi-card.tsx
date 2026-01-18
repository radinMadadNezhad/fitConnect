import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: LucideIcon;
    iconColor?: string;
}

export function KPICard({
    title,
    value,
    change,
    changeType = 'neutral',
    icon: Icon,
    iconColor = 'bg-primary/10 text-primary'
}: KPICardProps) {
    return (
        <div className="rounded-2xl border bg-card p-6 shadow-premium transition-shadow hover:shadow-lg">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconColor)}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
            {change && (
                <p className={cn(
                    'mt-2 text-sm',
                    changeType === 'positive' && 'text-green-600 dark:text-green-400',
                    changeType === 'negative' && 'text-red-600 dark:text-red-400',
                    changeType === 'neutral' && 'text-muted-foreground'
                )}>
                    {change}
                </p>
            )}
        </div>
    );
}
