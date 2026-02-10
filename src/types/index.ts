import type { Timestamp } from 'firebase/firestore';

export type SessionStatus = 'idle' | 'initializing' | 'running' | 'paused' | 'stopped';
export type FocusState = 'focus' | 'away' | 'distraction';

export type ActivityCategory = 'Coding' | 'Mathematics' | 'Academic Research' | 'Distraction' | 'Away';

export type LogEntry = {
  id: string;
  timestamp: number;
  category: ActivityCategory;
  reasoning: string;
  duration: number; // in seconds
};

export type StudySession = {
  id?: string;
  userId: string; // Assuming you'll have user auth later
  startTime: Timestamp;
  endTime: Timestamp | null;
  totalFocusTime: number; // in seconds
  status: 'active' | 'paused' | 'completed';
  logs: LogEntry[];
};
