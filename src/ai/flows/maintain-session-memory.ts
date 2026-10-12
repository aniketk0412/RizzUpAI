'use server';

import { Type } from '@google/genai';
import { eq, sql } from 'drizzle-orm';
import { generateStructuredJSON } from '@/ai/gemini';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import type { ReplyOption } from '@/types';

export interface MaintainSessionMemoryInput {
  relation: string;
  tone: string;
  currentMessage: string;
  userId: string;
  image?: string;
}

export interface MaintainSessionMemoryOutput {
  response: string;
  explanation: string;
  options: ReplyOption[];
  remainingCredits?: number;
}

export async function maintainSessionMemory(
  input: MaintainSessionMemoryInput
): Promise<MaintainSessionMemoryOutput> {
  try {
    let remainingCredits: number | undefined;

    if (isDatabaseConfigured() && input.userId) {
      const [userRecord] = await db
        .select({ credits: users.credits })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!userRecord || userRecord.credits < 1) {
        throw new Error('Insufficient credits.');
      }

      const [updated] = await db
        .update(users)
        .set({
          credits: sql`${users.credits} - 1`,
        })
        .where(eq(users.id, input.userId))
        .returning({ credits: users.credits });

      remainingCredits = updated?.credits;
    }

    const promptText = `You are RizzUp AI, an elite, charismatic wingman.
Craft 3 distinct, ready-to-send reply options for the user based on:
- Relationship: ${input.relation} (GF, BF, or Friend)
- Target Vibe/Tone: ${input.tone} (Friendly, Flirty, Rizz, or Romantic)
- Message / Context to reply to: "${input.currentMessage || 'Analyze the attached screenshot and give me 3 killer replies.'}"

Rules:
1. Option 1 (Playful & Casual): Low pressure, light teasing, effortless banter.
2. Option 2 (Smooth & Charming): The sweet spot — confident, magnetic, and engaging.
3. Option 3 (Bold & High Energy): Witty, daring, high-rizz energy that stands out.
4. Keep replies natural, punchy, and authentic to real modern texting (no robotic AI clichés or corny pickup lines).
5. Return strictly valid JSON matching:
{
  "response": "Best overall reply",
  "explanation": "Quick 1-line strategy tip for this situation",
  "options": [
    { "label": "Playful Banter", "text": "...", "vibeReason": "..." },
    { "label": "Smooth & Charming", "text": "...", "vibeReason": "..." },
    { "label": "Bold & Flirty", "text": "...", "vibeReason": "..." }
  ]
}`;

    const result = await generateStructuredJSON({
      prompt: promptText,
      systemInstruction:
        'You are RizzUp AI, an elite dating & texting wingman. Return only raw JSON matching { response, explanation, options: [{ label, text, vibeReason }] }.',
      imageDataUri: input.image,
      geminiSchema: {
        type: Type.OBJECT,
        properties: {
          response: {
            type: Type.STRING,
            description: 'The top recommended reply.',
          },
          explanation: {
            type: Type.STRING,
            description: 'Brief 1-sentence strategic takeaway.',
          },
          options: {
            type: Type.ARRAY,
            description: 'Exactly 3 distinct reply options.',
            items: {
              type: Type.OBJECT,
              properties: {
                label: {
                  type: Type.STRING,
                  description: 'Short vibe title, e.g. "Playful Banter", "Smooth & Charming", "Bold & Flirty"',
                },
                text: {
                  type: Type.STRING,
                  description: 'The exact message reply ready to copy and send',
                },
                vibeReason: {
                  type: Type.STRING,
                  description: '1-sentence explanation of why this option works',
                },
              },
              required: ['label', 'text', 'vibeReason'],
            },
          },
        },
        required: ['response', 'explanation', 'options'],
      },
    });

    const output = JSON.parse(result.text || '{}');

    const options: ReplyOption[] =
      Array.isArray(output.options) && output.options.length > 0
        ? output.options
        : [
            {
              label: 'Playful',
              text: output.response || 'Tell me more 👀',
              vibeReason: output.explanation || 'Casual and lighthearted',
            },
            {
              label: 'Smooth',
              text: output.response || 'Tell me more 👀',
              vibeReason: 'Charming and confident',
            },
            {
              label: 'Bold',
              text: output.response || 'Tell me more 👀',
              vibeReason: 'High energy and memorable',
            },
          ];

    return {
      response: output.response || options[1]?.text || options[0]?.text,
      explanation: output.explanation || 'Pick the vibe that fits your move:',
      options,
      remainingCredits,
    };
  } catch (e: any) {
    console.error('Error in maintainSessionMemory:', e);
    throw new Error(e.message || 'Failed to generate AI response.');
  }
}
