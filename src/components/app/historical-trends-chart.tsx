'use client';

import React, { useMemo, useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { StudySession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { subDays, format, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { Loader } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


const glassmorphismStyle = 'bg-card/30 backdrop-blur-lg border border-border/50 shadow-lg';

export function HistoricalTrendsChart() {
  const { user, firestore } = useFirebase();
  const [timeRange, setTimeRange] = useState('30'); // '7', '30', '90' days

  const dateRange = useMemo(() => {
    const to = new Date();
    const from = subDays(to, parseInt(timeRange));
    return { from, to };
  }, [timeRange]);

  const sessionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    
    const start = startOfDay(dateRange.from);
    const end = endOfDay(dateRange.to);

    return query(
      collection(firestore, 'users', user.uid, 'study_sessions'),
      where('startTime', '>=', start),
      where('startTime', '<=', end),
      orderBy('startTime', 'asc')
    );
  }, [user, firestore, dateRange]);

  const { data: sessions, isLoading } = useCollection<StudySession>(sessionsQuery);

  const chartData = useMemo(() => {
    if (!sessions) return [];

    const intervalDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

    const dailyFocus = intervalDays.map(day => {
      const sessionsOnDay = sessions.filter(s => s.startTime && isSameDay(s.startTime.toDate(), day));
      const totalFocus = sessionsOnDay.reduce((acc, s) => acc + s.totalFocusTime, 0);
      return {
        date: format(day, 'MMM d'),
        totalFocus: Math.round(totalFocus / 60), // in minutes
      };
    });

    return dailyFocus;
  }, [sessions, dateRange]);

  return (
    <Card className={glassmorphismStyle}>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Historical Trends</CardTitle>
                <CardDescription>Your total focus time over the selected period.</CardDescription>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent className="h-80">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader className="animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  borderColor: 'hsl(var(--border))',
                }}
                formatter={(value: number) => [`${value} minutes`, 'Focus Time']}
              />
              <Bar dataKey="totalFocus" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>No session data available for this period.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
