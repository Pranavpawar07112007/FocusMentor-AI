'use client';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { StudySession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export function SessionHistory() {
  const { user, firestore, isUserLoading } = useFirebase();

  const sessionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'study_sessions'),
      orderBy('startTime', 'desc'),
      limit(10)
    );
  }, [user, firestore]);

  const { data: sessions, isLoading } = useCollection<StudySession>(sessionsQuery);

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds)) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <Card className="mt-8 bg-transparent border-none shadow-none">
      <CardHeader className="p-0 mb-4">
        <CardTitle>Session History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          {(isLoading || isUserLoading) && <p className="text-sm text-muted-foreground">Loading history...</p>}
          {!isLoading && !isUserLoading && (!sessions || sessions.length === 0) && (
            <p className="text-sm text-muted-foreground text-center pt-8">Your past sessions will appear here.</p>
          )}
          <div className="space-y-4">
            {sessions?.map((session) => (
              <div key={session.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">
                    {session.startTime ? format(session.startTime.toDate(), 'MMM d, yyyy') : 'Session'}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{session.status}</p>
                </div>
                <p className="font-mono text-sm">{formatDuration(session.totalFocusTime)}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
