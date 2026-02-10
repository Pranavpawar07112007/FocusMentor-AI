'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Shield, Loader, Play, Square, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import FocusRing from '@/components/app/focus-ring';
import StatsDashboard from '@/components/app/stats-dashboard';
import { useFocusSession } from '@/lib/hooks/use-focus-session';
import { SessionHistory } from '@/components/app/session-history';
import { useFirebase } from '@/firebase';
import { initiateGoogleSignIn, initiateSignOut } from '@/firebase/non-blocking-login';
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


export default function Home() {
  const [privacyShield, setPrivacyShield] = useState(false);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const {
    status,
    time,
    logs,
    startSession,
    endSession,
    focusState,
    sessionSummary,
  } = useFocusSession({
    enabled: !privacyShield,
    webcamVideoRef,
    screenVideoRef,
  });

  const { user, auth, isUserLoading } = useFirebase();

  const handleStartSession = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with Google to start a session.",
        variant: "destructive",
      });
      return;
    }
    await startSession();
  }, [startSession, user, toast]);

  const handleEndSession = useCallback(() => {
    endSession();
  }, [endSession]);

  const handleGoogleSignIn = () => {
    if (auth) {
      initiateGoogleSignIn(auth);
    }
  };

  const handleSignOut = () => {
    if (auth) {
      initiateSignOut(auth);
    }
  };
  
  const glassmorphismStyle = "bg-card/30 backdrop-blur-lg border border-border/50 shadow-lg";

  return (
    <div className="flex flex-col min-h-screen font-body text-foreground bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/50 backdrop-blur-sm border-b border-border/50">
        <h1 className="text-xl font-bold font-headline text-primary">FocusMentor AI</h1>
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

          {isUserLoading ? (
            <Loader className="animate-spin" />
          ) : user ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'U'} />
                    <AvatarFallback>{user.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <p>Signed in as</p>
                  <p className="font-normal text-sm text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={handleGoogleSignIn}>Sign in with Google</Button>
          )}

          {status !== 'idle' && status !== 'stopped' && (
            <Button variant="destructive" size="sm" onClick={handleEndSession}>
              <Square className="mr-2 h-4 w-4" /> End Session
            </Button>
          )}
        </div>
      </header>

      <main className="flex-grow pt-24 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className={`lg:col-span-2 rounded-xl p-6 flex flex-col items-center justify-center ${glassmorphismStyle}`}>
            <FocusRing
              time={time}
              status={status}
              focusState={focusState}
            />
            {status === 'idle' || status === 'stopped' ? (
              <Button size="lg" onClick={handleStartSession} className="mt-8">
                <Play className="mr-2 h-5 w-5" /> Start Focus Session
              </Button>
            ) : status === 'initializing' ? (
              <div className="flex items-center text-lg mt-8 text-muted-foreground">
                <Loader className="mr-2 h-5 w-5 animate-spin" />
                Initializing...
              </div>
            ) : null}
             {status === 'stopped' && sessionSummary && (
              <Card className={`w-full mt-8 ${glassmorphismStyle}`}>
                <CardHeader>
                  <CardTitle>Session Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{sessionSummary}</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className={`rounded-xl p-6 flex flex-col ${glassmorphismStyle}`}>
            <StatsDashboard logs={logs} />
            <SessionHistory />
          </div>
        </div>
      </main>

      <video ref={webcamVideoRef} autoPlay playsInline className="hidden" />
      <video ref={screenVideoRef} autoPlay playsInline className="hidden" />
    </div>
  );
}
