'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase, WithId } from '@/firebase';
import { doc } from 'firebase/firestore';
import { StudySession } from '@/types';
import { Loader, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionReport } from '@/components/app/session-report';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';

export default function SessionReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { user, firestore, isUserLoading } = useFirebase();
  const router = useRouter();

  const sessionRef = useMemoFirebase(() => {
    if (!user || !firestore || !sessionId) return null;
    return doc(firestore, 'users', user.uid, 'study_sessions', sessionId);
  }, [user, firestore, sessionId]);

  const { data: session, isLoading } = useDoc<StudySession>(sessionRef);

  if (isLoading || isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold">Session Not Found</h2>
        <p className="max-w-sm text-muted-foreground">
          The session you are looking for does not exist or you may not have
          permission to view it.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/history">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader activePage="history" />
      <main className="container mx-auto max-w-5xl flex-grow px-4 pt-24 sm:px-6 lg:px-8">
        <SessionReport session={session as WithId<StudySession>} />
      </main>
    </div>
  );
}
