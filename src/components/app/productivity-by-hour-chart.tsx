'use client';

import React, { useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { StudySession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { getHours } from 'date-fns';
import { Loader } from 'lucide-react';

const glassmorphismStyle = 'bg-card/30 backdrop-blur-lg border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1';

export function ProductivityByHourChart() {
  const { user, firestore } = useFirebase();

  const sessionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    
    return query(
      collection(firestore, 'users', user.uid, 'study_sessions'),
      orderBy('startTime', 'asc')
    );
  }, [user, firestore]);

  const { data: sessions, isLoading } = useCollection<StudySession>(sessionsQuery);

  const chartData = useMemo(() => {
    if (!sessions) return [];

    const hours = Array.from({ length: 24 }, (_, i) => {
        const hour = i;
        let name: string;
        if (hour === 0) name = '12am';
        else if (hour === 12) name = '12pm';
        else if (hour < 12) name = `${hour}am`;
        else name = `${hour - 12}pm`;

        return {
            hour,
            name,
            totalFocus: 0,
        };
    });
    
    sessions.forEach(session => {
        if (session.startTime) {
            const hour = getHours(session.startTime.toDate());
            const focusMinutes = Math.round(session.totalFocusTime / 60);
            if (hours[hour]) {
                hours[hour].totalFocus += focusMinutes;
            }
        }
    });

    return hours;
  }, [sessions]);

  return (
    <Card className={glassmorphismStyle}>
      <CardHeader>
        <CardTitle>AI Scheduling Suggestions</CardTitle>
        <CardDescription>Your most productive hours based on historical data.</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader className="animate-spin" />
          </div>
        ) : sessions && sessions.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} interval={1} angle={-45} textAnchor="end" height={50} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  borderColor: 'hsl(var(--border))',
                }}
                formatter={(value: number, name, props) => [`${value} minutes of focus`, `Time: ${props.payload.name}`]}
                labelFormatter={() => ''}
              />
              <Bar dataKey="totalFocus" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Not enough data to provide suggestions. Complete more sessions!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
