'use client';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { StudySession } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, getHours, startOfDay } from 'date-fns';
import { Loader, Award, Star, Zap, Moon, ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/app/app-header';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function MonthlyAchievementLogsPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);

  const selectedMonthRange = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return { start, end };
  }, [selectedDate]);

  const sessionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    
    return query(
      collection(firestore, 'users', user.uid, 'study_sessions'),
      where('startTime', '>=', selectedMonthRange.start),
      where('startTime', '<=', selectedMonthRange.end)
    );
  }, [user, firestore, selectedMonthRange]);

  const { data: sessions, isLoading: isLoadingSessions } = useCollection<StudySession>(sessionsQuery);

  useEffect(() => {
    if (isLoadingSessions || !sessions) {
        if (!isLoadingSessions) {
          setAchievements([]);
          setIsLoadingAchievements(false);
        } else {
          setIsLoadingAchievements(true);
        }
        return;
    };
    
    const marathonRunner = sessions.some(s => s.totalFocusTime >= 7200); // 2 hours
    const distractionAvoider = sessions.some(s => s.logs.every(l => l.category !== 'Distraction'));
    const nightOwl = sessions.some(s => s.startTime && getHours(s.startTime.toDate()) >= 0 && getHours(s.startTime.toDate()) < 4);

    const totalFocus = sessions.reduce((acc, s) => acc + s.totalFocusTime, 0) / 3600; // in hours

    const focusLevels = [
      { title: 'Focus Apprentice', description: 'Log 5 hours of focus this month.', achieved: totalFocus >= 5, icon: <Award className="h-8 w-8 text-yellow-500" /> },
      { title: 'Focus Journeyman', description: 'Log 15 hours of focus this month.', achieved: totalFocus >= 15, icon: <Award className="h-8 w-8 text-blue-500" /> },
      { title: 'Focus Master', description: 'Log 30 hours of focus this month.', achieved: totalFocus >= 30, icon: <Award className="h-8 w-8 text-purple-500" /> },
    ];
    
    const uniqueDays = [...new Set(sessions.map(s => startOfDay(s.startTime.toDate()).getTime()))]
        .sort()
        .map(t => new Date(t));

    let maxStreak = 0;
    if (uniqueDays.length > 0) {
        maxStreak = 1;
        let currentStreak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
            const dayBefore = new Date(uniqueDays[i]);
            dayBefore.setDate(dayBefore.getDate() - 1);
            if (dayBefore.getTime() === uniqueDays[i-1].getTime()) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            maxStreak = Math.max(maxStreak, currentStreak);
        }
    }

    const calculatedAchievements = [
      ...focusLevels,
      { icon: <Zap className="h-8 w-8 text-red-500" />, title: 'Marathon Runner', description: 'Complete a session longer than 2 hours.', achieved: marathonRunner },
      { icon: <Star className="h-8 w-8 text-green-500" />, title: 'Distraction Avoider', description: 'Finish a session with zero distractions.', achieved: distractionAvoider },
      { icon: <Moon className="h-8 w-8 text-indigo-500" />, title: 'Night Owl', description: 'Study past midnight.', achieved: nightOwl },
      { icon: <Star className="h-8 w-8 text-orange-500" />, title: 'Focus Streak: 3 Days', description: 'Complete sessions on 3 consecutive days.', achieved: maxStreak >= 3 },
    ];
    setAchievements(calculatedAchievements.filter(a => a.achieved));
    setIsLoadingAchievements(false);
    
  }, [sessions, isLoadingSessions]);

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

  const glassmorphismStyle = 'bg-card/30 backdrop-blur-lg border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1';

  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <AppHeader activePage="achievements" />
      <main className="container mx-auto max-w-4xl flex-grow px-4 pt-24 sm:px-6 lg:px-8">
        <Card className={glassmorphismStyle}>
          <CardHeader>
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <CardTitle>Monthly Achievement Log</CardTitle>
                <CardDescription>
                  Achievements you earned in {format(selectedDate, 'MMMM yyyy')}.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={String(selectedDate.getMonth())}
                  onValueChange={(value) => {
                    const newDate = new Date(selectedDate.getFullYear(), parseInt(value, 10), 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {format(new Date(2000, i, 1), 'MMMM')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(selectedDate.getFullYear())}
                  onValueChange={(value) => {
                    const newDate = new Date(parseInt(value, 10), selectedDate.getMonth(), 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button asChild variant="outline">
                  <Link href="/gamification">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-h-[20rem] flex items-center justify-center">
             {(isLoadingSessions || isLoadingAchievements) ? (
                <Loader className="h-8 w-8 animate-spin" />
             ) : achievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {achievements.map((achievement, index) => (
                    <Card key={index} className={`${glassmorphismStyle}`}>
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
              ) : (
                <div className="text-sm text-muted-foreground">
                  <p>No achievements earned in {format(selectedDate, 'MMMM yyyy')}.</p>
                </div>
              )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
