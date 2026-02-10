'use client';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { StudySession, LogEntry } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader, Code, Sigma, Library, Coffee, UserMinus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import React from 'react';

const categoryIcons: Record<LogEntry['category'], React.ReactNode> = {
  'Coding': <Code className="h-4 w-4 text-blue-400" />,
  'Mathematics': <Sigma className="h-4 w-4 text-purple-400" />,
  'Academic Research': <Library className="h-4 w-4 text-green-400" />,
  'Distraction': <Coffee className="h-4 w-4 text-red-400" />,
  'Away': <UserMinus className="h-4 w-4 text-amber-400" />,
};

export function SessionHistory() {
  const { user, firestore, isUserLoading } = useFirebase();

  const sessionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'study_sessions'),
      orderBy('startTime', 'desc')
    );
  }, [user, firestore]);

  const { data: sessions, isLoading } = useCollection<StudySession>(sessionsQuery);

  const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0m';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  if (isLoading || isUserLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader className="animate-spin" />
        <p className="ml-2">Loading history...</p>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="py-16 text-center">
        <h3 className="text-lg font-medium">No Sessions Yet</h3>
        <p className="text-sm text-muted-foreground">
          Your past study sessions will appear here once you complete them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sessions?.map((session) => (
        <Card key={session.id} className="overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>
                  {session.startTime
                    ? format(session.startTime.toDate(), 'MMMM d, yyyy - p')
                    : 'Session'}
                </CardTitle>
                <CardDescription>
                  Total Duration: {formatDuration(session.totalFocusTime)}
                </CardDescription>
              </div>
              <Badge
                variant={
                  session.status === 'completed' ? 'secondary' : 'default'
                }
              >
                {session.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h4 className="mb-2 font-semibold">Activity Log</h4>
            {session.logs && session.logs.length > 0 ? (
              <ScrollArea className="h-48 rounded-md border p-4">
                <div className="space-y-4">
                  {session.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <div>{categoryIcons[log.category]}</div>
                      <div className="flex-grow">
                        <p className="font-medium">{log.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.reasoning}
                        </p>
                      </div>
                      <div className="whitespace-nowrap text-right text-xs text-muted-foreground">
                        <p>{formatDuration(log.duration)}</p>
                        <p>
                          {formatDistanceToNow(log.timestamp, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">
                No activity logs for this session.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
