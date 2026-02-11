'use client';

import React, { useEffect, useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { StudySession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, Lightbulb } from 'lucide-react';
import { generateInsights, GenerateInsightsOutput } from '@/ai/flows/generate-insights-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const glassmorphismStyle = 'bg-card/30 backdrop-blur-lg border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1';

// Helper to convert Firestore Timestamps to a plain object for the AI flow
const sanitizeSessionsForAI = (sessions: StudySession[]) => {
  return sessions.map(session => {
    const plainSession: any = { ...session };
    if (session.startTime instanceof Timestamp) {
      plainSession.startTime = { seconds: session.startTime.seconds, nanoseconds: session.startTime.nanoseconds };
    }
    if (session.endTime instanceof Timestamp) {
      plainSession.endTime = { seconds: session.endTime.seconds, nanoseconds: session.endTime.nanoseconds };
    }
    // The rest of the properties should be fine if they are primitive types
    return plainSession;
  });
};

export function AiInsights() {
  const { user, firestore } = useFirebase();
  const [insights, setInsights] = useState<GenerateInsightsOutput['insights'] | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);

  const sessionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'study_sessions'),
      orderBy('startTime', 'desc')
    );
  }, [user, firestore]);

  const { data: sessions, isLoading: isLoadingSessions } = useCollection<StudySession>(sessionsQuery);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!sessions || sessions.length < 3) {
        setIsLoadingInsights(false);
        setInsights([]); // Not enough data
        return;
      }

      try {
        const sanitized = sanitizeSessionsForAI(sessions);
        const result = await generateInsights({ sessions: sanitized });
        setInsights(result.insights);
      } catch (error) {
        console.error("Failed to generate AI insights:", error);
        setInsights(null); // Indicate an error occurred
      } finally {
        setIsLoadingInsights(false);
      }
    };

    if (!isLoadingSessions) {
      fetchInsights();
    }
  }, [sessions, isLoadingSessions]);

  return (
    <Card className={`col-span-1 md:col-span-2 ${glassmorphismStyle}`}>
      <CardHeader>
        <CardTitle>Deeper Insights</CardTitle>
        <CardDescription>Your personal AI productivity coach.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingSessions || isLoadingInsights ? (
          <div className="flex h-40 items-center justify-center">
            <Loader className="animate-spin" />
            <p className="ml-4 text-muted-foreground">Analyzing your patterns...</p>
          </div>
        ) : !insights || insights.length === 0 ? (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Not Enough Data</AlertTitle>
            <AlertDescription>
              Complete a few more study sessions, and your AI coach will provide personalized insights here.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="p-4 rounded-lg bg-background/50 border">
                <h4 className="font-semibold flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-400" /> {insight.title}</h4>
                <p className="text-sm text-muted-foreground mt-1"><span className="font-medium text-foreground">Finding:</span> {insight.finding}</p>
                <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Suggestion:</span> {insight.suggestion}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
