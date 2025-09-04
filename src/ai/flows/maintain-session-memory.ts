'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Message } from '@/types';

const MaintainSessionMemoryInputSchema = z.object({
  relation: z.string().describe("The user's relationship with the person they are chatting with (GF, BF, or Friend)."),
  tone: z.string().describe('The desired style of the response (friendly, flirty, rizz, or romantic).'),
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
  prompt: `You are a creative chat assistant. Your goal is to help a user draft the perfect response by synthesizing information from several key sources:

Primary Instruction: The core of your task is to respond to the message the user has typed. This is the main request you must address. Your response should be shaped by this.

Contextual Modifiers: You must shape your reply based on two critical user selections:
- Relation: The user's relationship with the person they are chatting with is {{{relation}}}.
- Tone: The desired style of the response is {{{tone}}}.

Supporting Context:
- Chat History: Use the previous messages in the conversation to maintain memory and ensure your response is relevant and coherent.
{{#if history}}
  {{#each history}}
    - {{this.sender}}: {{this.text}}
  {{/each}}
{{else}}
  This is the first message.
{{/if}}
- Attached Image: If an image is provided, use it as additional visual context to better understand the user's situation and enrich your reply. The text message, however, remains the primary instruction.
{{#if image}}
Image: {{media url=image}}
{{/if}}

User's typed message: "{{{currentMessage}}}"

Your final output should be only the text for the response, with no extra formatting or explanations.
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
