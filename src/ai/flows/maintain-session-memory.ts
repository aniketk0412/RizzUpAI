'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Message } from '@/types';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';

const MaintainSessionMemoryInputSchema = z.object({
  relation: z.string().describe("The user's relationship with the person they are chatting with (GF, BF, or Friend)."),
  tone: z.string().describe('The desired style of the response (friendly, flirty, rizz, or romantic).'),
  history: z.array(z.custom<Message>()).describe('The previous chat messages in the session.'),
  currentMessage: z.string().describe('The latest message from the user.'),
  userId: z.string().describe('The user ID to manage credits.'),
  image: z.string().optional().describe('An optional image attached by the user, as a data URI.'),
});
export type MaintainSessionMemoryInput = z.infer<typeof MaintainSessionMemoryInputSchema>;

const MaintainSessionMemoryOutputSchema = z.object({
  response: z.string().describe('The AI-generated response.'),
  explanation: z.string().describe('A brief explanation of why this response will work based on the selected relation and tone.'),
});
export type MaintainSessionMemoryOutput = z.infer<typeof MaintainSessionMemoryOutputSchema>;

export async function maintainSessionMemory(input: MaintainSessionMemoryInput): Promise<MaintainSessionMemoryOutput> {
  return maintainSessionMemoryFlow(input);
}

// Server-side Firebase Admin initialization
try {
  if (!getApps().length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      // For local development, it can use application default credentials
      initializeApp();
    }
  }
} catch (e) {
  console.error('Firebase Admin initialization error:', e);
}


const prompt = ai.definePrompt({
  name: 'maintainSessionMemoryPrompt',
  input: { schema: MaintainSessionMemoryInputSchema },
  output: { schema: MaintainSessionMemoryOutputSchema },
  prompt: `You are a creative chat assistant. Your goal is to help a user draft the perfect response by synthesizing information from several key sources:

Primary Instruction: The core of your task is to respond to the message the user has typed. This is the main request you must address.

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

After generating the response, provide a brief explanation (in the 'explanation' field) of *why* this response will work for the chosen relationship and tone.

Your final output should be only the JSON object containing the response and the explanation.
`,
});

const maintainSessionMemoryFlow = ai.defineFlow(
  {
    name: 'maintainSessionMemoryFlow',
    inputSchema: MaintainSessionMemoryInputSchema,
    outputSchema: MaintainSessionMemoryOutputSchema,
  },
  async (input) => {
    try {
      const db = getAdminFirestore();
      const userRef = db.collection('users').doc(input.userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists || (userDoc.data()?.credits ?? 0) < 1) {
        throw new Error('Insufficient credits.');
      }

      await userRef.update({ credits: FieldValue.increment(-1) });

      const { output } = await prompt(input);
      return output!;
    } catch (e: any) {
       console.error("Error in maintainSessionMemoryFlow: ", e);
       // Re-throw the error to be caught by the client
       throw new Error(`Request failed with error: ${e.message}`);
    }
  }
);
