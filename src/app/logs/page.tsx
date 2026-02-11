'use client';

import { useFirebase, useCollection, useMemoFirebase, WithId } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { StudySession, LogEntry } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow, startOfMonth, endOfMonth } from 'date-fns';
import { Loader, Code, Sigma, Library, Coffee, UserMinus, FileQuestion, ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/app/app-header';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo } from 'react';


const categoryIcons: Record<string, React.ReactNode> = {
  'Coding': <Code className="h-4 w-4 text-blue-400" />,
  'Mathematics': <Sigma className="h-4 w-4 text-purple-400" />,
  'Academic Research': <Library className="h-4 w-4 text-green-400" />,
  'Distraction': <Coffee className="h-4 w-4 text-red-400" />,
  'Away': <UserMinus className="h-4 w-4 text-amber-400" />,
};

export default function MonthlyLogsPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const router = useRouter();

  const currentMonthRange = useMemo(() => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }, []);

  const sessionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    
    return query(
      collection(firestore, 'users', user.uid, 'study_sessions'),
      where('startTime', '>=', currentMonthRange.start),
      where('startTime', '<=', currentMonthRange.end),
      orderBy('startTime', 'desc')
    );
  }, [user, firestore, currentMonthRange]);

  const { data: sessions, isLoading } = useCollection<StudySession>(sessionsQuery);

  const allLogs = useMemo(() => {
    if (!sessions) return [];
    return sessions.flatMap(s => s.logs).sort((a, b) => b.timestamp - a.timestamp);
  }, [sessions]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0m';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (isLoading || isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const glassmorphismStyle = 'bg-card/30 backdrop-blur-lg border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1';

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <AppHeader activePage="achievements" />
      <main className="container mx-auto max-w-4xl flex-grow px-4 pt-24 sm:px-6 lg:px-8">
        <Card className={glassmorphismStyle}>
          <CardHeader>
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <CardTitle>Monthly Activity Logs</CardTitle>
                <CardDescription>
                  All your recorded activities for the current month.
                </CardDescription>
              </div>
              <Button asChild variant="outline">
                <Link href="/gamification">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Achievements
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] rounded-md border bg-background/50 p-4">
              {allLogs.length > 0 ? (
                <div className="space-y-4">
                  {allLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <div>{categoryIcons[log.category] || <FileQuestion className="h-4 w-4 text-muted-foreground" />}</div>
                      <div className="flex-grow">
                        <p className="font-medium">{log.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.reasoning}
                        </p>
                      </div>
                      <div className="whitespace-nowrap text-right text-xs text-muted-foreground">
                        <p>{formatDuration(log.duration)}</p>
                        <p>
                          {formatDistanceToNow(new Date(log.timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  <p>No logs recorded this month.</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
