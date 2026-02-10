'use server';

/**
 * @fileOverview Summarizes a study session, highlighting key focus periods and distractions.
 *
 * - summarizeStudySession - A function that takes study session logs and returns a summary.
 * - SummarizeStudySessionInput - The input type for the summarizeStudySession function.
 * - SummarizeStudySessionOutput - The return type for the summarizeStudySession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeStudySessionInputSchema = z.object({
  logs: z.array(
    z.object({
      category: z.string(),
      reasoning: z.string(),
      timestamp: z.number(),
    })
  ).describe('An array of study session logs containing category, reasoning, and timestamp.'),
});
export type SummarizeStudySessionInput = z.infer<typeof SummarizeStudySessionInputSchema>;

const SummarizeStudySessionOutputSchema = z.object({
  summary: z.string().describe('A summary of the study session.'),
});
export type SummarizeStudySessionOutput = z.infer<typeof SummarizeStudySessionOutputSchema>;

export async function summarizeStudySession(input: SummarizeStudySessionInput): Promise<SummarizeStudySessionOutput> {
  return summarizeStudySessionFlow(input);
}

const summarizeStudySessionPrompt = ai.definePrompt({
  name: 'summarizeStudySessionPrompt',
  input: {schema: SummarizeStudySessionInputSchema},
  output: {schema: SummarizeStudySessionOutputSchema},
  prompt: `You are an AI study assistant. You will receive logs from a study session, each containing a category, reasoning, and timestamp. Your task is to summarize the study session, highlighting key focus periods and distractions. Provide a concise overview of the session's effectiveness.

Logs:
{{#each logs}}
- Timestamp: {{timestamp}}, Category: {{category}}, Reasoning: {{reasoning}}
{{/each}}
`,
});

const summarizeStudySessionFlow = ai.defineFlow(
  {
    name: 'summarizeStudySessionFlow',
    inputSchema: SummarizeStudySessionInputSchema,
    outputSchema: SummarizeStudySessionOutputSchema,
  },
  async input => {
    const {output} = await summarizeStudySessionPrompt(input);
    return output!;
  }
);
