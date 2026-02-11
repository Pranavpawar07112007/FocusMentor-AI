import { cn } from '@/lib/utils';
import { SessionStatus, FocusState } from '@/types';
import React from 'react';

type FocusRingProps = {
  time: number;
  status: SessionStatus;
  focusState: FocusState;
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const FocusRing: React.FC<FocusRingProps> = ({ time, status, focusState }) => {
  const radius = 140;
  const stroke = 20;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = time % 3600; // Progress within the hour
  const strokeDashoffset = circumference - (progress / 3600) * circumference;

  const ringColor = {
    focus: 'text-green-400',
    away: 'text-amber-400',
    distraction: 'text-amber-400',
  };

  const getFocusText = () => {
    if (status === 'paused') return 'Away';
    if (status === 'running') {
      if (focusState === 'distraction') return 'Distracted';
      return 'Focused';
    }
    return 'Idle';
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="hsl(var(--border))"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={cn(
            'transition-all duration-300',
            status === 'running' || status === 'paused' ? ringColor[focusState] : 'text-primary',
            (status === 'paused' || focusState === 'away' || focusState === 'distraction') && 'animate-pulse-amber'
          )}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-5xl font-bold font-mono tracking-tighter text-foreground">
          {formatTime(time)}
        </span>
        <span className="text-lg font-medium text-muted-foreground mt-2">
          {getFocusText()}
        </span>
      </div>
    </div>
  );
};

export default FocusRing;
