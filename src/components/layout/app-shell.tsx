import { Header } from './header';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>{children}</main>
        </div>
    );
}
