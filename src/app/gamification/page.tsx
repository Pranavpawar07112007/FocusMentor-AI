'use client';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Loader, Award, Star, Zap, Moon, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppHeader } from '@/components/app/app-header';
import { Button } from '@/components/ui/button';
import { collection, query, where } from 'firebase/firestore';
import { startOfMonth, endOfMonth, getHours } from 'date-fns';
import { StudySession } from '@/types';

export default function GamificationPage() {
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();

  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);

  const currentMonthRange = useMemo(() => {
    const now = new Date();
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  }, []);

  const monthlySessionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'study_sessions'),
      where('startTime', '>=', currentMonthRange.start),
      where('startTime', '<=', currentMonthRange.end)
    );
  }, [user, firestore, currentMonthRange]);

  const { data: monthlySessions, isLoading: isLoadingSessions } = useCollection<StudySession>(monthlySessionsQuery);

  useEffect(() => {
    if (isLoadingSessions || !monthlySessions) {
        setIsLoadingAchievements(true);
        return;
    };
    
    const marathonRunner = monthlySessions.some(s => s.totalFocusTime >= 7200); // 2 hours
    const distractionAvoider = monthlySessions.some(s => s.logs.every(l => l.category !== 'Distraction'));
    const nightOwl = monthlySessions.some(s => s.startTime && getHours(s.startTime.toDate()) >= 0 && getHours(s.startTime.toDate()) < 4);

    const totalFocus = monthlySessions.reduce((acc, s) => acc + s.totalFocusTime, 0) / 3600; // in hours

    const focusLevels = [
      { title: 'Focus Apprentice', description: 'Log 5 hours of focus this month.', achieved: totalFocus >= 5, icon: <Award className="h-8 w-8 text-yellow-500" /> },
      { title: 'Focus Journeyman', description: 'Log 15 hours of focus this month.', achieved: totalFocus >= 15, icon: <Award className="h-8 w-8 text-blue-500" /> },
      { title: 'Focus Master', description: 'Log 30 hours of focus this month.', achieved: totalFocus >= 30, icon: <Award className="h-8 w-8 text-purple-500" /> },
    ];
    
    const sessionDays = [...new Set(monthlySessions.map(s => s.startTime.toDate().getDate()))].sort((a, b) => a - b);
    let maxStreak = 0;
    if (sessionDays.length > 0) {
        maxStreak = 1;
        let currentStreak = 1;
        for (let i = 1; i < sessionDays.length; i++) {
            if (sessionDays[i] === sessionDays[i-1] + 1) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
            }
        }
    }

    const calculatedAchievements = [
      ...focusLevels,
      { icon: <Zap className="h-8 w-8 text-red-500" />, title: 'Marathon Runner', description: 'Complete a session longer than 2 hours.', achieved: marathonRunner },
      { icon: <Star className="h-8 w-8 text-green-500" />, title: 'Distraction Avoider', description: 'Finish a session with zero distractions.', achieved: distractionAvoider },
      { icon: <Moon className="h-8 w-8 text-indigo-500" />, title: 'Night Owl', description: 'Study past midnight.', achieved: nightOwl },
      { icon: <Star className="h-8 w-8 text-orange-500" />, title: 'Focus Streak: 3 Days', description: 'Complete sessions on 3 consecutive days.', achieved: maxStreak >= 3 },
    ];
    setAchievements(calculatedAchievements);
    setIsLoadingAchievements(false);
    
  }, [monthlySessions, isLoadingSessions]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || isLoadingAchievements || isLoadingSessions) {
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
        <div className={`mb-8 rounded-lg p-6 ${glassmorphismStyle}`}>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Your Achievements</h2>
              <p className="text-muted-foreground">
                Achievements reset on the 1st of each month.
              </p>
            </div>
            <Button asChild>
              <Link href="/logs">
                <BookOpen className="mr-2 h-4 w-4" />
                View Monthly Achievement Logs
              </Link>
            </Button>
          </div>
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
