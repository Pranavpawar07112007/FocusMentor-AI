'use client';

import { StudySession } from '@/types';
import { Award, Zap, Star, Moon } from 'lucide-react';
import { getHours, startOfDay } from 'date-fns';
import React from 'react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  check: (sessions: StudySession[]) => boolean;
}

export const achievements: Achievement[] = [
  {
    id: 'focus_apprentice',
    title: 'Focus Apprentice',
    description: 'Log 5 hours of focus this month.',
    icon: <Award className="h-8 w-8 text-yellow-500" />,
    check: (sessions) => {
      const totalFocus = sessions.reduce((acc, s) => acc + s.totalFocusTime, 0);
      return totalFocus / 3600 >= 5;
    },
  },
  {
    id: 'focus_journeyman',
    title: 'Focus Journeyman',
    description: 'Log 15 hours of focus this month.',
    icon: <Award className="h-8 w-8 text-blue-500" />,
    check: (sessions) => {
      const totalFocus = sessions.reduce((acc, s) => acc + s.totalFocusTime, 0);
      return totalFocus / 3600 >= 15;
    },
  },
  {
    id: 'focus_master',
    title: 'Focus Master',
    description: 'Log 30 hours of focus this month.',
    icon: <Award className="h-8 w-8 text-purple-500" />,
    check: (sessions) => {
      const totalFocus = sessions.reduce((acc, s) => acc + s.totalFocusTime, 0);
      return totalFocus / 3600 >= 30;
    },
  },
  {
    id: 'marathon_runner',
    title: 'Marathon Runner',
    description: 'Complete a session longer than 2 hours.',
    icon: <Zap className="h-8 w-8 text-red-500" />,
    check: (sessions) => sessions.some(s => s.totalFocusTime >= 7200),
  },
  {
    id: 'distraction_avoider',
    title: 'Distraction Avoider',
    description: 'Finish a session with zero distractions.',
    icon: <Star className="h-8 w-8 text-green-500" />,
    check: (sessions) => sessions.some(s => s.logs.every(l => l.category !== 'Distraction')),
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Study past midnight.',
    icon: <Moon className="h-8 w-8 text-indigo-500" />,
    check: (sessions) => sessions.some(s => s.startTime && getHours(s.startTime.toDate()) >= 0 && getHours(s.startTime.toDate()) < 4),
  },
  {
    id: 'focus_streak_3',
    title: 'Focus Streak: 3 Days',
    description: 'Complete sessions on 3 consecutive days.',
    icon: <Star className="h-8 w-8 text-orange-500" />,
    check: (sessions) => {
      if (!sessions || sessions.length === 0) return false;
      const uniqueDays = [...new Set(sessions.map(s => startOfDay(s.startTime.toDate()).getTime()))]
        .sort()
        .map(t => new Date(t));

      if (uniqueDays.length < 3) return false;
      
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
      return maxStreak >= 3;
    },
  },
];

export interface DisplayAchievement extends Achievement {
    achieved: boolean;
}

export const calculateAchievements = (sessions: StudySession[] | null): DisplayAchievement[] => {
    if (!sessions) {
        return achievements.map(achievement => ({
            ...achievement,
            achieved: false,
        }));
    }

  return achievements.map(achievement => ({
    ...achievement,
    achieved: achievement.check(sessions),
  }));
};
