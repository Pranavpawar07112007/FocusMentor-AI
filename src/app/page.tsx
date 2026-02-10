'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Shield, Loader, Play, Square, LogOut, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import FocusRing from '@/components/app/focus-ring';
import StatsDashboard from '@/components/app/stats-dashboard';
import { useFocusSession } from '@/lib/hooks/use-focus-session';
import { useFirebase } from '@/firebase';
import { initiateSignOut } from '@/firebase/non-blocking-login';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/app/theme-toggle';

export default function Home() {
  const [privacyShield, setPrivacyShield] = useState(false);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const { user, auth, isUserLoading } = useFirebase();

  const {
    status,
    time,
    logs,
    startSession,
    endSession,
    focusState,
    sessionSummary,
  } = useFocusSession({
    enabled: !privacyShield && !!user,
    webcamVideoRef,
    screenVideoRef,
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const handleStartSession = useCallback(async () => {
    await startSession();
  }, [startSession]);

  const handleEndSession = useCallback(() => {
    endSession();
  }, [endSession]);

  const handleSignOut = () => {
    if (auth) {
      initiateSignOut(auth);
      router.push('/login');
    }
  };

  const glassmorphismStyle =
    'bg-card/30 backdrop-blur-lg border border-border/50 shadow-lg';
  
  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <header className="fixed top-4 left-4 right-4 z-50 flex h-16 items-center justify-between rounded-lg border border-border/20 bg-background/80 px-6 backdrop-blur-lg">
        <h1 className="text-xl font-bold text-primary font-headline">
          FocusMentor AI
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="text-accent" />
            <Label htmlFor="privacy-shield">Privacy Shield</Label>
            <Switch
              id="privacy-shield"
              checked={privacyShield}
              onCheckedChange={setPrivacyShield}
              aria-label="Privacy Shield"
            />
          </div>
          
          <Button variant="ghost" asChild>
            <Link href="/history">
              <History className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">History</span>
            </Link>
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.photoURL ?? ''}
                    alt={user.displayName ?? 'U'}
                  />
                  <AvatarFallback>
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <p>Signed in as</p>
                <p className="text-sm font-normal text-muted-foreground">
                  {user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(status === 'running' || status === 'paused') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndSession}
            >
              <Square className="mr-2 h-4 w-4" /> End Session
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-grow px-4 pt-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div
            className={`flex flex-col items-center justify-center rounded-lg p-6 lg:col-span-2 ${glassmorphismStyle}`}
          >
            <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div className="relative flex flex-col items-center justify-center">
                <FocusRing
                  time={time}
                  status={status}
                  focusState={focusState}
                />
              </div>
              <div className="flex flex-col gap-4 self-start">
                <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg bg-black">
                  <video
                    ref={webcamVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  {(status === 'idle' || status === 'stopped' || status === 'initializing') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center">
                      <p className="text-sm text-white">
                        Your camera preview will appear here during a session.
                      </p>
                    </div>
                  )}
                </div>
                <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg bg-black">
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                  {(status === 'idle' || status === 'stopped' || status === 'initializing') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center">
                      <p className="text-sm text-white">
                        Your screen share will be shown here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8">
              {status === 'idle' || status === 'stopped' ? (
                <Button size="lg" onClick={handleStartSession}>
                  <Play className="mr-2 h-5 w-5" /> Start Focus Session
                </Button>
              ) : status === 'initializing' ? (
                <div className="mt-8 flex items-center text-lg text-muted-foreground">
                  <Loader className="mr-2 h-5 w-5 animate-spin" />
                  Initializing...
                </div>
              ) : null}
            </div>

            {status === 'stopped' && sessionSummary && (
              <Card className={`mt-8 w-full rounded-lg ${glassmorphismStyle}`}>
                <CardHeader>
                  <CardTitle>Session Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {sessionSummary}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className={`flex flex-col rounded-lg p-6 ${glassmorphismStyle}`}>
            <StatsDashboard logs={logs} />
          </div>
        </div>
      </main>
    </div>
  );
}
