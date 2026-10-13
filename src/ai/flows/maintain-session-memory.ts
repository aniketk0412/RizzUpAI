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
  error?: string;
}

export async function maintainSessionMemory(
  input: MaintainSessionMemoryInput
): Promise<MaintainSessionMemoryOutput> {
  try {
    let remainingCredits: number | undefined;

    // 1. Verify credits BEFORE calling AI (do not deduct until AI succeeds)
    if (isDatabaseConfigured() && input.userId) {
      const [userRecord] = await db
        .select({ credits: users.credits })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!userRecord || userRecord.credits < 1) {
        return {
          response: '',
          explanation: '',
          options: [],
          error: 'Insufficient credits. Wait for the daily refill or top up.',
        };
      }
    }

    const promptText = `You are RizzUp, an effortless, sharp texting wingman.
Write 3 distinct, ready-to-send replies for this situation:
- Who they are: ${input.relation}
- Vibe: ${input.tone}
- Their message / context: "${input.currentMessage || 'Read the screenshot and write 3 replies that fit the conversation.'}"

Strict Style Rules (NO AI SLOP):
1. Sound like a real, socially calibrated person texting on iMessage, IG DMs, or Hinge — NEVER like ChatGPT.
2. Keep every reply short (1 to 2 punchy sentences max, under 22 words).
3. BANNED clichés: Never say "partner in crime", "strict NDA", "vodka rigatoni", "dangerous game", "careful what you wish for", "raise the stakes", or corny pickup lines.
4. Match natural texting style: casual phrasing, effortless push-pull, dry humor, zero try-hard energy.
5. Give 3 distinct angles:
   - Option 1 ("Chill"): Playful tease or dry humor, low pressure.
   - Option 2 ("Smooth"): Confident, natural charm that moves the vibe forward.
   - Option 3 ("Bold"): Direct, flirty, or smoothly setting up a link-up/date.
6. Keep "vibeReason" to 4–7 words max (e.g., "Playful push-pull, zero pressure").

Return strictly valid JSON:
{
  "response": "Best overall reply",
  "explanation": "Short 6-word read on their message",
  "options": [
    { "label": "Chill", "text": "...", "vibeReason": "..." },
    { "label": "Smooth", "text": "...", "vibeReason": "..." },
    { "label": "Bold", "text": "...", "vibeReason": "..." }
  ]
}`;

    const result = await generateStructuredJSON({
      prompt: promptText,
      systemInstruction:
        'You write real, natural modern texts (iMessage/Hinge/IG style). Zero corny AI clichés. Return only raw JSON matching { response, explanation, options: [{ label, text, vibeReason }] }.',
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
                  description: 'Short vibe title: "Chill", "Smooth", or "Bold"',
                },
                text: {
                  type: Type.STRING,
                  description: 'The exact message reply ready to copy and send',
                },
                vibeReason: {
                  type: Type.STRING,
                  description: '4-7 word note on why this line works',
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
              label: 'Chill',
              text: output.response || 'tell me more 👀',
              vibeReason: output.explanation || 'Casual and low pressure',
            },
            {
              label: 'Smooth',
              text: output.response || 'tell me more 👀',
              vibeReason: 'Confident and natural',
            },
            {
              label: 'Bold',
              text: output.response || 'tell me more 👀',
              vibeReason: 'Direct and memorable',
            },
          ];

    // 2. Deduct 1 credit ONLY after AI successfully generated the 3 replies
    if (isDatabaseConfigured() && input.userId) {
      const [updated] = await db
        .update(users)
        .set({
          credits: sql`GREATEST(0, ${users.credits} - 1)`,
        })
        .where(eq(users.id, input.userId))
        .returning({ credits: users.credits });

      remainingCredits = updated?.credits;
    }

    return {
      response: output.response || options[1]?.text || options[0]?.text,
      explanation: output.explanation || 'Pick the line that fits your move:',
      options,
      remainingCredits,
    };
  } catch (e: any) {
    console.error('Error in maintainSessionMemory:', e);
    return {
      response: '',
      explanation: '',
      options: [],
      error: e.message || 'Failed to generate AI response.',
    };
  }
}
