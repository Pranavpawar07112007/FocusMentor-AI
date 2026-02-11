import type { Timestamp } from 'firebase/firestore';

export type SessionStatus = 'idle' | 'initializing' | 'running' | 'paused' | 'stopped';
export type FocusState = 'focus' | 'away' | 'distraction';

export type ActivityCategory = string;

export type CustomCategory = {
  id: string;
  name: string;
  userId: string;
};

export type LogEntry = {
  id: string;
  timestamp: number;
  category: ActivityCategory;
  reasoning: string;
  duration: number; // in seconds
};

export type Goal = {
  description: string;
  targetDuration?: number; // in seconds
  completed: boolean;
};

export type StudySession = {
  id?: string;
  userId: string;
  startTime: Timestamp;
  endTime: Timestamp | null;
  totalFocusTime: number; // in seconds
  status: 'active' | 'paused' | 'completed';
  logs: LogEntry[];
  summary?: string;
  goal?: Goal;
  permissions?: {
    webcam: boolean;
    screen: boolean;
  };
};
