'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Loader, Play, Square, Goal as GoalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import FocusRing from '@/components/app/focus-ring';
import StatsDashboard from '@/components/app/stats-dashboard';
import { useFocusSession } from '@/lib/hooks/use-focus-session';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app/app-header';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [goalDescription, setGoalDescription] = useState('');
  const [goalDuration, setGoalDuration] = useState(3600);
  const [useWebcam, setUseWebcam] = useState(true);
  const [useScreen, setUseScreen] = useState(true);

  const { user, isUserLoading } = useFirebase();

  // Defer enabling session until user is loaded
  const isSessionHookEnabled = !isUserLoading && !!user;

  const {
    status,
    time,
    logs,
    startSession,
    endSession,
    focusState,
    sessionSummary,
    goal,
    goalProgress,
    isPrivacyShieldActive
  } = useFocusSession({
    enabled: isSessionHookEnabled,
    webcamVideoRef,
    screenVideoRef,
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const handleStartSession = useCallback(async () => {
    const goalToSet = {
      description: goalDescription || 'Complete a focused study session.',
      targetDuration: goalDuration,
    };
    const permissions = {
      webcam: useWebcam,
      screen: useScreen,
    };
    await startSession({ goalInput: goalToSet, permissions });
    setIsGoalDialogOpen(false);
    setGoalDescription('');
  }, [startSession, goalDescription, goalDuration, useWebcam, useScreen]);

  const handleEndSession = useCallback(async () => {
    const endedSessionId = await endSession();
    if (endedSessionId) {
      router.push(`/history/${endedSessionId}`);
    }
  }, [endSession, router]);

  const glassmorphismStyle =
    'bg-card/30 backdrop-blur-lg border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1';
  
  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const formatSliderLabel = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  return (
    <div className="flex min-h-screen flex-col font-body text-foreground">
      <AppHeader activePage="focus">
        {(status === 'running' || status === 'paused') && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndSession}
            className="hidden sm:inline-flex"
          >
            <Square className="mr-2 h-4 w-4" /> End Session
          </Button>
        )}
      </AppHeader>

      <main className="mx-auto w-full max-w-7xl flex-grow px-4 pt-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div
            className={`flex flex-col items-center justify-center rounded-lg p-4 sm:p-6 md:col-span-2 ${glassmorphismStyle}`}
          >
            <div className="grid w-full grid-cols-1 items-center gap-4 sm:gap-8 lg:grid-cols-2">
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
                <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg">
                      <Play className="mr-2 h-5 w-5" /> Start Focus Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Up Your Focus Session</DialogTitle>
                      <DialogDescription>
                        Configure your goal and monitoring preferences.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="goal-desc">Goal Description (Optional)</Label>
                        <Input 
                          id="goal-desc" 
                          placeholder="e.g., Finish chapter 3 of Math homework"
                          value={goalDescription}
                          onChange={(e) => setGoalDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goal-duration">Target Duration</Label>
                        <Slider
                          id="goal-duration"
                          min={900}
                          max={14400}
                          step={900}
                          value={[goalDuration]}
                          onValueChange={(value) => setGoalDuration(value[0])}
                        />
                        <div className="text-center text-sm text-muted-foreground">
                          {formatSliderLabel(goalDuration)}
                        </div>
                      </div>
                      <Separator />
                       <div className="space-y-3">
                         <Label>Monitoring Options</Label>
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label htmlFor="use-webcam" className="text-sm font-medium">Enable Webcam</Label>
                                <p className="text-xs text-muted-foreground">
                                    Required for away detection.
                                </p>
                            </div>
                            <Switch
                                id="use-webcam"
                                checked={useWebcam}
                                onCheckedChange={setUseWebcam}
                                disabled={isPrivacyShieldActive}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label htmlFor="use-screen" className="text-sm font-medium">Enable Screen Analysis</Label>
                                 <p className="text-xs text-muted-foreground">
                                    Required for activity categorization.
                                </p>
                            </div>
                            <Switch
                                id="use-screen"
                                checked={useScreen}
                                onCheckedChange={setUseScreen}
                                disabled={isPrivacyShieldActive}
                            />
                        </div>
                        {isPrivacyShieldActive && (
                            <p className="text-xs text-center text-amber-600 dark:text-amber-500 pt-1">
                                Disable Privacy Shield in Settings to enable monitoring.
                            </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleStartSession}>
                        Start Session
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : status === 'initializing' ? (
                <div className="mt-8 flex items-center text-lg text-muted-foreground">
                  <Loader className="mr-2 h-5 w-5 animate-spin" />
                  Initializing...
                </div>
              ) : null}
            </div>

            {(status === 'running' || status === 'paused') && goal && (
              <Card className={`mt-8 w-full max-w-lg rounded-lg ${glassmorphismStyle}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <GoalIcon className="h-5 w-5" />
                    Current Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{goal.description}</p>
                  {goal.targetDuration && (
                    <>
                      <Progress value={goalProgress} className="w-full" />
                      <p className="text-xs text-right mt-1 text-muted-foreground">
                        {goalProgress?.toFixed(0)}% complete
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

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

          <div className={`flex flex-col rounded-lg p-4 sm:p-6 ${glassmorphismStyle}`}>
            <StatsDashboard logs={logs} />
          </div>
        </div>
      </main>
    </div>
  );
}
