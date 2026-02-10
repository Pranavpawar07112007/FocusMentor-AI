'use client';

import { SessionHistory } from '@/components/app/session-history';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HistoryPage() {
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

  return (
    <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Session History</h1>
        <Button asChild variant="outline">
          <Link href="/">Back to Focus</Link>
        </Button>
      </div>
      <SessionHistory />
    </div>
  );
}
