'use client';

import { SessionHistory } from '@/components/app/session-history';
import { useFirebase } from '@/firebase';
import { Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/app/app-header';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


export default function HistoryPage() {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);
  
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = event.target.value;
    if (dateString) {
      // The input value is in 'YYYY-MM-DD' format.
      // This parsing avoids timezone issues by setting the date in the local timezone.
      const [year, month, day] = dateString.split('-').map(Number);
      setDate(new Date(year, month - 1, day));
    } else {
      setDate(undefined);
    }
  };
  
  const dateValue = date ? format(date, 'yyyy-MM-dd') : '';

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
    <div className="flex min-h-screen flex-col text-foreground">
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
            <div className="flex items-center gap-2">
              <Label htmlFor="date-filter">Filter by date</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateValue}
                onChange={handleDateChange}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </div>

        <SessionHistory selectedDate={date} />
      </main>
    </div>
  );
}
