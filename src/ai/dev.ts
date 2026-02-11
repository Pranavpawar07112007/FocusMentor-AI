import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-screen-activity.ts';
import '@/ai/flows/summarize-study-session.ts';
import '@/ai/flows/decompose-goal-flow.ts';
import '@/ai/flows/generate-insights-flow.ts';
