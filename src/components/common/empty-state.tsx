import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">{title}</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
            {action && (
                <Button onClick={action.onClick} className="mt-6">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
