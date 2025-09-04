'use server';
/**
 * @fileOverview Image summary flow. This flow takes an image as input and returns a textual summary of the key elements in the image.
 *
 * - summarizeImageContext - A function that handles the image summary process.
 * - SummarizeImageContextInput - The input type for the summarizeImageContext function.
 * - SummarizeImageContextOutput - The return type for the summarizeImageContext function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeImageContextInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to summarize, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SummarizeImageContextInput = z.infer<typeof SummarizeImageContextInputSchema>;

const SummarizeImageContextOutputSchema = z.object({
  summary: z.string().describe('A concise textual summary of the key elements in the image.'),
});
export type SummarizeImageContextOutput = z.infer<typeof SummarizeImageContextOutputSchema>;

export async function summarizeImageContext(input: SummarizeImageContextInput): Promise<SummarizeImageContextOutput> {
  return summarizeImageContextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeImageContextPrompt',
  input: {schema: SummarizeImageContextInputSchema},
  output: {schema: SummarizeImageContextOutputSchema},
  prompt: `You are an AI assistant that specializes in summarizing images.

  Please provide a concise textual summary of the key elements in the image provided.

  Image: {{media url=photoDataUri}}`,
});

const summarizeImageContextFlow = ai.defineFlow(
  {
    name: 'summarizeImageContextFlow',
    inputSchema: SummarizeImageContextInputSchema,
    outputSchema: SummarizeImageContextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
