import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LogEntry, ActivityCategory } from '@/types';
import { Code, Sigma, Library, Coffee, UserMinus, FileQuestion } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type StatsDashboardProps = {
  logs: LogEntry[];
};

const categoryIcons: Record<string, React.ReactNode> = {
  'Coding': <Code className="h-4 w-4 text-blue-400" />,
  'Mathematics': <Sigma className="h-4 w-4 text-purple-400" />,
  'Academic Research': <Library className="h-4 w-4 text-green-400" />,
  'Distraction': <Coffee className="h-4 w-4 text-red-400" />,
  'Away': <UserMinus className="h-4 w-4 text-amber-400" />,
};

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
};


const StatsDashboard: React.FC<StatsDashboardProps> = ({ logs }) => {
  const chartData = useMemo(() => {
    const data: { [key: string]: number } = {};
    logs.forEach(log => {
      if (log.category) {
        if (!data[log.category]) {
          data[log.category] = 0;
        }
        data[log.category]! += log.duration;
      }
    });

    return Object.entries(data).map(([name, value]) => ({
      name: name,
      minutes: Math.round(value / 60),
    })).sort((a, b) => b.minutes - a.minutes);
  }, [logs]);

  const sortedLogs = useMemo(() => [...logs].reverse(), [logs]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold font-headline mb-4">Session Analytics</h2>
      
      <Card className="flex-grow bg-transparent border-none shadow-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle>Activity Breakdown</CardTitle>
          <CardDescription>Time spent per category.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 h-48">
          {logs.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Bar dataKey="minutes" barSize={20} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No activity data yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex-grow flex flex-col mt-6">
        <h3 className="text-lg font-semibold mb-2">Activity Log</h3>
        <ScrollArea className="flex-grow h-64 pr-4 -mr-4">
          <div className="space-y-4">
            {sortedLogs.length > 0 ? sortedLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div>{categoryIcons[log.category] || <FileQuestion className="h-4 w-4 text-muted-foreground" />}</div>
                <div className="flex-grow">
                  <p className="font-medium">{log.category}</p>
                  <p className="text-muted-foreground text-xs">{log.reasoning}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                  <p>{formatDuration(log.duration)}</p>
                  <p>{formatDistanceToNow(log.timestamp, { addSuffix: true })}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center pt-8">Your session activities will appear here.</p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default StatsDashboard;
