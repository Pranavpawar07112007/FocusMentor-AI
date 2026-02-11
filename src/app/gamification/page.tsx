'use client';

import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader, Award, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppHeader } from '@/components/app/app-header';

const achievements = [
  { icon: <Award className="h-8 w-8 text-yellow-500" />, title: 'First Focus', description: 'Complete your first study session.', achieved: true },
  { icon: <Zap className="h-8 w-8 text-blue-500" />, title: 'Quick Starter', description: 'Start a session within 5 minutes of opening the app.', achieved: true },
  { icon: <Star className="h-8 w-8 text-green-500" />, title: 'Focus Streak: 3 Days', description: 'Complete a session for 3 days in a row.', achieved: false },
  { icon: <Award className="h-8 w-8 text-purple-500" />, title: 'Marathon Runner', description: 'Complete a session longer than 2 hours.', achieved: false },
  { icon: <Zap className="h-8 w-8 text-red-500" />, title: 'Distraction Avoider', description: 'Finish a session with zero distractions.', achieved: false },
  { icon: <Star className="h-8 w-8 text-orange-500" />, title: 'Night Owl', description: 'Study past midnight.', achieved: false },
];


export default function GamificationPage() {
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
  
  const glassmorphismStyle = 'bg-card/30 backdrop-blur-lg border border-border/50 shadow-lg';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader activePage="achievements" />
      <main className="container mx-auto max-w-4xl flex-grow px-4 pt-24 sm:px-6 lg:px-8">
        <div className={`mb-8 rounded-lg p-6 ${glassmorphismStyle}`}>
          <h2 className="text-3xl font-bold tracking-tight">Your Achievements</h2>
          <p className="text-muted-foreground">
            Track your progress and earn badges for your hard work.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement, index) => (
            <Card key={index} className={`${glassmorphismStyle} ${achievement.achieved ? '' : 'opacity-50'}`}>
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                {achievement.icon}
                <CardTitle className="text-lg">{achievement.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{achievement.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
