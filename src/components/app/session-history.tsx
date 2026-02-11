'use client';

import { useFirebase, useCollection, useMemoFirebase, WithId } from '@/firebase';
import { collection, query, orderBy, where, doc } from 'firebase/firestore';
import { StudySession, LogEntry } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow, startOfDay, endOfDay } from 'date-fns';
import { Loader, Code, Sigma, Library, Coffee, UserMinus, Trash2, FileQuestion, Camera, ScreenShare, CameraOff, ScreenShareOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase';
import Link from 'next/link';

const categoryIcons: Record<string, React.ReactNode> = {
  'Coding': <Code className="h-4 w-4 text-blue-400" />,
  'Mathematics': <Sigma className="h-4 w-4 text-purple-400" />,
  'Academic Research': <Library className="h-4 w-4 text-green-400" />,
  'Distraction': <Coffee className="h-4 w-4 text-red-400" />,
  'Away': <UserMinus className="h-4 w-4 text-amber-400" />,
};

interface SessionHistoryProps {
  selectedDate?: Date;
}

export function SessionHistory({ selectedDate }: SessionHistoryProps) {
  const { user, firestore, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [sessionToDelete, setSessionToDelete] = useState<WithId<StudySession> | null>(null);

  const sessionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    
    const baseQuery = collection(firestore, 'users', user.uid, 'study_sessions');

    if (selectedDate) {
      const start = startOfDay(selectedDate);
      const end = endOfDay(selectedDate);
      return query(
        baseQuery,
        where('startTime', '>=', start),
        where('startTime', '<=', end),
        orderBy('startTime', 'desc')
      );
    }
    
    return query(baseQuery, orderBy('startTime', 'desc'));

  }, [user, firestore, selectedDate]);

  const { data: sessions, isLoading } = useCollection<StudySession>(sessionsQuery);

  const handleDeleteSession = () => {
    if (!sessionToDelete || !user || !firestore) return;

    const sessionRef = doc(firestore, 'users', user.uid, 'study_sessions', sessionToDelete.id);
    deleteDocumentNonBlocking(sessionRef);
    
    toast({
      title: 'Session Deleted',
      description: 'The study session has been successfully deleted.',
    });
    setSessionToDelete(null);
  };

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
      <Card className="bg-card/30 backdrop-blur-lg border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
        <CardHeader>
          <CardTitle>No Sessions Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {selectedDate
              ? 'No sessions found for the selected date.'
              : 'Your past study sessions will appear here once you complete them.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {sessions?.map((session) => (
          <Card key={session.id} className="overflow-hidden bg-card/30 backdrop-blur-lg border border-border/50 shadow-xl relative group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
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
                <div className="flex items-center gap-2">
                   {session.permissions && (
                    <div className="flex items-center gap-1.5 opacity-60">
                        {session.permissions.webcam ? (
                            <Camera className="h-4 w-4" />
                        ) : (
                            <CameraOff className="h-4 w-4" />
                        )}
                        {session.permissions.screen ? (
                            <ScreenShare className="h-4 w-4" />
                        ) : (
                            <ScreenShareOff className="h-4 w-4" />
                        )}
                    </div>
                  )}
                  <Badge
                    variant={
                      session.status === 'completed' ? 'secondary' : 'default'
                    }
                  >
                    {session.status}
                  </Badge>
                  <Button asChild variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/history/${session.id}`}>View Report</Link>
                  </Button>
                   <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSessionToDelete(session)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete session</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="mb-2 font-semibold">Activity Log</h4>
              {session.logs && session.logs.length > 0 ? (
                <ScrollArea className="h-48 rounded-md border bg-background/50 p-4">
                  <div className="space-y-4">
                    {session.logs.map((log) => (
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

      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              study session and all of its associated logs from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
