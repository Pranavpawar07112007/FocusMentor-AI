'use server';

/**
 * @fileOverview An AI agent that analyzes the screen content and categorizes the activity.
 *
 * - analyzeScreenActivity - A function that handles the screen analysis process.
 * - AnalyzeScreenActivityInput - The input type for the analyzeScreenActivity function.
 * - AnalyzeScreenActivityOutput - The return type for the analyzeScreenActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeScreenActivityInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A screenshot of the user\'s screen, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected the data URI description
    ),
});
export type AnalyzeScreenActivityInput = z.infer<typeof AnalyzeScreenActivityInputSchema>;

const AnalyzeScreenActivityOutputSchema = z.object({
  category: z
    .enum(['Coding', 'Mathematics', 'Academic Research', 'Distraction'])
    .describe('The category of the activity.'),
  reasoning: z.string().describe('The reasoning behind the categorization.'),
});
export type AnalyzeScreenActivityOutput = z.infer<typeof AnalyzeScreenActivityOutputSchema>;

export async function analyzeScreenActivity(
  input: AnalyzeScreenActivityInput
): Promise<AnalyzeScreenActivityOutput> {
  return analyzeScreenActivityFlow(input);
}

const analyzeScreenActivityPrompt = ai.definePrompt({
  name: 'analyzeScreenActivityPrompt',
  input: {schema: AnalyzeScreenActivityInputSchema},
  output: {schema: AnalyzeScreenActivityOutputSchema},
  prompt: `Analyze this screen. Categorize the activity as 'Coding', 'Mathematics', 'Academic Research', or 'Distraction'. Return only a JSON object: {category: string, reasoning: string}.\n\nScreen: {{media url=photoDataUri}}`,
});

const analyzeScreenActivityFlow = ai.defineFlow(
  {
    name: 'analyzeScreenActivityFlow',
    inputSchema: AnalyzeScreenActivityInputSchema,
    outputSchema: AnalyzeScreenActivityOutputSchema,
  },
  async input => {
    const {output} = await analyzeScreenActivityPrompt(input);
    return output!;
  }
);
