'use client';

import { SessionHistory } from '@/components/app/session-history';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { Loader, Calendar as CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/app/app-header';
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
    'bg-card/30 backdrop-blur-lg border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader activePage="history" />
      <main className="container mx-auto max-w-7xl flex-grow px-4 pt-24 sm:px-6 lg:px-8">
        <div
          className={`mb-8 rounded-lg p-6 ${glassmorphismStyle}`}
        >
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Session History</h2>
              <p className="text-muted-foreground">
                Review your past focus sessions and analyze your productivity trends.
              </p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full sm:w-[280px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Filter by specific date</span>}
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
