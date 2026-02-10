'use client';

import React from 'react';
import { StudySession, ActivityCategory, Goal } from '@/types';
import { WithId } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Code, Sigma, Library, Coffee, UserMinus, Clock, Goal as GoalIcon, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type SessionReportProps = {
  session: WithId<StudySession>;
};

const categoryIcons: Record<ActivityCategory, React.ReactNode> = {
  'Coding': <Code className="h-5 w-5 text-blue-400" />,
  'Mathematics': <Sigma className="h-5 w-5 text-purple-400" />,
  'Academic Research': <Library className="h-5 w-5 text-green-400" />,
  'Distraction': <Coffee className="h-5 w-5 text-red-400" />,
  'Away': <UserMinus className="h-5 w-5 text-amber-400" />,
};

const COLORS: Record<ActivityCategory, string> = {
    'Coding': '#60a5fa', // blue-400
    'Mathematics': '#c084fc', // purple-400
    'Academic Research': '#4ade80', // green-400
    'Distraction': '#f87171', // red-400
    'Away': '#facc15', // amber-400
};

const formatDuration = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

export function SessionReport({ session }: SessionReportProps) {
    const glassmorphismStyle = 'bg-card/30 backdrop-blur-lg border border-border/50 shadow-lg';

    const activityData = React.useMemo(() => {
        const data: { [key in ActivityCategory]?: number } = {};
        session.logs.forEach(log => {
            if (!data[log.category]) {
                data[log.category] = 0;
            }
            data[log.category]! += log.duration;
        });

        return Object.entries(data).map(([name, value]) => ({
            name: name as ActivityCategory,
            value: Math.round(value / 60), // value in minutes
        })).filter(item => item.value > 0);
    }, [session.logs]);

  const totalSessionDuration = session.endTime && session.startTime ? (session.endTime.toMillis() - session.startTime.toMillis()) / 1000 : session.totalFocusTime;
  const focusPercentage = totalSessionDuration > 0 ? Math.round((session.totalFocusTime / totalSessionDuration) * 100) : 0;

  return (
    <div className="space-y-8">
      <Card className={glassmorphismStyle}>
        <CardHeader>
            <CardTitle className="text-3xl">Session Report</CardTitle>
            <CardDescription>{session.startTime ? format(session.startTime.toDate(), 'MMMM d, yyyy - p') : 'Session'}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background/50">
                <Clock className="h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">{formatDuration(totalSessionDuration)}</p>
                <p className="text-sm text-muted-foreground">Total Duration</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background/50">
                <Clock className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-2xl font-bold">{formatDuration(session.totalFocusTime)}</p>
                <p className="text-sm text-muted-foreground">Focused Time</p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">{focusPercentage}%</div>
                <p className="text-sm text-muted-foreground">Focus Efficiency</p>
            </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className={`lg:col-span-2 ${glassmorphismStyle}`}>
          <CardHeader>
            <CardTitle>Activity Breakdown</CardTitle>
            <CardDescription>Time spent in each category (in minutes).</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={activityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} minutes`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 flex flex-col gap-8">
            <Card className={glassmorphismStyle}>
                <CardHeader>
                    <CardTitle>AI Summary</CardTitle>
                    <CardDescription>An AI-generated overview of your session.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground italic">
                        {session.summary || "No summary was generated for this session."}
                    </p>
                </CardContent>
            </Card>

            {session.goal && (
                <Card className={glassmorphismStyle}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GoalIcon />
                            Session Goal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">{session.goal.description}</p>
                        {session.goal.completed ? (
                            <Badge variant="secondary" className="border-green-500/50 text-green-700 dark:text-green-400">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Completed
                            </Badge>
                        ) : (
                             <Badge variant="outline">Not Completed</Badge>
                        )}
                        {session.goal.targetDuration && (
                            <p className="text-xs text-muted-foreground mt-2">Target: {formatDuration(session.goal.targetDuration)}</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
      </div>

      <Card className={glassmorphismStyle}>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>A chronological log of your session activities.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-6 relative pl-6 before:absolute before:inset-y-0 before:w-px before:bg-border before:left-2">
              {session.logs.sort((a, b) => a.timestamp - b.timestamp).map((log, index) => (
                <div key={log.id || index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-background/50 flex items-center justify-center -ml-5 ring-4 ring-background">
                    {categoryIcons[log.category]}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">{log.category}</p>
                        <Badge variant="outline">{formatDuration(log.duration)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.reasoning}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(log.timestamp), 'p')}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
