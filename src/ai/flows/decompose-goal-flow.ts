'use server';
/**
 * @fileOverview An AI agent that decomposes a high-level goal into smaller, actionable sub-tasks.
 *
 * - decomposeGoal - A function that handles the goal decomposition process.
 * - DecomposeGoalInput - The input type for the decomposeGoal function.
 * - DecomposeGoalOutput - The return type for the decomposeGoal function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DecomposeGoalInputSchema = z.object({
  goal: z.string().describe('The high-level goal to decompose.'),
});
export type DecomposeGoalInput = z.infer<typeof DecomposeGoalInputSchema>;

const DecomposeGoalOutputSchema = z.object({
  subTasks: z.array(z.object({
    title: z.string().describe('A short, actionable title for the sub-task.'),
    description: z.string().describe('A brief description of what the sub-task entails.'),
  })).describe('An array of decomposed sub-tasks.'),
});
export type DecomposeGoalOutput = z.infer<typeof DecomposeGoalOutputSchema>;

export async function decomposeGoal(input: DecomposeGoalInput): Promise<DecomposeGoalOutput> {
  return decomposeGoalFlow(input);
}

const decomposeGoalPrompt = ai.definePrompt({
  name: 'decomposeGoalPrompt',
  input: {schema: DecomposeGoalInputSchema},
  output: {schema: DecomposeGoalOutputSchema},
  prompt: `You are an expert productivity assistant. A user has provided a high-level goal. Your task is to break this goal down into a series of smaller, concrete, and actionable sub-tasks that can be completed in individual study sessions (typically 1-2 hours each).

For the goal "{{goal}}", generate a list of sub-tasks. Each sub-task should have a clear title and a short description.`,
});

const decomposeGoalFlow = ai.defineFlow(
  {
    name: 'decomposeGoalFlow',
    inputSchema: DecomposeGoalInputSchema,
    outputSchema: DecomposeGoalOutputSchema,
  },
  async input => {
    const {output} = await decomposeGoalPrompt(input);
    return output!;
  }
);
