'use client';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/lib/auth-context';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';

const noShellRoutes: string[] = [];
const noNavRoutes: string[] = [];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isWatchPage = pathname.startsWith('/watch');
    const showShell = !noShellRoutes.includes(pathname) && !isWatchPage;
    const showNav = !noNavRoutes.includes(pathname) && !isWatchPage;

    return (
        <AuthProvider>
            <AuthGuard>
                {/* Navbar is fixed, so we just render it. The page content itself handles the padding via .page class */}
                {showShell && showNav && <Navbar />}

                <main className={showShell && !isWatchPage ? 'page' : ''}>
                    {children}
                </main>

                {/* Keep MobileNav for small screens if desired, or relying on Navbar responsiveness? 
                    Disney+ usually just uses the top bar on mobile too, but let's keep it just in case 
                    the user wants it, but hidden on desktop via CSS. 
                    Actually, Disney+ app uses bottom nav. Let's keep it. */}
                {showShell && showNav && <MobileNav />}
            </AuthGuard>
        </AuthProvider>
    );
}
