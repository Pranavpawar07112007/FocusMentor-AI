'use server';
/**
 * @fileOverview An AI agent that analyzes study sessions and generates personalized insights.
 *
 * - generateInsights - A function that handles the insight generation process.
 * - GenerateInsightsInput - The input type for the generateInsights function.
 * - GenerateInsightsOutput - The return type for the generateInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// We can't pass complex objects with methods like `toDate()` to the flow.
// So we need a plain object schema.
const PlainStudySessionLogSchema = z.object({
  category: z.string(),
  reasoning: z.string(),
  timestamp: z.number(),
  duration: z.number(),
});

const PlainStudySessionSchema = z.object({
  startTime: z.object({ seconds: z.number(), nanoseconds: z.number() }),
  endTime: z.object({ seconds: z.number(), nanoseconds: z.number() }).nullable(),
  totalFocusTime: z.number(),
  logs: z.array(PlainStudySessionLogSchema),
  goal: z.object({
    description: z.string(),
    targetDuration: z.number().optional(),
    completed: z.boolean()
  }).optional(),
});

const GenerateInsightsInputSchema = z.object({
  sessions: z.array(PlainStudySessionSchema).describe('An array of past study sessions.'),
});
export type GenerateInsightsInput = z.infer<typeof GenerateInsightsInputSchema>;

const InsightSchema = z.object({
  title: z.string().describe('A short, catchy title for the insight.'),
  finding: z.string().describe('A one-sentence description of the pattern or finding.'),
  suggestion: z.string().describe('A one-sentence actionable suggestion for the user based on the finding.'),
});

const GenerateInsightsOutputSchema = z.object({
  insights: z.array(InsightSchema).describe('An array of personalized insights and suggestions.'),
});
export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

export async function generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
  return generateInsightsFlow(input);
}

const generateInsightsPrompt = ai.definePrompt({
  name: 'generateInsightsPrompt',
  input: {schema: GenerateInsightsInputSchema},
  output: {schema: GenerateInsightsOutputSchema},
  prompt: `You are a productivity coach. Analyze the user's past study sessions to identify patterns, strengths, and weaknesses. Generate a list of 2-3 actionable insights.

Focus on:
- Productive times of day.
- Common distraction categories or times.
- Patterns in session length or focus duration.
- Relationship between goals and focus.

For each insight, provide a title, a one-sentence finding, and a one-sentence actionable suggestion. Be encouraging and constructive.

Here are the user's study sessions:
{{#each sessions}}
- Session started at {{startTime.seconds}}. Total focus: {{totalFocusTime}} seconds.
  Logs:
  {{#each logs}}
  - {{category}} for {{duration}}s. Reasoning: {{reasoning}}
  {{/each}}
{{/each}}
`,
});

const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: GenerateInsightsInputSchema,
    outputSchema: GenerateInsightsOutputSchema,
  },
  async input => {
    // The prompt works best with a reasonable number of sessions.
    // If there are too many, it can be slow and expensive. Let's cap it.
    const recentSessions = input.sessions.slice(-50); // Analyze last 50 sessions
    
    if (recentSessions.length < 3) {
      return { insights: [] }; // Not enough data for insights
    }
    
    const {output} = await generateInsightsPrompt({ sessions: recentSessions });
    return output!;
  }
);
