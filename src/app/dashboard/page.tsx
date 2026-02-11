'use client';

import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';
import { AppHeader } from '@/components/app/app-header';
import { HistoricalTrendsChart } from '@/components/app/historical-trends-chart';
import { ProductivityByHourChart } from '@/components/app/productivity-by-hour-chart';

export default function DashboardPage() {
  const { user, isUserLoading } = useFirebase();
  const router = useRouter();

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
  
  const glassmorphismStyle = 'bg-card/30 backdrop-blur-lg border border-border/50 shadow-lg';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader activePage="dashboard" />
      
      <main className="container mx-auto max-w-7xl flex-grow px-4 pt-24 sm:px-6 lg:px-8">
        <div className={`mb-8 rounded-lg p-6 ${glassmorphismStyle}`}>
          <h2 className="text-3xl font-bold tracking-tight">AI Dashboard</h2>
          <p className="text-muted-foreground">
            Analyze your productivity trends and get smart scheduling suggestions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <HistoricalTrendsChart />
          <ProductivityByHourChart />
        </div>
      </main>
    </div>
  );
}
