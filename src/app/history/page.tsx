'use client';

import { SessionHistory } from '@/components/app/session-history';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { Loader, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/app/theme-toggle';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const glassmorphismStyle =
    'bg-card/30 backdrop-blur-lg border border-border/50 shadow-lg';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="fixed top-4 left-4 right-4 z-40 flex h-16 items-center justify-between rounded-lg border border-border/20 bg-background/80 px-6 backdrop-blur-lg">
        <h1 className="text-xl font-bold text-primary font-headline">
          <Link href="/">FocusMentor AI</Link>
        </h1>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href="/">Back to Focus</Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <main className="container mx-auto max-w-4xl flex-grow px-4 pt-24 sm:px-6 lg:px-8">
        <div
          className={`mb-8 rounded-lg p-6 ${glassmorphismStyle}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Session History</h2>
              <p className="text-muted-foreground">
                Review your past focus sessions.
              </p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[280px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date to filter</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <SessionHistory selectedDate={date} />
      </main>
    </div>
  );
}
