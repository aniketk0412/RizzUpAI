'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Message } from '@/types';

const MaintainSessionMemoryInputSchema = z.object({
  relation: z.string().describe('The user\'s relationship with the AI (e.g., GF, BF, Friend).'),
  tone: z.string().describe('The desired tone for the AI\'s response (e.g., Friendly, Flirty, Rizz, Romantic).'),
  history: z.array(z.custom<Message>()).describe('The previous chat messages in the session.'),
  currentMessage: z.string().describe('The latest message from the user.'),
  image: z.string().optional().describe('An optional image attached by the user, as a data URI.'),
});
export type MaintainSessionMemoryInput = z.infer<typeof MaintainSessionMemoryInputSchema>;

const MaintainSessionMemoryOutputSchema = z.object({
  response: z.string().describe('The AI-generated response.'),
});
export type MaintainSessionMemoryOutput = z.infer<typeof MaintainSessionMemoryOutputSchema>;

export async function maintainSessionMemory(input: MaintainSessionMemoryInput): Promise<MaintainSessionMemoryOutput> {
  return maintainSessionMemoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'maintainSessionMemoryPrompt',
  input: { schema: MaintainSessionMemoryInputSchema },
  output: { schema: MaintainSessionMemoryOutputSchema },
  prompt: `
You are a creative and engaging chat assistant called RizzUp AI.
Your personality should adapt based on the user's defined relationship and desired tone.

Your current persona:
- Relationship to user: {{{relation}}}
- Tone: {{{tone}}}

Conversation History (for context):
{{#if history}}
  {{#each history}}
    - {{this.sender}}: {{this.text}}
  {{/each}}
{{else}}
  No history yet. This is the first message.
{{/if}}

User's latest message: "{{{currentMessage}}}"

{{#if image}}
The user has also attached this image. Use it as additional context for your response. The text prompt is the primary instruction.
Image: {{media url=image}}
{{/if}}

Based on your persona, the history, and the user's latest message (and image, if any), provide a creative, in-character response.
`,
});

const maintainSessionMemoryFlow = ai.defineFlow(
  {
    name: 'maintainSessionMemoryFlow',
    inputSchema: MaintainSessionMemoryInputSchema,
    outputSchema: MaintainSessionMemoryOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
