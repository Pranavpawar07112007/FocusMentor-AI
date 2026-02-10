'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { HistoricalTrendsChart } from '@/components/app/historical-trends-chart';
import { ProductivityByHourChart } from '@/components/app/productivity-by-hour-chart';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader, Settings, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initiateSignOut } from '@/firebase/non-blocking-login';

export default function DashboardPage() {
  const { user, auth, isUserLoading } = useFirebase();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);
  
  const handleSignOut = () => {
    if (auth) {
      initiateSignOut(auth);
      router.push('/login');
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const glassmorphismStyle = 'bg-card/30 backdrop-blur-lg border border-border/50 shadow-lg';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="fixed top-4 left-4 right-4 z-40 flex h-16 items-center justify-between rounded-lg border border-border/20 bg-background/80 px-6 backdrop-blur-lg">
        <h1 className="text-xl font-bold text-primary font-headline">
          <Link href="/">FocusMentor AI</Link>
        </h1>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost">
            <Link href="/">Focus</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/history">History</Link>
          </Button>
          <Button asChild variant="ghost" className="bg-accent">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/gamification">Achievements</Link>
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.photoURL ?? ''}
                    alt={user.displayName ?? 'U'}
                  />
                  <AvatarFallback>
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <p>Signed in as</p>
                <p className="text-sm font-normal text-muted-foreground">
                  {user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="container mx-auto max-w-7xl flex-grow px-4 pt-24 sm:px-6 lg:px-8">
        <div className={`mb-8 rounded-lg p-6 ${glassmorphismStyle}`}>
          <h2 className="text-3xl font-bold tracking-tight">AI Dashboard</h2>
          <p className="text-muted-foreground">
            Analyze your productivity trends and get smart scheduling suggestions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <HistoricalTrendsChart />
          <ProductivityByHourChart />
        </div>
      </main>
    </div>
  );
}
